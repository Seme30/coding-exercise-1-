import { Injectable, Logger } from '@nestjs/common';
import { GAME_CONSTANTS } from './constants';
import { GameState, GameStatus, Player } from './types';

@Injectable()
export class GameStateService {
  private readonly logger = new Logger(GameStateService.name);
  
  private state: GameState = {
      isActive: false,
      currentRound: 0,
      totalRounds: GAME_CONSTANTS.TOTAL_ROUNDS,
      players: [],
      countdown: null,
      roundStartTime: null,
      gameActive: false
  };

  private gameStatus: GameStatus = GameStatus.WAITING;

  constructor() {
    this.resetGame();
  }

  getState(): GameState {
    return { ...this.state };
  }

  getStatus(): GameStatus {
    return this.gameStatus;
  }

  canStartGame(): boolean {
    return (
      !this.state.isActive &&
      this.state.players.length >= GAME_CONSTANTS.MIN_PLAYERS_TO_START &&
      this.state.players.length <= GAME_CONSTANTS.MAX_PLAYERS
    );
  }

  startGame(): boolean {
    if (!this.canStartGame()) {
      return false;
    }

    this.state.isActive = true;
    this.state.currentRound = 1;
    this.gameStatus = GameStatus.STARTING;
    this.logger.log('Game started');
    return true;
  }

  startRound(): void {
    this.gameStatus = GameStatus.ACTIVE;
    this.state.roundStartTime = Date.now();
    this.logger.log(`Round ${this.state.currentRound} started`);
  }

  endRound(): void {
    this.gameStatus = GameStatus.ROUND_END;
    this.state.roundStartTime = null;
    
    if (this.state.currentRound >= this.state.totalRounds) {
      this.endGame();
    } else {
      this.state.currentRound++;
    }
  }

  endGame(): void {
    this.gameStatus = GameStatus.FINISHED;
    this.state.isActive = false;
    this.logger.log('Game ended');
  }

  resetGame(): void {
    this.state = {
      isActive: false,
      currentRound: 0,
      totalRounds: GAME_CONSTANTS.TOTAL_ROUNDS,
      players: this.state.players,
      countdown: null,
      roundStartTime: null,
      gameActive: false
    };
    this.gameStatus = GameStatus.WAITING;
    this.logger.log('Game reset');
  }

  updatePlayers(players: Player[]): void {
    this.state.players = players;
    
    // Check if we can start the game
    if (this.canStartGame() && this.gameStatus === GameStatus.WAITING) {
      this.logger.log('Minimum players reached, game can start');
    }
  }

  getWinner(): Player | Player[] | null {
    if (this.gameStatus !== GameStatus.FINISHED) {
      return null;
    }

    const sortedPlayers = [...this.state.players].sort((a, b) => b.score - a.score);
    const highestScore = sortedPlayers[0].score;
    
    // Return all players with the highest score (in case of a tie)
    return sortedPlayers.filter(player => player.score === highestScore);
  }
}
