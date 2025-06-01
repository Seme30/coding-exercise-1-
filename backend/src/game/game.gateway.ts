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
import { GameEvents, Player, PlayerUpdate } from './types';
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
      
      this.logger.debug(
        `Player ${player.username} disconnected. Remaining players: ${this.gameService.getPlayerCount()}`
      );
    }
  }

  @SubscribeMessage('join_game')
  handleJoinGame(client: Socket, username: string): void {
    try {
      // Check if game is in progress
      if (this.gameStateService.isGameInProgress()) {
        throw new Error('Cannot join: Game is already in progress');
      }

      if (!username || username.trim().length < 2) {
        throw new Error('Invalid username');
      }

      const player = this.gameService.createPlayer(client.id, username.trim());
      
      // Update game state with new player list
      const allPlayers = this.gameService.getAllPlayers();
      this.gameStateService.updatePlayers(allPlayers);
      
      // Send success response to the joining player
      client.emit('join_game_success', player);
      
      // Broadcast player update to all clients
      this.broadcastPlayerUpdate();

      this.logger.debug(`Player ${username} joined. Total players: ${this.gameService.getPlayerCount()}`);
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
        currentRound: 1
      };

      this.server.emit(GameEvents.GAME_START, gameStartData);
      this.logger.debug(`Game started with ${playerCount} players`);
      
      setTimeout(() => this.startNewRound(), GAME_CONSTANTS.COUNTDOWN_DURATION);
    }
  }

  private startNewRound(): void {
    this.gameStateService.startRound();
    this.server.emit(GameEvents.ROUND_START, {
      round: this.gameStateService.getState().currentRound,
      totalRounds: GAME_CONSTANTS.TOTAL_ROUNDS
    });
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
}
