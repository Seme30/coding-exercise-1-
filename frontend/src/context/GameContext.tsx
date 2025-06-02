import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { webSocketService } from '../services/websocket';
import { GAME_CONSTANTS } from '../config/constants';

// Types
interface Player {
  id: string;
  username: string;
  score: number;
  joinedAt: number;
  isSpinning?: boolean;
}

interface Score {
  id: string;
  score: number;
}

interface Winner extends Player {
  position: number;
}

interface GameState {
  // Connection State
  isConnected: boolean;
  isConnecting: boolean;
  socket: Socket | null;
  connectionError: string | null;
  
  // Game State
  players: Player[];
  currentPlayerId?: string;
  currentUsername?: string;
  gameActive: boolean;
  currentRound: number;
  totalRounds: number;
  hasJoined: boolean;
  roundWinner?: Player;
  gameWinner?: Player;
  statusMessage: string;
  
  // Performance Metrics
  latency: number;
  messagesSent: number;
  messagesReceived: number;
}

interface GameContextType extends GameState {
  // Game Actions
  joinGame: (username: string) => Promise<void>;
  startGame: () => Promise<void>;
  leaveGame: () => void;
  reconnect: () => void;
}

const defaultGameState: GameState = {
  // Connection State
  isConnected: false,
  isConnecting: false,
  socket: null,
  connectionError: null,
  
  // Game State
  players: [],
  gameActive: false,
  currentRound: 0,
  totalRounds: 5,
  hasJoined: false,
  statusMessage: 'Not connected',
  
  // Performance Metrics
  latency: 0,
  messagesSent: 0,
  messagesReceived: 0
};

const GameContext = createContext<GameContextType | null>(null);

type Timeout = ReturnType<typeof setTimeout>;

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(defaultGameState);
  const mountedRef = useRef(true);
  const pingIntervalRef = useRef<Timeout | null>(null);

  const updateState = useCallback((updates: Partial<GameState> | ((prev: GameState) => Partial<GameState>)) => {
    if (typeof updates === 'function') {
      setState(prev => ({ ...prev, ...updates(prev) }));
    } else {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  const measureLatency = useCallback(() => {
    if (!state.socket?.connected) return;
    
    const start = Date.now();
    state.socket.emit('test_event', { 
      type: 'ping',
      time: new Date().toISOString(),
      clientTime: start 
    });
    
    updateState({ messagesSent: state.messagesSent + 1 });
  }, [state.socket, state.messagesSent, updateState]);

  const setupSocketListeners = useCallback((socket: Socket) => {
    socket.on('connect', () => {
      updateState({ 
        isConnected: true, 
        isConnecting: false,
        connectionError: null,
        statusMessage: 'Connected'
      });
      
      if (mountedRef.current) {
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(measureLatency, 5000);
      }
    });

    socket.on('disconnect', (reason) => {
      updateState(prev => ({ 
        ...prev,
        isConnected: false,
        statusMessage: `Disconnected: ${reason}`,
        gameActive: false
      }));
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    });

    socket.on('connect_error', (err) => {
      updateState({ 
        isConnected: false,
        isConnecting: false,
        connectionError: err.message,
        statusMessage: 'Connection error'
      });
    });

    socket.on('error', (err) => {
      updateState({ 
        connectionError: err.message,
        statusMessage: 'Error occurred'
      });
    });

    // Game Events
    socket.on('player_update', (message) => {
      // Handle both array and object formats from backend
      const playerData = Array.isArray(message) ? message : 
                        message.data?.players ? message.data.players :
                        message.players ? message.players : [];
      
      updateState(prev => ({ 
        players: playerData.map((player: any) => ({
          id: player.id,
          username: player.username,
          score: player.score || 0,
          joinedAt: typeof player.joinedAt === 'string' ? new Date(player.joinedAt).getTime() : player.joinedAt || Date.now(),
          isSpinning: false
        })),
        // Keep the current player's ID when updating players
        currentPlayerId: message.currentPlayerId || prev.currentPlayerId
      }));
    });

    socket.on('join_game_success', (response) => {
      updateState(prev => ({ 
        hasJoined: true,
        currentPlayerId: response.playerId,
        currentUsername: response.username,
        // Ensure we keep existing players if they're not in the response
        players: response.players ? response.players.map((player: any) => ({
          id: player.id,
          username: player.username,
          score: player.score || 0,
          joinedAt: typeof player.joinedAt === 'string' ? new Date(player.joinedAt).getTime() : player.joinedAt || Date.now(),
          isSpinning: false
        })) : prev.players
      }));
    });

    socket.on('game_start', (data) => {
      updateState({
        gameActive: true,
        currentRound: 1,
        totalRounds: data.totalRounds,
        statusMessage: `Game Starting - ${data.totalRounds} rounds`,
        roundWinner: undefined,
        gameWinner: undefined,
        players: data.players.map((player: Player) => ({
          ...player,
          isSpinning: false,
          score: 0
        }))
      });
    });

    socket.on('round_start', (data) => {
      updateState(prev => ({
        gameActive: true,
        currentRound: data.roundNumber,
        totalRounds: data.totalRounds,
        statusMessage: `Round ${data.roundNumber} of ${data.totalRounds} - Spinning!`,
        roundWinner: undefined,
        players: prev.players.map(player => ({
          ...player,
          isSpinning: true
        }))
      }));

      // Set a timer to match the backend's spin duration
      if (data.spinDuration) {
        setTimeout(() => {
          updateState(prev => ({
            players: prev.players.map(player => ({
              ...player,
              isSpinning: false
            }))
          }));
        }, data.spinDuration);
      }
    });

    socket.on('round_end', (data) => {
      updateState(prev => ({
        roundWinner: data.winner,
        statusMessage: `Round ${data.roundNumber} ended - ${data.winner.username} won!`,
        players: prev.players.map(player => ({
          ...player,
          isSpinning: false,
          score: data.scores.find((s: Score) => s.id === player.id)?.score || player.score
        }))
      }));

      if (!data.isLastRound && data.nextRoundStartsIn) {
        setTimeout(() => {
          updateState({
            statusMessage: `Next round starting in ${data.nextRoundStartsIn / 1000} seconds`
          });
        }, 2000);
      }
    });

    socket.on('game_over', (data) => {
      const winners = data.winners.filter((w: Winner) => w.position === 1);
      
      updateState(prev => {
        const isCurrentPlayerWinner = winners.some((w: Winner) => 
          w.id === prev.currentPlayerId || w.username === prev.currentUsername
        );
        const newState = {
          ...prev,
          gameActive: false,
          gameWinner: isCurrentPlayerWinner 
            ? winners.find((w: Winner) => w.id === prev.currentPlayerId || w.username === prev.currentUsername)! 
            : winners[0],
          statusMessage: winners.length > 1 
            ? `Game Over! It's a tie between ${winners.map((w: Winner) => w.username).join(' and ')}!`
            : `Game Over! ${winners[0].username} wins with ${winners[0].score} points!`,
          players: prev.players.map(player => ({
            ...player,
            isSpinning: false,
            score: data.finalScores.find((s: Score) => s.id === player.id)?.score || player.score
          }))
        };
        
        return newState;
      });
    });

    socket.on('game_state_update', (state) => {
      updateState({
        gameActive: state.isActive,
        currentRound: state.currentRound,
        totalRounds: state.totalRounds,
        players: state.players.map((player: Player) => ({
          ...player,
          isSpinning: false
        })),
        statusMessage: state.status
      });
    });

    socket.on('test_response', (data) => {
      const now = Date.now();
      
      if (data.received?.type === 'ping' && data.received.clientTime) {
        const latency = now - data.received.clientTime;
        updateState({ 
          latency,
          messagesReceived: state.messagesReceived + 1
        });
      }
    });

    socket.on('game_auto_start_pending', (data) => {
      updateState({
        statusMessage: `Auto-starting in ${data.startingIn / 1000}s (${data.currentPlayers} players)`
      });
    });

    socket.on('game_auto_start_cancelled', (data) => {
      updateState({
        statusMessage: `Waiting for players (${data.currentPlayers}/${GAME_CONSTANTS.MIN_PLAYERS_TO_START})`
      });
    });
  }, [measureLatency, state.messagesReceived, updateState]);

  // Initialize WebSocket connection
  useEffect(() => {
    mountedRef.current = true;

    try {
      if (!state.socket) {
        updateState({ isConnecting: true });
        const socket = webSocketService.connect();
        setupSocketListeners(socket);
        updateState({ socket });
      }
    } catch (err) {
      updateState({ 
        connectionError: err instanceof Error ? err.message : 'Unknown error',
        isConnecting: false
      });
    }

    return () => {
      mountedRef.current = false;
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      if (state.socket) {
        state.socket.removeAllListeners();
      }
    };
  }, [setupSocketListeners, state.socket, updateState]);

  const joinGame = useCallback(async (username: string): Promise<void> => {
    if (!state.socket?.connected) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      state.socket!.emit('join_game', username);

      const successHandler = (response: any) => {
        updateState({ 
          hasJoined: true,
          currentPlayerId: response.playerId,
          currentUsername: response.username
        });
        resolve();
      };

      const errorHandler = (error: Error) => {
        reject(error);
      };

      state.socket!.once('join_game_success', successHandler);
      state.socket!.once('error', errorHandler);

      // Clean up listeners after 5 seconds
      setTimeout(() => {
        state.socket!.off('join_game_success', successHandler);
        state.socket!.off('error', errorHandler);
        reject(new Error('Join game timeout'));
      }, 5000);
    });
  }, [state.socket, updateState]);

  const startGame = useCallback(async (): Promise<void> => {
    if (!state.socket?.connected) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      state.socket!.emit('start_game');

      const successHandler = () => {
        resolve();
      };

      const errorHandler = (error: Error) => {
        reject(error);
      };

      state.socket!.once('game_started', successHandler);
      state.socket!.once('error', errorHandler);

      setTimeout(() => {
        state.socket!.off('game_started', successHandler);
        state.socket!.off('error', errorHandler);
        reject(new Error('Start game timeout'));
      }, 5000);
    });
  }, [state.socket]);

  const leaveGame = useCallback(() => {
    if (state.socket?.connected) {
      state.socket.emit('leave_game');
      updateState({ 
        hasJoined: false,
        currentPlayerId: undefined,
        gameActive: false
      });
    }
  }, [state.socket, updateState]);

  const reconnect = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    try {
      updateState({ isConnecting: true });
      const newSocket = webSocketService.connect();
      setupSocketListeners(newSocket);
      updateState({ socket: newSocket });
    } catch (err) {
      updateState({ 
        connectionError: err instanceof Error ? err.message : 'Unknown error',
        isConnecting: false
      });
    }
  }, [setupSocketListeners, updateState]);

  const value: GameContextType = {
    ...state,
    joinGame,
    startGame,
    leaveGame,
    reconnect
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

// Utility hooks for specific game state
export const useGameConnection = () => {
  const { isConnected, isConnecting, connectionError, socket, latency, reconnect } = useGame();
  return { isConnected, isConnecting, connectionError, socket, latency, reconnect };
};

export const useGameState = () => {
  const { gameActive, currentRound, totalRounds, statusMessage, roundWinner, gameWinner, currentUsername, hasJoined } = useGame();
  return { gameActive, currentRound, totalRounds, statusMessage, roundWinner, gameWinner, currentUsername, hasJoined };
};

export const usePlayers = () => {
  const { players, currentPlayerId } = useGame();
  return { players, currentPlayerId };
};

export const useGameActions = () => {
  const { joinGame, startGame, leaveGame } = useGame();
  return { joinGame, startGame, leaveGame };
}; 