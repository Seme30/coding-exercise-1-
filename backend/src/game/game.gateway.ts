import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly gameService: GameService) {}

  @WebSocketServer() 
  server: Server;
  
  private logger: Logger = new Logger('GameGateway');

  afterInit(server: Server) {
    this.logger.log('Game WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const players = this.gameService.removePlayer(client.id);
    this.server.emit('player_update', players);
  }

  @SubscribeMessage('register_player')
  handleRegisterPlayer(client: Socket, username: string) {
    const players = this.gameService.addPlayer(client.id, { username });
    this.server.emit('player_update', players);
    return players;
  }
}
