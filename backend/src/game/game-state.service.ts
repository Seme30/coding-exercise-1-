import { Injectable, Logger } from '@nestjs/common';
import { GAME_CONSTANTS } from './constants';
import { GameState, GameStatus, Player, RoundResult, GameWinner, GameEndResult } from './types/types';

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

  private roundHistory: Array<{
    roundNumber: number;
    winner: Player;
    scores: Array<{ id: string; username: string; score: number; }>;
  }> = [];

  private roundTimeout: NodeJS.Timeout | null = null;

  private gameStartTime: Date | null = null;

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
    const playerCount = this.state.players.length;
    const canStart = (
      !this.state.isActive &&
      playerCount >= GAME_CONSTANTS.MIN_PLAYERS_TO_START &&
      playerCount <= GAME_CONSTANTS.MAX_PLAYERS
    );

    this.logger.debug(
      `Can start game check - Active: ${this.state.isActive}, ` +
      `Players: ${playerCount}, Can start: ${canStart}`
    );

    return canStart;
  }

  isGameInProgress(): boolean {
    return this.state.isActive;
  }

  startGame(): boolean {
    if (!this.canStartGame()) {
      return false;
    }

    this.state.isActive = true;
    this.state.currentRound = 0;
    this.gameStatus = GameStatus.STARTING;
    this.gameStartTime = new Date();
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
    
    if (this.state.currentRound === this.state.totalRounds) {
      this.endGame();
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
      players: [],
      countdown: null,
      roundStartTime: null,
      gameActive: false
    };
    this.gameStatus = GameStatus.WAITING;
    this.gameStartTime = null;
    this.roundHistory = [];
    this.logger.log('Game reset and ready for new players');
  }

  updatePlayers(players: Player[]): void {
    this.state.players = [...players];
    this.logger.debug(`Players updated. Count: ${this.state.players.length}`);
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

  startNewRound(): void {
    if (!this.state.isActive) {
      throw new Error('Cannot start round: Game is not active');
    }

    if (this.state.currentRound === 0) {
      this.state.currentRound = 1;
    } else {
      this.state.currentRound++;
    }
    
    this.gameStatus = GameStatus.ROUND_IN_PROGRESS;
    this.state.roundStartTime = Date.now();
    
    this.logger.debug(`Round ${this.state.currentRound} started`);
  }

  determineRoundWinner(): RoundResult {
    const players = [...this.state.players];
    if (players.length === 0) {
      throw new Error('No players available');
    }

    // Randomly select a winner
    const winnerIndex = Math.floor(Math.random() * players.length);
    const winner = players[winnerIndex];

    // Update winner's score
    winner.score += 1;

    const isLastRound = this.state.currentRound === this.state.totalRounds;

    return {
      winner,
      roundNumber: this.state.currentRound,
      isLastRound,
      scores: players.map(p => ({ id: p.id, username: p.username, score: p.score }))
    };
  }

  isLastRound(): boolean {
    return this.state.currentRound === this.state.totalRounds;
  }

  pauseGame(): boolean {
    if (!this.state.isActive || this.gameStatus !== GameStatus.ROUND_IN_PROGRESS) {
      return false;
    }

    if (this.roundTimeout) {
      clearTimeout(this.roundTimeout);
      this.roundTimeout = null;
    }

    this.gameStatus = GameStatus.PAUSED;
    return true;
  }

  resumeGame(): boolean {
    if (!this.state.isActive || this.gameStatus !== GameStatus.PAUSED) {
      return false;
    }

    this.gameStatus = GameStatus.ROUND_IN_PROGRESS;
    return true;
  }

  addToRoundHistory(roundResult: RoundResult): void {
    this.roundHistory.push({
      roundNumber: roundResult.roundNumber,
      winner: roundResult.winner,
      scores: roundResult.scores
    });
  }

  getRoundHistory(): typeof this.roundHistory {
    return [...this.roundHistory];
  }

  getPlayerStats(playerId: string): {
    roundsWon: number;
    totalScore: number;
    winningStreak: number;
  } {
    const history = this.roundHistory;
    let currentStreak = 0;
    let maxStreak = 0;

    const stats = history.reduce((acc, round) => {
      if (round.winner.id === playerId) {
        acc.roundsWon++;
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
      return acc;
    }, { roundsWon: 0, totalScore: 0, winningStreak: 0 });

    stats.winningStreak = maxStreak;
    stats.totalScore = this.state.players.find(p => p.id === playerId)?.score || 0;

    return stats;
  }

  determineWinners(): GameWinner[] {
    const sortedPlayers = [...this.state.players]
      .sort((a, b) => b.score - a.score);
    
    let currentPosition = 1;
    let currentScore = sortedPlayers[0]?.score ?? 0;
    
    return sortedPlayers.map((player, index) => {
      // If this player's score is less than the previous, increment position
      if (player.score < currentScore) {
        currentPosition = index + 1;
        currentScore = player.score;
      }
      
      return {
        id: player.id,
        username: player.username,
        score: player.score,
        position: currentPosition
      };
    });
  }

  getGameEndResult(): GameEndResult {
    const winners = this.determineWinners();
    const endTime = new Date();

    return {
      winners,
      finalScores: winners,
      gameStats: {
        totalRounds: this.state.totalRounds,
        duration: this.gameStartTime ? 
          endTime.getTime() - this.gameStartTime.getTime() : 
          0,
        startTime: this.gameStartTime!,
        endTime
      }
    };
  }

  prepareForNewGame(): void {
    // Reset scores but keep players
    this.state.players.forEach(player => {
      player.score = 0;
    });
    
    this.state.isActive = false;
    this.state.currentRound = 0;
    this.gameStatus = GameStatus.WAITING;
    this.roundHistory = [];
    
    this.logger.log('Game prepared for new round with existing players');
  }
}
