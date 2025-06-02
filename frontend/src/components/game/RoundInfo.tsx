import React, { useEffect, useState } from 'react';
import './RoundInfo.css';

interface RoundInfoProps {
  currentRound: number;
  totalRounds: number;
  isActive: boolean;
  roundWinner?: {
    username: string;
    score: number;
  };
}

export const RoundInfo: React.FC<RoundInfoProps> = ({
  currentRound,
  totalRounds,
  isActive,
  roundWinner
}) => {
  const [countdown, setCountdown] = useState<number>(0);
  const [roundStatus, setRoundStatus] = useState<string>('');

  useEffect(() => {
    if (isActive) {
      setCountdown(8); // 8 seconds per round
      setRoundStatus('Round in progress');
      const timer = setInterval(() => {
        setCountdown(prev => {
          const newCount = Math.max(0, prev - 1);
          if (newCount === 0) {
            setRoundStatus('Round ending...');
          }
          return newCount;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else if (roundWinner) {
      setRoundStatus('Round complete');
    }
  }, [isActive, currentRound, roundWinner]);

  return (
    <div className={`round-info ${isActive ? 'active' : ''}`}>
      <div className="round-header">
        <h2>Round {currentRound} of {totalRounds}</h2>
        <div className="round-status">{roundStatus}</div>
        {isActive && (
          <div className="round-countdown">
            <div className="countdown-circle">
              <svg viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#4CAF50"
                  strokeWidth="3"
                  strokeDasharray={`${(countdown / 8) * 100}, 100`}
                />
              </svg>
              <span className="countdown-number">{countdown}</span>
            </div>
          </div>
        )}
      </div>
      
      {roundWinner && (
        <div className="round-winner">
          <div className="winner-announcement">
            Round Winner: <span className="winner-name">{roundWinner.username}</span>
          </div>
          <div className="winner-score">
            Score: <span className="score-value">+{roundWinner.score}</span>
          </div>
        </div>
      )}

      <div className="round-progress">
        {[...Array(totalRounds)].map((_, index) => (
          <div
            key={index}
            className={`
              progress-dot
              ${index + 1 === currentRound ? 'current' : ''}
              ${index + 1 < currentRound ? 'completed' : ''}
            `}
            title={`Round ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}; 