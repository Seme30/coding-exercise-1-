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
  joinedAt: number;
  isSpinning?: boolean;
}

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
  gameActive: boolean;
}

export const PlayerList: React.FC<PlayerListProps> = ({ 
  players, 
  currentPlayerId,
  gameActive 
}) => {
  debugLog('Component rendered with props', { 
    players, 
    currentPlayerId, 
    gameActive,
    playerCount: players.length,
    playerIds: players.map(p => p.id),
    playerUsernames: players.map(p => p.username)
  });

  if (!players.length) {
    debugLog('No players to display');
    return (
      <div className="player-list empty">
        <h2>Players</h2>
        <div className="no-players">
          Waiting for players to join...
        </div>
      </div>
    );
  }

  return (
    <div className="player-list">
      <h2>Players ({players.length})</h2>
      <div className="players">
        {players.map((player) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          debugLog('Rendering player', { 
            playerId: player.id, 
            isCurrentPlayer,
            score: player.score,
            isSpinning: player.isSpinning
          });
          
          return (
            <div 
              key={player.id}
              className={`
                player-card
                ${isCurrentPlayer ? 'current-player' : ''}
                ${gameActive ? 'game-active' : ''}
                ${player.isSpinning ? 'spinning' : ''}
              `}
            >
              <div className="player-info">
                <div className="player-name">
                  {player.username}
                  {isCurrentPlayer && <span className="current-player-indicator">You</span>}
                </div>
                <div className="player-score">
                  {player.score} pts
                </div>
              </div>
              <div className="player-joined">
                Joined: {new Date(player.joinedAt).toLocaleTimeString()}
              </div>
              {gameActive && (
                <div className="player-spinner">
                  <SpinningElement 
                    isSpinning={player.isSpinning || false}
                    size="small"
                    color={isCurrentPlayer ? '#4CAF50' : '#8BC34A'}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}; 