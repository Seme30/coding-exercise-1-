import React, { useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import './Game.css';

export const Game: React.FC = () => {
  const [username, setUsername] = useState('');
  const {
    connect,
    disconnect,
    joinGame,
    startGame,
    leaveGame,
    isConnected,
    players,
    gameActive,
    currentRound,
    totalRounds,
    error,
    statusMessage,
    currentPlayer
  } = useWebSocket();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      return;
    }
    console.log('Submitting join request with username:', username);
    joinGame(username.trim());
  };

  return (
    <div className="game-container">
      <h2>Multi-Round Points Game</h2>
      
      <div className="connection-status">
        Status: {statusMessage}
        {!isConnected && (
          <div style={{ color: 'red' }}>
            Not connected to game server. Please wait...
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {isConnected && !currentPlayer && (
        <form onSubmit={handleJoin} className="join-form">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            minLength={2}
            required
          />
          <button type="submit">Join Game</button>
        </form>
      )}

      {currentPlayer && (
        <div className="game-controls">
          <button onClick={startGame} disabled={gameActive}>
            Start Game
          </button>
          <button onClick={leaveGame}>Leave Game</button>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}

      <div className="game-state">
        {gameActive && (
          <div className="round-info">
            <div className="round-number">Round {currentRound} of {totalRounds}</div>
            <div className="round-progress">
              <div 
                className="progress-bar" 
                style={{ width: `${(currentRound / totalRounds) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="players-list">
          <h3>Players ({players.length})</h3>
          <div className="players-grid">
            {players.map((player) => (
              <div 
                key={player.id} 
                className={`player-card ${
                  currentPlayer && player.id === currentPlayer.id ? 'current-player' : ''
                } ${gameActive ? 'spinning' : ''}`}
              >
                <span className="player-name">
                  {player.username}
                  {currentPlayer && player.id === currentPlayer.id && ' (You)'}
                </span>
                <span className="player-score">Score: {player.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
