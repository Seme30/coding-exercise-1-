import React from 'react';
import { SpinningElement } from '../game/SpinningElement';
import './PlayerList.css';

const debugLog = (action: string, data?: any) => {
  console.log(`[PlayerList Component] ${action}`, data ?? '');
};

interface Player {
  id: string;
  username: string;
  score: number;
  isSpinning?: boolean;
  isDisconnected?: boolean;
}

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
  roundWinner?: Player;
  gameWinner?: Player;
}

export const PlayerList: React.FC<PlayerListProps> = ({ 
  players, 
  currentPlayerId,
  roundWinner,
  gameWinner
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="player-list">
      <h3>Players</h3>
      <div className="players-grid">
        {sortedPlayers.map((player) => (
          <div 
            key={player.id} 
            className={`player-card 
              ${player.id === currentPlayerId ? 'current-player' : ''} 
              ${player.id === roundWinner?.id ? 'round-winner' : ''}
              ${player.id === gameWinner?.id ? 'game-winner' : ''}
              ${player.isSpinning ? 'spinning' : ''}
              ${player.isDisconnected ? 'disconnected' : ''}`}
          >
            <div className="player-info">
              <div className="player-name">
                {player.username}
                {player.isDisconnected && (
                  <span className="disconnected-badge">Disconnected</span>
                )}
              </div>
              <div className="player-score">Score: {player.score}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 