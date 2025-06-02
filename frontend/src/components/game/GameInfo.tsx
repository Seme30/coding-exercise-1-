import React, { useEffect, useState } from 'react';
import { FaClock } from 'react-icons/fa';
import { useGameState, usePlayers } from '../../context/GameContext';
import { CountdownTimer } from './CountdownTimer';
import './GameInfo.css';

interface GameInfoProps {
  currentRound: number;
  totalRounds: number;
  statusMessage: string;
  roundTimings?: {
    serverTimestamp: number;
    expectedEndTime: number;
  };
}

const debugLog = (action: string, data?: any) => {
  console.log(`[GameInfo Component] ${action}`, data ?? '');
};

export const GameInfo: React.FC<GameInfoProps> = ({ 
  currentRound, 
  totalRounds, 
  statusMessage,
  roundTimings
}) => {
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(null);
  const { currentUsername } = useGameState();
  const { currentPlayerId } = usePlayers();

  useEffect(() => {
    debugLog('Current player updated', { currentPlayerId, currentUsername });
  }, [currentPlayerId, currentUsername]);

  useEffect(() => {
    if (statusMessage.toLowerCase().includes('auto-starting in')) {
      const countdownMatch = statusMessage.match(/\d+/);
      if (countdownMatch) {
        setAutoStartCountdown(parseInt(countdownMatch[0]));
      }
    } else {
      setAutoStartCountdown(null);
    }
  }, [statusMessage]);

  const handleCountdownComplete = () => {
    // Optional: Add any completion logic here
  };

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
      {roundTimings && (
        <CountdownTimer
          serverTimestamp={roundTimings.serverTimestamp}
          expectedEndTime={roundTimings.expectedEndTime}
          onComplete={handleCountdownComplete}
        />
      )}
      {autoStartCountdown !== null && (
        <div className="countdown">
          <FaClock className="countdown-icon" />
          <span>Auto-starting in: {autoStartCountdown}s</span>
        </div>
      )}
    </div>
  );
}; 