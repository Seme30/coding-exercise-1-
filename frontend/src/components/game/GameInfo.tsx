import React, { useEffect, useState } from 'react';
import { FaClock } from 'react-icons/fa';
import { useGameState, usePlayers } from '../../context/GameContext';
import './GameInfo.css';

interface GameInfoProps {
  currentRound: number;
  totalRounds: number;
  statusMessage: string;
}

const debugLog = (action: string, data?: any) => {
  console.log(`[GameInfo Component] ${action}`, data ?? '');
};

export const GameInfo: React.FC<GameInfoProps> = ({ 
  currentRound, 
  totalRounds, 
  statusMessage
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(null);
  const { currentUsername } = useGameState();
  const { currentPlayerId } = usePlayers();

  useEffect(() => {
    debugLog('Current player updated', { currentPlayerId, currentUsername });
  }, [currentPlayerId, currentUsername]);

  useEffect(() => {
    // Extract countdown from status message
    if (statusMessage.toLowerCase().includes('starting in')) {
      const countdownMatch = statusMessage.match(/\d+/);
      if (countdownMatch) {
        setCountdown(parseInt(countdownMatch[0]));
      }
    } else if (statusMessage.toLowerCase().includes('auto-starting in')) {
      const countdownMatch = statusMessage.match(/\d+/);
      if (countdownMatch) {
        setAutoStartCountdown(parseInt(countdownMatch[0]));
      }
    } else {
      setCountdown(null);
      setAutoStartCountdown(null);
    }
  }, [statusMessage]);

  return (
    <div className="game-info">
      <div className="round-info">
        <div className="round-numbers">
          Round {currentRound} of {totalRounds}
        </div>
        {currentUsername && (
          <div className="current-player">
            <span>Playing as:</span>
            <span className="player-username">{currentUsername}</span>
          </div>
        )}
      </div>
      <div className="status-message">
        {statusMessage}
      </div>
      {(countdown !== null || autoStartCountdown !== null) && (
        <div className="countdown">
          <FaClock className="countdown-icon" />
          {countdown !== null ? (
            <span>Starting in: {countdown}s</span>
          ) : (
            <span>Auto-starting in: {autoStartCountdown}s</span>
          )}
        </div>
      )}
    </div>
  );
}; 