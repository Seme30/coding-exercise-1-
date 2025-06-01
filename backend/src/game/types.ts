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
