import React, { useState } from 'react';
import { useGameWebSocket } from '../hooks/useGameWebSocket';

export const Game: React.FC = () => {
  const [username, setUsername] = useState('');
  const { gameState, connect, disconnect, joinGame, startGame, leaveGame } = useGameWebSocket();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      connect();
      joinGame(username.trim());
    }
  };

  return (
    <div className="game-container">
      <div className="connection-status">
        Status: {gameState.isConnected ? 'Connected' : 'Disconnected'}
      </div>

      {!gameState.isConnected ? (
        <form onSubmit={handleJoin}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
          <button type="submit">Join Game</button>
        </form>
      ) : (
        <div className="game-controls">
          <button onClick={startGame} disabled={gameState.gameActive}>
            Start Game
          </button>
          <button onClick={leaveGame}>Leave Game</button>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}

      {gameState.error && (
        <div className="error-message">
          Error: {gameState.error}
        </div>
      )}

      <div className="game-state">
        <h3>Game State</h3>
        <div>Active: {gameState.gameActive ? 'Yes' : 'No'}</div>
        <div>Round: {gameState.currentRound} / {gameState.totalRounds}</div>
      </div>

      <div className="players-list">
        <h3>Players</h3>
        <ul>
          {gameState.players.map((player) => (
            <li key={player.id}>
              {player.username} - Score: {player.score}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
