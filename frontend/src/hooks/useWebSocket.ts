import { useCallback, useRef, useState, useEffect } from 'react';
import { useGameConnection, useGameState, useGameActions } from '../context/GameContext';

interface Player {
  id: string;
  username: string;
  score: number;
  joinedAt: string;
}

export const useWebSocket = () => {
  const { socket, reconnect } = useGameConnection();
  const { currentUsername } = useGameState();
  const { leaveGame } = useGameActions();
  
  const [isSocketReady, setIsSocketReady] = useState(false);
  const mountedRef = useRef(false);
  const hasJoinedRef = useRef(false);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLeaveGame = useCallback(() => {
    if (socket?.connected) {
      socket.emit('leave_game', { reason: 'user_left' });
      leaveGame();
      socket.disconnect();
    }
  }, [socket, leaveGame]);

  const setupSocketListeners = useCallback(() => {
    if (!socket) return;

    socket.on('connect', () => {
      console.log('Socket connected successfully');
      if (mountedRef.current) {
        setIsSocketReady(true);
        
        // If we were previously joined, try to rejoin
        if (hasJoinedRef.current && currentUsername) {
          socket.emit('join_game', currentUsername);
        }
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (mountedRef.current) {
        setIsSocketReady(false);
      }
    });
  }, [socket, currentUsername]);

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (socket?.connected) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave the game?';
        
        // Set a timeout to handle the case where user doesn't respond
        leaveTimeoutRef.current = setTimeout(() => {
          handleLeaveGame();
        }, 20000); // 20 seconds timeout
        
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
        leaveTimeoutRef.current = null;
      }
    };
  }, [socket, handleLeaveGame]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && socket?.connected) {
        // Show a custom confirmation dialog
        const shouldLeave = window.confirm('Are you sure you want to leave the game?');
        
        if (shouldLeave) {
          // User clicked OK - leave the game
          handleLeaveGame();
        } else {
          // User clicked Cancel - clear any pending leave timeout
          if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
            leaveTimeoutRef.current = null;
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [socket, handleLeaveGame]);

  useEffect(() => {
    mountedRef.current = true;
    setupSocketListeners();

    return () => {
      mountedRef.current = false;
      if (socket) {
        socket.removeAllListeners();
      }
      // Clear any pending timeouts
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
        leaveTimeoutRef.current = null;
      }
    };
  }, [socket, setupSocketListeners]);

  return {
    isSocketReady,
    socket,
    handleLeaveGame
  };
}; 