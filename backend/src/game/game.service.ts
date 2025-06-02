import { Injectable, Logger } from '@nestjs/common';
import { Player, PlayerUpdate } from './types/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private readonly players: Map<string, Player> = new Map();
  private readonly usernameToSocketId: Map<string, string> = new Map();

  createPlayer(socketId: string, username: string): Player {
    const normalizedUsername = username.toLowerCase().trim();
    
    // Check if username is taken
    const existingSocketId = this.usernameToSocketId.get(normalizedUsername);
    if (existingSocketId) {
      // If the socket ID is different, username is truly taken
      if (existingSocketId !== socketId) {
        throw new Error('Username already taken');
      }
      
      // If it's the same socket trying to rejoin with same username, remove old entry
      this.removePlayer(socketId);
    }

    const player: Player = {
      id: uuidv4(), // Unique game ID (different from socket ID)
      username,
      score: 0,
      joinedAt: new Date()
    };

    this.players.set(socketId, player);
    this.usernameToSocketId.set(normalizedUsername, socketId);
    this.logger.debug(`Player created: ${username} (${socketId}). Total players: ${this.players.size}`);
    return player;
  }

  removePlayer(socketId: string): Player | null {
    const player = this.players.get(socketId);
    if (player) {
      this.players.delete(socketId);
      this.usernameToSocketId.delete(player.username.toLowerCase().trim());
      this.logger.debug(`Player removed: ${player.username} (${socketId}). Remaining players: ${this.players.size}`);
    }
    return player || null;
  }

  getPlayer(socketId: string): Player | undefined {
    return this.players.get(socketId);
  }

  findPlayerByUsername(username: string): Player | undefined {
    const socketId = this.usernameToSocketId.get(username.toLowerCase().trim());
    return socketId ? this.players.get(socketId) : undefined;
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  getPlayerCount(): number {
    const count = this.players.size;
    this.logger.debug(`Current player count: ${count}`);
    return count;
  }

  updatePlayerScore(socketId: string, newScore: number): Player | null {
    const player = this.players.get(socketId);
    if (player) {
      player.score = newScore;
      this.players.set(socketId, player);
      return player;
    }
    return null;
  }

  hasEnoughPlayers(minPlayers: number = 2): boolean {
    return this.players.size >= minPlayers;
  }

  clearAllPlayers(): void {
    this.players.clear();
    this.usernameToSocketId.clear();
    this.logger.debug('All players cleared');
  }
}
