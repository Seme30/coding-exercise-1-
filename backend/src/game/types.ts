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
    ERROR = 'error'
}