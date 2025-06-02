import React, { useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import './JoinGame.css';

const debugLog = (action: string, data?: any) => {
  console.log(`[JoinGame Component] ${action}`, data ?? '');
};

interface JoinGameProps {
  socket: Socket | null;
  onJoinSuccess: (username: string) => void;
}

export const JoinGame: React.FC<JoinGameProps> = ({ socket, onJoinSuccess }) => {
  const [username, setUsername] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      debugLog('Submit attempted with empty username');
      setError('Username cannot be empty');
      return;
    }

    if (!socket?.connected) {
      debugLog('Submit attempted without connection');
      setError('Not connected to server');
      return;
    }
    
    debugLog('Submitting join request', { username: trimmedUsername });
    setIsAnimating(true);
    setError(null);

    try {
      // Emit join_game event and wait for response
      socket.emit('join_game', trimmedUsername);
      
      // Listen for success response
      socket.once('join_game_success', (response) => {
        debugLog('Join game success', response);
        setIsAnimating(false);
        onJoinSuccess(trimmedUsername);
      });

      // Listen for error response
      socket.once('error', (err) => {
        debugLog('Join game error', err);
        setError(err.message || 'Failed to join game');
        setIsAnimating(false);
      });
    } catch (err) {
      debugLog('Join game error', err);
      setError('Failed to join game');
      setIsAnimating(false);
    }
  }, [socket, username, onJoinSuccess]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setError(null);
    setUsername(newUsername);
    debugLog('Username input changed', { username: newUsername });
  };

  return (
    <div className="join-game-container">
      <div className="join-game-card">
        <h2 className="join-title">Join the Game</h2>
        <form onSubmit={handleSubmit} className="join-form">
          <div className="input-group">
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your username"
              className="username-input"
              minLength={2}
              maxLength={15}
              required
              disabled={!socket?.connected || isAnimating}
            />
            <div className="input-focus-indicator" />
          </div>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <button 
            type="submit" 
            className={`join-button ${isAnimating ? 'animating' : ''}`}
            disabled={!socket?.connected || !username.trim() || isAnimating}
          >
            <span className="button-text">
              {isAnimating ? 'Joining...' : 'Join Game'}
            </span>
            <span className="button-icon">→</span>
          </button>
        </form>
      </div>
    </div>
  );
}; 