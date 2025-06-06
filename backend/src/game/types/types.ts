export type PlayerConnectionState = 'connected' | 'disconnected' | 'left';

export interface Player {
  id: string;
  username: string;
  score: number;
  joinedAt: Date;
  socketId: string;
  connectionState: PlayerConnectionState;
  isDisconnected?: boolean;
  lastDisconnectedAt?: Date;
  lastReconnectedAt?: Date;
  disconnectionCount: number;
  temporaryDisconnect: boolean;  // true if it's just a temporary network issue
}

export interface GameState {
  isActive: boolean;
  gameActive: boolean;
  currentRound: number;
  totalRounds: number;
  players: Player[];
  countdown: number | null;
  roundStartTime: number | null;
  disconnectedPlayers: Set<string>;
}

export interface PlayerUpdate {
  players: Player[];
  totalPlayers: number;
}

export enum GameEvents {
  PLAYER_UPDATE = 'player_update',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  GAME_STATE_UPDATE = 'game_state_update',
  GAME_START = 'game_start',
  ROUND_START = 'round_start',
  ROUND_END = 'round_end',
  GAME_END = 'game_end',
  ERROR = 'error',
  GAME_AUTO_START_PENDING = 'game_auto_start_pending',
  GAME_AUTO_START_CANCELLED = 'game_auto_start_cancelled',
  GAME_OVER = 'game_over',
  NEW_GAME_READY = 'new_game_ready'
}

export enum GameStatus {
  WAITING = 'waiting',
  STARTING = 'starting',
  ACTIVE = 'active',
  ROUND_END = 'round_end',
  FINISHED = 'finished',
  ROUND_IN_PROGRESS = 'round_in_progress',
  PAUSED = "paused"
}

export interface RoundResult {
  winner: Player;
  roundNumber: number;
  isLastRound: boolean;
  scores: Array<{ id: string; username: string; score: number; }>;
}

export interface RoundStartEvent {
  roundNumber: number;
  totalRounds: number;
  spinDuration: number;
  serverTimestamp: number;  // Server's timestamp when the round started
  expectedEndTime: number;  // Server's expected timestamp when the round should end
}

export interface RoundEndEvent extends RoundResult {
  nextRoundStartsIn?: number;
}

export interface GameWinner {
  id: string;
  username: string;
  score: number;
  position: number; // 1st, 2nd, 3rd place
}

export interface GameEndResult {
  winners: GameWinner[];
  finalScores: {
    id: string;
    username: string;
    score: number;
    position: number;
  }[];
  gameStats: {
    totalRounds: number;
    duration: number;
    startTime: Date;
    endTime: Date;
  };
}

