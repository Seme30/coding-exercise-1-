import React, { useState, useCallback } from 'react';
import './JoinGame.css';

const debugLog = (action: string, data?: any) => {
  console.log(`[JoinGame Component] ${action}`, data ?? '');
};

interface JoinGameProps {
  onJoin: (username: string) => Promise<void>;
}

export const JoinGame: React.FC<JoinGameProps> = ({ onJoin }) => {
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

    debugLog('Submitting join request', { username: trimmedUsername });
    setIsAnimating(true);
    setError(null);

    try {
      localStorage.setItem('gameUsername', trimmedUsername);
      await onJoin(trimmedUsername);
      setIsAnimating(false);
    } catch (err) {
      debugLog('Join game error', err);
      setError(err instanceof Error ? err.message : 'Failed to join game');
      setIsAnimating(false);
    }
  }, [username, onJoin]);

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
              disabled={isAnimating}
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
            disabled={!username.trim() || isAnimating}
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