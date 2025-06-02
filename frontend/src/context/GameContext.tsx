import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { webSocketService } from '../services/websocket';

// Types
interface Player {
  id: string;
  username: string;
  score: number;
  joinedAt: number;
  isSpinning?: boolean;
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

const debugLog = (action: string, data?: any) => {
  console.log(`[GameContext] ${action}`, data ?? '');
};

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
      debugLog('Socket connected', { id: socket.id });
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
      debugLog('Socket disconnected', reason);
      updateState({ 
        isConnected: false,
        statusMessage: `Disconnected: ${reason}`,
        gameActive: false
      });
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    });

    socket.on('connect_error', (err) => {
      debugLog('Connection error', err);
      updateState({ 
        isConnected: false,
        isConnecting: false,
        connectionError: err.message,
        statusMessage: 'Connection error'
      });
    });

    socket.on('error', (err) => {
      debugLog('Socket error', err);
      updateState({ 
        connectionError: err.message,
        statusMessage: 'Error occurred'
      });
    });

    // Game Events
    socket.on('player_update', (message) => {
      debugLog('Players updated', message);
      if (message.data && Array.isArray(message.data.players)) {
        updateState({ 
          players: message.data.players.map((player: { joinedAt: string | number | Date; }) => ({
            ...player,
            joinedAt: typeof player.joinedAt === 'string' ? new Date(player.joinedAt).getTime() : player.joinedAt,
            isSpinning: false
          }))
        });
      }
    });

    socket.on('game_state_update', (gameState: {
      active: boolean;
      currentRound: number;
      totalRounds: number;
      statusMessage: string;
    }) => {
      debugLog('Game state updated', gameState);
      updateState({
        gameActive: gameState.active,
        currentRound: gameState.currentRound,
        totalRounds: gameState.totalRounds,
        statusMessage: gameState.statusMessage
      });
    });

    socket.on('round_winner', (winner: Player) => {
      debugLog('Round winner', winner);
      updateState({ roundWinner: winner });
    });

    socket.on('game_winner', (winner: Player) => {
      debugLog('Game winner', winner);
      updateState({ gameWinner: winner });
    });

    socket.on('player_joined', (player: { id: string; username: string; score: number; joinedAt: string | number }) => {
      debugLog('Player joined', player);
      if (socket.id === player.id) {
        updateState({ 
          currentPlayerId: player.id,
          hasJoined: true,
          statusMessage: 'Joined game'
        });
      }
      updateState((prev: GameState) => ({
        players: [...prev.players.filter(p => p.id !== player.id), {
          ...player,
          joinedAt: typeof player.joinedAt === 'string' ? new Date(player.joinedAt).getTime() : player.joinedAt,
          isSpinning: false
        }]
      }));
    });

    socket.on('player_left', (playerId: string) => {
      debugLog('Player left', { playerId });
      updateState((prev: GameState) => ({
        players: prev.players.filter((p: Player) => p.id !== playerId)
      }));
    });

    socket.on('game_auto_start_pending', (data) => {
      debugLog('Auto-start pending', data);
      updateState({
        statusMessage: `Game auto-starting in ${data.startingIn/1000}s (${data.currentPlayers} players)`,
        gameActive: false
      });
    });

    socket.on('game_auto_start_cancelled', (data) => {
      debugLog('Auto-start cancelled', data);
      updateState({
        statusMessage: `Waiting for players (${data.currentPlayers} players)`,
        gameActive: false
      });
    });

    socket.on('game_start', (data) => {
      debugLog('Game starting', data);
      updateState({
        gameActive: true,
        currentRound: 1,
        totalRounds: data.totalRounds,
        statusMessage: `Game Starting - ${data.totalRounds} rounds`
      });
    });

    socket.on('round_start', (data) => {
      debugLog('Round starting', data);
      updateState(prev => ({
        gameActive: true,
        currentRound: data.roundNumber,
        totalRounds: data.totalRounds,
        statusMessage: `Round ${data.roundNumber} of ${data.totalRounds} in progress`,
        players: prev.players.map(player => ({
          ...player,
          isSpinning: true
        }))
      }));
    });

    socket.on('round_end', (data) => {
      debugLog('Round ended', data);
      updateState(prev => ({
        roundWinner: data.winner,
        statusMessage: data.isLastRound 
          ? `Game Over! ${data.winner.username} won the round!`
          : `Round ${data.roundNumber} ended - ${data.winner.username} won! Next round starting soon`,
        gameActive: !data.isLastRound,
        players: prev.players.map(player => ({
          ...player,
          isSpinning: false,
          score: data.scores[player.id] || player.score
        }))
      }));
    });

    socket.on('game_over', (data) => {
      debugLog('Game over', data);
      const winner = data.winners[0];
      updateState(prev => ({
        gameActive: false,
        gameWinner: {
          ...winner,
          score: data.finalScores[winner.id]
        },
        statusMessage: `Game Over! ${winner.username} wins!`,
        players: prev.players.map(player => ({
          ...player,
          isSpinning: false,
          score: data.finalScores[player.id] || player.score
        }))
      }));
    });

    socket.on('score_update', (data) => {
      debugLog('Score update', data);
      updateState(prev => ({
        players: prev.players.map(player => ({
          ...player,
          score: data.scores[player.id] || player.score
        }))
      }));
    });

    socket.on('test_response', (data) => {
      debugLog('Received test response', data);
      const now = Date.now();
      
      if (data.received?.type === 'ping' && data.received.clientTime) {
        const latency = now - data.received.clientTime;
        updateState({ 
          latency,
          messagesReceived: state.messagesReceived + 1
        });
      }
    });
  }, [measureLatency, state.messagesReceived, updateState]);

  // Initialize WebSocket connection
  useEffect(() => {
    debugLog('Initializing WebSocket connection');
    mountedRef.current = true;

    try {
      if (!state.socket) {
        updateState({ isConnecting: true });
        const socket = webSocketService.connect();
        setupSocketListeners(socket);
        updateState({ socket });
      }
    } catch (err) {
      debugLog('Setup error', err);
      updateState({ 
        connectionError: err instanceof Error ? err.message : 'Unknown error',
        isConnecting: false
      });
    }

    return () => {
      debugLog('Cleaning up WebSocket connection');
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
        debugLog('Join game success', response);
        updateState({ hasJoined: true });
        resolve();
      };

      const errorHandler = (error: Error) => {
        debugLog('Join game error', error);
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
        debugLog('Game started');
        resolve();
      };

      const errorHandler = (error: Error) => {
        debugLog('Start game error', error);
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
      debugLog('Reconnection error', err);
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
  const { gameActive, currentRound, totalRounds, statusMessage, roundWinner, gameWinner } = useGame();
  return { gameActive, currentRound, totalRounds, statusMessage, roundWinner, gameWinner };
};

export const usePlayers = () => {
  const { players, currentPlayerId } = useGame();
  return { players, currentPlayerId };
};

export const useGameActions = () => {
  const { joinGame, startGame, leaveGame } = useGame();
  return { joinGame, startGame, leaveGame };
}; 