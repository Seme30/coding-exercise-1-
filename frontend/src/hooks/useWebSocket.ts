import { useEffect, useCallback, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameContext } from '../context/GameContext';

interface Player {
  id: string;
  username: string;
  score: number;
  joinedAt: string;
}

interface PlayerUpdateEvent {
  type: 'player_update';
  timestamp: number;
  data: {
    players: Player[];
    totalPlayers: number;
  };
}

interface ErrorEvent {
  type: 'error';
  timestamp: number;
  data: {
    code: string;
    message: string;
  };
}

interface RoundStartEvent {
  roundNumber: number;
  totalRounds: number;
  spinDuration: number;
}

interface RoundEndEvent {
  roundNumber: number;
  winner: Player;
  scores: Player[];
  isLastRound: boolean;
  nextRoundStartsIn?: number;
}

export const useWebSocket = () => {
  const { state, dispatch } = useGameContext();
  const socketRef = useRef<Socket | null>(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const mountedRef = useRef(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasJoinedRef = useRef(false);

  const setupSocketListeners = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.on('connect', () => {
      console.log('Socket connected successfully');
      if (mountedRef.current) {
        setIsSocketReady(true);
        dispatch({ type: 'SET_CONNECTION', payload: true });
        dispatch({ type: 'SET_STATUS_MESSAGE', payload: 'Connected' });
        
        // If we were previously joined, try to rejoin
        if (hasJoinedRef.current && state.currentPlayer?.username) {
          socketRef.current?.emit('join_game', state.currentPlayer.username);
        }
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      if (mountedRef.current) {
        setIsSocketReady(false);
        dispatch({ type: 'SET_CONNECTION', payload: false });
        dispatch({ type: 'SET_STATUS_MESSAGE', payload: 'Disconnected - Reconnecting...' });
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
      if (mountedRef.current) {
        dispatch({ type: 'SET_ERROR', payload: 'Connection error - retrying...' });
      }
    });

    socketRef.current.on('join_game_success', (player) => {
      console.log('Join game success:', player);
      if (mountedRef.current) {
        hasJoinedRef.current = true;
        dispatch({ type: 'SET_PLAYER', payload: player });
        dispatch({ type: 'SET_STATUS_MESSAGE', payload: `Joined as ${player.username}` });
      }
    });

    socketRef.current.on('player_update', (update) => {
      console.log('Player update received:', update);
      if (mountedRef.current && update.data && Array.isArray(update.data.players)) {
        dispatch({ type: 'UPDATE_PLAYERS', payload: update.data.players });
        console.log('Updated players:', update.data.players);
      }
    });

    socketRef.current.on('error', (error: ErrorEvent) => {
      console.log('Game error received:', error);
      if (mountedRef.current && error.data) {
        const errorMessage = error.data.message || 'An unknown error occurred';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      }
    });

    socketRef.current.on('game_start', (data) => {
      console.log('Game starting:', data);
      if (mountedRef.current) {
        dispatch({ 
          type: 'SET_GAME_STATUS', 
          payload: { 
            active: true,
            totalRounds: data.totalRounds,
            currentRound: 1
          } 
        });
        dispatch({ type: 'SET_STATUS_MESSAGE', payload: `Game Starting - ${data.totalRounds} rounds` });
      }
    });

    socketRef.current.on('round_start', (data: RoundStartEvent) => {
      console.log('Round starting:', data);
      if (mountedRef.current) {
        dispatch({ 
          type: 'SET_GAME_STATUS',
          payload: {
            active: true,
            currentRound: data.roundNumber
          }
        });
        dispatch({ 
          type: 'SET_STATUS_MESSAGE', 
          payload: `Round ${data.roundNumber} of ${data.totalRounds} in progress...` 
        });
      }
    });

    socketRef.current.on('round_end', (data: RoundEndEvent) => {
      console.log('Round ended:', data);
      if (mountedRef.current) {
        dispatch({ type: 'UPDATE_PLAYERS', payload: data.scores });
        
        const winnerMessage = data.winner.id === state.currentPlayer?.id
          ? 'You won this round!'
          : `${data.winner.username} won this round!`;

        dispatch({ 
          type: 'SET_STATUS_MESSAGE', 
          payload: `Round ${data.roundNumber} ended! ${winnerMessage}` 
        });

        if (data.isLastRound) {
          dispatch({ 
            type: 'SET_GAME_STATUS',
            payload: { active: false }
          });
        }
      }
    });

    socketRef.current.on('game_over', (data) => {
      console.log('Game over:', data);
      if (mountedRef.current) {
        dispatch({ 
          type: 'SET_GAME_STATUS',
          payload: { active: false }
        });
        
        const winners = data.winners
          .filter((w: any) => w.position === 1)
          .map((w: any) => w.username)
          .join(', ');

        dispatch({ 
          type: 'SET_STATUS_MESSAGE', 
          payload: `Game Over! Winners: ${winners}` 
        });
        
        dispatch({ type: 'UPDATE_PLAYERS', payload: data.finalScores });
      }
    });

  }, [dispatch, state.currentPlayer]);

  const connect = useCallback(() => {
    try {
      if (socketRef.current?.connected) {
        console.log('Already connected, skipping connection');
        return;
      }

      console.log('Attempting to connect to WebSocket server...');
      socketRef.current = io('http://localhost:3000/game', {
        transports: ['websocket'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: false
      });

      setupSocketListeners();
      socketRef.current.connect();
    } catch (error) {
      console.error('Connection attempt failed:', error);
      if (mountedRef.current) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to connect to game server' });
      }
    }
  }, [setupSocketListeners, dispatch]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting...');
    hasJoinedRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      if (mountedRef.current) {
        setIsSocketReady(false);
        dispatch({ type: 'SET_CONNECTION', payload: false });
        dispatch({ type: 'SET_STATUS_MESSAGE', payload: 'Disconnected' });
        dispatch({ type: 'UPDATE_PLAYERS', payload: [] });
        dispatch({ type: 'SET_PLAYER', payload: null });
      }
    }
  }, [dispatch]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connect,
    disconnect,
    joinGame: useCallback((username: string) => {
      console.log('Attempting to join game with username:', username);
      if (!socketRef.current?.connected) {
        console.error('Cannot join: Socket not connected');
        dispatch({ type: 'SET_ERROR', payload: 'Socket not connected. Please try again.' });
        return;
      }
      dispatch({ type: 'SET_ERROR', payload: null });
      socketRef.current.emit('join_game', username);
    }, [dispatch]),
    startGame: useCallback(() => socketRef.current?.emit('start_game'), []),
    leaveGame: useCallback(() => {
      hasJoinedRef.current = false;
      socketRef.current?.emit('leave_game');
    }, []),
    isConnected: state.isConnected,
    players: state.players || [],
    gameActive: state.gameActive,
    currentRound: state.currentRound,
    totalRounds: state.totalRounds,
    error: state.error,
    statusMessage: state.statusMessage,
    currentPlayer: state.currentPlayer
  };
}; 