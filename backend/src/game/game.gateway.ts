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
      this.broadcastPlayerUpdate();
      this.server.emit(GameEvents.PLAYER_LEFT, {
        username: player.username,
        timestamp: new Date()
      });
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_game')
  handleJoinGame(client: Socket, username: string): void {
    try {
      if (!username || username.trim().length < 2) {
        throw new WsException('Invalid username');
      }

      const player = this.gameService.createPlayer(client.id, username.trim());
      
      // Send success response to the joining player
      client.emit('join_game_success', player);
      
      // Broadcast player update to all clients
      this.broadcastPlayerUpdate();
      
      // Notify others about new player
      client.broadcast.emit(GameEvents.PLAYER_JOINED, {
        username: player.username,
        timestamp: new Date()
      });

    } catch (error) {
      client.emit(GameEvents.ERROR, {
        message: error.message,
        code: 'JOIN_GAME_ERROR'
      });
    }
  }

  private broadcastPlayerUpdate(): void {
    const update: PlayerUpdate = this.gameService.getAllPlayers();
    this.server.emit(GameEvents.PLAYER_UPDATE, update);
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(client: Socket): void {
    client.emit('heartbeat_ack', { timestamp: new Date() });
  }

  @SubscribeMessage('start_game')
  handleStartGame(client: Socket): void {
    if (!this.gameStateService.canStartGame()) {
      client.emit(GameEvents.ERROR, {
        message: `Need ${GAME_CONSTANTS.MIN_PLAYERS_TO_START} players to start the game`,
        code: 'CANNOT_START_GAME'
      });
      return;
    }

    if (this.gameStateService.startGame()) {
      this.server.emit(GameEvents.GAME_START, {
        totalRounds: GAME_CONSTANTS.TOTAL_ROUNDS,
        players: this.gameService.getAllPlayers()
      });
      
      // Start first round after a brief delay
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
}
