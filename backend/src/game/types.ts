export interface Player {
  id: string;
  username: string;
  score: number;
}

export interface GameState {
  players: Player[];
  currentRound: number;
  gameActive: boolean;
}

export interface Player {
    id: string;
    username: string;
    score: number;
    joinedAt: Date;
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
    ERROR = 'error'
}

export interface Player {
  id: string;
  username: string;
  score: number;
  joinedAt: Date;
}

export interface GameState {
  isActive: boolean;
  currentRound: number;
  totalRounds: number;
  players: Player[];
  countdown: number | null;
  roundStartTime: number | null;
}

export enum GameStatus {
  WAITING = 'waiting',
  STARTING = 'starting',
  ACTIVE = 'active',
  ROUND_END = 'round_end',
  FINISHED = 'finished'
}

