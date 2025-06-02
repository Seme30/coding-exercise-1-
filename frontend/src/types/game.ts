export interface Player {
  id: string;
  username: string;
  score: number;
  joinedAt: string;
}

export interface GameState {
  // Connection State
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  statusMessage: string;

  // Game State
  players: Player[];
  currentPlayer: Player | null;
  gameActive: boolean;
  currentRound: number;
  totalRounds: number;
  countdown: number;
}

export type GameStatus = {
  active: boolean;
  currentRound?: number;
  totalRounds?: number;
}

export interface RoundStartEvent {
  roundNumber: number;
  totalRounds: number;
}

export interface RoundEndEvent {
  roundNumber: number;
  scores: Player[];
  winner: Player;
  isLastRound: boolean;
}

export interface GameOverEvent {
  winners: Array<{
    position: number;
    username: string;
    score: number;
  }>;
  finalScores: Player[];
} 