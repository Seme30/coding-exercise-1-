import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket, io } from 'socket.io-client';

interface GameState {
  isConnected: boolean;
  players: any[];
  currentRound: number;
  totalRounds: number;
  gameActive: boolean;
  error: string | null;
}

export const useGameWebSocket = () => {
  const [gameState, setGameState] = useState<GameState>({
    isConnected: false,
    players: [],
    currentRound: 0,
    totalRounds: 0,
    gameActive: false,
    error: null,
  });

  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    socketRef.current = io('http://localhost:3000/game', {
      transports: ['websocket'],
      autoConnect: false,
    });

    socketRef.current.connect();

    // Connection events
    socketRef.current.on('connect', () => {
      setGameState(prev => ({ ...prev, isConnected: true, error: null }));
    });

    socketRef.current.on('disconnect', () => {
      setGameState(prev => ({ ...prev, isConnected: false }));
    });

    // Game events
    socketRef.current.on('player_update', (message) => {
      setGameState(prev => ({
        ...prev,
        players: message.data.players
      }));
    });

    socketRef.current.on('game_start', (message) => {
      setGameState(prev => ({
        ...prev,
        gameActive: true,
        totalRounds: message.data.totalRounds,
        currentRound: 1
      }));
    });

    socketRef.current.on('new_round', (message) => {
      setGameState(prev => ({
        ...prev,
        currentRound: message.data.roundNumber
      }));
    });

    socketRef.current.on('round_result', (message) => {
      setGameState(prev => ({
        ...prev,
        players: message.data.allScores
      }));
    });

    socketRef.current.on('game_over', (message) => {
      setGameState(prev => ({
        ...prev,
        gameActive: false,
        players: message.data.finalScores
      }));
    });

    socketRef.current.on('error', (message) => {
      setGameState(prev => ({
        ...prev,
        error: message.data.message
      }));
    });
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  const joinGame = useCallback((username: string) => {
    socketRef.current?.emit('join_game', username);
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit('start_game');
  }, []);

  const leaveGame = useCallback(() => {
    socketRef.current?.emit('leave_game');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    gameState,
    connect,
    disconnect,
    joinGame,
    startGame,
    leaveGame,
    socket: socketRef.current,
  };
};
