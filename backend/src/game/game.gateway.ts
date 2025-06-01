import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WsException
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { GameEvents, Player, RoundStartEvent, RoundEndEvent } from './types';
import { GameStateService } from './game-state.service';
import { GAME_CONSTANTS } from './constants';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'game'
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);
  private autoStartTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly gameService: GameService,
    private readonly gameStateService: GameStateService
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('Game WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const player = this.gameService.removePlayer(client.id);
    if (player) {
      const allPlayers = this.gameService.getAllPlayers();
      this.gameStateService.updatePlayers(allPlayers);
      this.broadcastPlayerUpdate();
      
      // If game hasn't started, check if we need to cancel auto-start
      if (!this.gameStateService.isGameInProgress() && this.autoStartTimeout) {
        if (this.gameService.getPlayerCount() < GAME_CONSTANTS.MIN_PLAYERS_TO_START) {
          clearTimeout(this.autoStartTimeout);
          this.autoStartTimeout = null;
          
          this.server.emit(GameEvents.GAME_AUTO_START_CANCELLED, {
            message: 'Auto-start cancelled: Not enough players',
            currentPlayers: this.gameService.getPlayerCount()
          });
        }
      }
      
      this.logger.debug(
        `Player ${player.username} disconnected. Remaining players: ${this.gameService.getPlayerCount()}`
      );
    }
  }

  @SubscribeMessage('join_game')
  handleJoinGame(client: Socket, username: string): void {
    try {
      if (this.gameStateService.isGameInProgress()) {
        throw new Error('Cannot join: Game is already in progress');
      }

      if (!username || username.trim().length < 2) {
        throw new Error('Invalid username');
      }

      const player = this.gameService.createPlayer(client.id, username.trim());
      const allPlayers = this.gameService.getAllPlayers();
      this.gameStateService.updatePlayers(allPlayers);
      
      // Send success response to the joining player
      client.emit('join_game_success', player);
      
      // Broadcast player update to all clients
      this.broadcastPlayerUpdate();

      // Check for auto-start condition
      this.checkAutoStart();

      this.logger.debug(
        `Player ${username} joined. Total players: ${this.gameService.getPlayerCount()}`
      );
    } catch (error) {
      client.emit(GameEvents.ERROR, {
        message: error.message,
        code: 'JOIN_GAME_ERROR'
      });
    }
  }

  private broadcastPlayerUpdate(): void {
    const players = this.gameService.getAllPlayers();
    this.server.emit(GameEvents.PLAYER_UPDATE, {
      players,
      totalPlayers: players.length
    });
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(client: Socket): void {
    client.emit('heartbeat_ack', { timestamp: new Date() });
  }

  @SubscribeMessage('start_game')
  handleStartGame(client: Socket): void {
    const playerCount = this.gameService.getPlayerCount();
    this.logger.debug(`Start game requested. Current players: ${playerCount}`);

    if (this.gameStateService.isGameInProgress()) {
      client.emit(GameEvents.ERROR, {
        message: 'Game is already in progress',
        code: 'GAME_IN_PROGRESS'
      });
      return;
    }

    if (!this.gameStateService.canStartGame()) {
      client.emit(GameEvents.ERROR, {
        message: `Need ${GAME_CONSTANTS.MIN_PLAYERS_TO_START} players to start the game. Current players: ${playerCount}`,
        code: 'CANNOT_START_GAME'
      });
      return;
    }

    if (this.gameStateService.startGame()) {
      const gameStartData = {
        totalRounds: GAME_CONSTANTS.TOTAL_ROUNDS,
        players: this.gameService.getAllPlayers(),
        currentRound: 0
      };

      this.server.emit(GameEvents.GAME_START, gameStartData);
      this.logger.debug('Game started, initiating first round');
      
      // Start the round flow
      setTimeout(() => this.handleRoundFlow(), GAME_CONSTANTS.COUNTDOWN_DURATION);
    }
  }

  private async handleRoundFlow(): Promise<void> {
    try {
      // Start new round
      this.gameStateService.startNewRound();
      const roundNumber = this.gameStateService.getState().currentRound;
      
      // Broadcast round start
      const roundStartEvent: RoundStartEvent = {
        roundNumber,
        totalRounds: GAME_CONSTANTS.TOTAL_ROUNDS,
        spinDuration: GAME_CONSTANTS.ROUND_DURATION
      };
      this.server.emit(GameEvents.ROUND_START, roundStartEvent);
      
      // Wait for spinning period
      await new Promise(resolve => setTimeout(resolve, GAME_CONSTANTS.ROUND_DURATION));
      
      // Determine winner
      const roundResult = this.gameStateService.determineRoundWinner();
      
      // Broadcast round result
      const roundEndEvent: RoundEndEvent = {
        ...roundResult,
        nextRoundStartsIn: roundResult.isLastRound ? undefined : GAME_CONSTANTS.COUNTDOWN_DURATION
      };
      this.server.emit(GameEvents.ROUND_END, roundEndEvent);

      // Add round to history after determining winner
      this.gameStateService.addToRoundHistory(roundResult);

      // If it's the last round, end the game
      if (roundResult.isLastRound) {
        this.endGame();
      } else {
        // Schedule next round
        setTimeout(() => this.handleRoundFlow(), GAME_CONSTANTS.COUNTDOWN_DURATION);
      }
    } catch (error) {
      this.logger.error('Error in round flow:', error);
      this.endGame();
    }
  }

  private endGame(): void {
    const finalState = this.gameStateService.getState();
    const winners = this.determineGameWinners();
    
    this.server.emit(GameEvents.GAME_END, {
      winners,
      finalScores: finalState.players.map(p => ({
        username: p.username,
        score: p.score
      }))
    });

    this.gameStateService.resetGame();
  }

  private determineGameWinners(): Player[] {
    const players = this.gameStateService.getState().players;
    if (players.length === 0) return [];

    const maxScore = Math.max(...players.map(p => p.score));
    return players.filter(p => p.score === maxScore);
  }

  private broadcastGameState(): void {
    this.server.emit(GameEvents.GAME_STATE_UPDATE, this.gameStateService.getState());
  }

  @SubscribeMessage('debug_state')
  handleDebugState(client: Socket): void {
    const state = {
      playerCount: this.gameService.getPlayerCount(),
      players: this.gameService.getAllPlayers(),
      gameState: this.gameStateService.getState(),
      canStartGame: this.gameStateService.canStartGame()
    };
    
    client.emit('debug_state', state);
    this.logger.debug('Debug state:', state);
  }

  @SubscribeMessage('get_round_history')
  handleGetRoundHistory(client: Socket): void {
    const history = this.gameStateService.getRoundHistory();
    client.emit('round_history', history);
  }

  @SubscribeMessage('get_player_stats')
  handleGetPlayerStats(client: Socket): void {
    const player = this.gameService.getPlayer(client.id);
    if (player) {
      const stats = this.gameStateService.getPlayerStats(player.id);
      client.emit('player_stats', stats);
    }
  }

  private checkAutoStart(): void {
    const playerCount = this.gameService.getPlayerCount();
    
    // Clear any existing auto-start timeout
    if (this.autoStartTimeout) {
      clearTimeout(this.autoStartTimeout);
      this.autoStartTimeout = null;
    }

    if (playerCount >= GAME_CONSTANTS.MIN_PLAYERS_TO_START && !this.gameStateService.isGameInProgress()) {
      // Broadcast warning message about auto-start
      this.server.emit(GameEvents.GAME_AUTO_START_PENDING, {
        message: `Game will start in ${GAME_CONSTANTS.COUNTDOWN_DURATION / 1000} seconds`,
        startingIn: GAME_CONSTANTS.COUNTDOWN_DURATION,
        currentPlayers: playerCount
      });

      // Set timeout for auto-start
      this.autoStartTimeout = setTimeout(() => {
        if (this.gameService.getPlayerCount() >= GAME_CONSTANTS.MIN_PLAYERS_TO_START 
            && !this.gameStateService.isGameInProgress()) {
          this.startGame();
        }
      }, GAME_CONSTANTS.COUNTDOWN_DURATION);
    }
  }

  private startGame(): void {
    if (this.gameStateService.startGame()) {
      const gameStartData = {
        totalRounds: GAME_CONSTANTS.TOTAL_ROUNDS,
        players: this.gameService.getAllPlayers(),
        currentRound: 0,
        autoStarted: true
      };

      this.server.emit(GameEvents.GAME_START, gameStartData);
      this.logger.debug('Game auto-started, initiating first round');
      
      // Start the round flow
      setTimeout(() => this.handleRoundFlow(), GAME_CONSTANTS.COUNTDOWN_DURATION);
    }
  }
}
