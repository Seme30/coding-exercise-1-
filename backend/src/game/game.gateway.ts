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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'game'
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);

  constructor(private readonly gameService: GameService) {}

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
}
