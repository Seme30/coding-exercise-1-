import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';

export interface Player {
    id: string;
    username: string;
    score: number;
    joinedAt: string;
  }
  
  export interface PlayerUpdate {
    type: 'player_update';
    timestamp: number;
    data: {
      players: Player[];
      totalPlayers: number;
    };
  }

interface GameState {
  isConnected: boolean;
  players: Player[];
  gameActive: boolean;
  currentRound: number;
  totalRounds: number;
  error: string | null;
  statusMessage: string;
  countdown: number;
  currentPlayer: Player | null;
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

type GameAction =
  | { type: 'SET_CONNECTION'; payload: boolean }
  | { type: 'UPDATE_PLAYERS'; payload: Player[] }
  | { type: 'SET_GAME_STATUS'; payload: { active: boolean; currentRound?: number; totalRounds?: number } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STATUS_MESSAGE'; payload: string }
  | { type: 'SET_COUNTDOWN'; payload: number }
  | { type: 'SET_PLAYER'; payload: Player };

const initialState: GameState = {
  isConnected: false,
  players: [],
  gameActive: false,
  currentRound: 0,
  totalRounds: 5,
  error: null,
  statusMessage: 'Not Connected',
  countdown: 0,
  currentPlayer: null,
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_CONNECTION':
      return { ...state, isConnected: action.payload };
    case 'UPDATE_PLAYERS':
      return { ...state, players: action.payload };
    case 'SET_GAME_STATUS':
      return {
        ...state,
        gameActive: action.payload.active,
        currentRound: action.payload.currentRound ?? state.currentRound,
        totalRounds: action.payload.totalRounds ?? state.totalRounds,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_STATUS_MESSAGE':
      return { ...state, statusMessage: action.payload };
    case 'SET_COUNTDOWN':
      return { ...state, countdown: action.payload };
    case 'SET_PLAYER':
      return { ...state, currentPlayer: action.payload };
    default:
      return state;
  }
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}; 