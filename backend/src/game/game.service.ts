import { Injectable } from '@nestjs/common';

@Injectable()
export class GameService {
  private readonly connectedPlayers: Map<string, any> = new Map();

  addPlayer(clientId: string, playerData: any) {
    this.connectedPlayers.set(clientId, {
      ...playerData,
      score: 0,
    });
    return this.getConnectedPlayers();
  }

  removePlayer(clientId: string) {
    this.connectedPlayers.delete(clientId);
    return this.getConnectedPlayers();
  }

  getConnectedPlayers() {
    return Array.from(this.connectedPlayers.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }
}
