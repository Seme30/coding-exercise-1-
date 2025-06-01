export interface WebSocketMessage {
  type: string;
  timestamp: number;
}

export interface PlayerUpdateMessage extends WebSocketMessage {
  type: 'player_update';
  data: {
    players: Array<{
      id: string;
      username: string;
      score: number;
      joinedAt: Date;
    }>;
    totalPlayers: number;
  };
}

export interface PlayerJoinedMessage extends WebSocketMessage {
  type: 'player_joined';
  data: {
    username: string;
    id: string;
    joinedAt: Date;
  };
}

export interface PlayerLeftMessage extends WebSocketMessage {
  type: 'player_left';
  data: {
    username: string;
    id: string;
    reason?: string;
  };
}

export interface GameStartMessage extends WebSocketMessage {
  type: 'game_start';
  data: {
    totalRounds: number;
    players: Array<{
      id: string;
      username: string;
      score: number;
    }>;
    startTime: Date;
    isAutoStarted: boolean;
    countdownDuration: number;
  };
}

export interface NewRoundMessage extends WebSocketMessage {
  type: 'new_round';
  data: {
    roundNumber: number;
    totalRounds: number;
    spinDuration: number;
    startTime: Date;
    players: Array<{
      id: string;
      username: string;
      score: number;
    }>;
  };
}

export interface RoundResultMessage extends WebSocketMessage {
  type: 'round_result';
  data: {
    roundNumber: number;
    winner: {
      id: string;
      username: string;
      score: number;
    };
    allScores: Array<{
      id: string;
      username: string;
      score: number;
    }>;
    isLastRound: boolean;
    nextRoundStartsIn?: number;
  };
}

export interface GameOverMessage extends WebSocketMessage {
  type: 'game_over';
  data: {
    winners: Array<{
      id: string;
      username: string;
      score: number;
      position: number;
    }>;
    finalScores: Array<{
      id: string;
      username: string;
      score: number;
      position: number;
    }>;
    gameStats: {
      totalRounds: number;
      duration: number;
      startTime: Date;
      endTime: Date;
      totalPlayers: number;
    };
  };
}

export interface ErrorMessage extends WebSocketMessage {
  type: 'error';
  data: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface GameStateUpdateMessage extends WebSocketMessage {
  type: 'game_state_update';
  data: {
    isActive: boolean;
    currentRound: number;
    totalRounds: number;
    status: string;
    countdown: number | null;
    players: Array<{
      id: string;
      username: string;
      score: number;
    }>;
  };
}

export interface AutoStartPendingMessage extends WebSocketMessage {
  type: 'game_auto_start_pending';
  data: {
    startingIn: number;
    currentPlayers: number;
    requiredPlayers: number;
    message: string;
  };
}

export type GameWebSocketMessage =
  | PlayerUpdateMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | GameStartMessage
  | NewRoundMessage
  | RoundResultMessage
  | GameOverMessage
  | ErrorMessage
  | GameStateUpdateMessage
  | AutoStartPendingMessage;
