import React from 'react';
import './PlayerCard.css';

interface Player {
  id: string;
  username: string;
  score: number;
}

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  isSpinning: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentPlayer,
  isSpinning
}) => {
  return (
    <div 
      className={`
        player-card 
        ${isCurrentPlayer ? 'current-player' : ''} 
        ${isSpinning ? 'spinning' : ''}
      `}
    >
      <div className="player-info">
        <div className="player-avatar">
          {player.username[0].toUpperCase()}
        </div>
        <div className="player-details">
          <span className="player-name">
            {player.username}
            {isCurrentPlayer && <span className="player-tag">You</span>}
          </span>
        </div>
      </div>
      <div className="score-container">
        <span className="score-label">Score</span>
        <span className="score-value">{player.score}</span>
      </div>
    </div>
  );
}; 