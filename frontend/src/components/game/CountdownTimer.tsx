import React, { useEffect, useState, useCallback } from 'react';
import './CountdownTimer.css';

interface CountdownTimerProps {
  serverTimestamp: number;
  expectedEndTime: number;
  onComplete?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  serverTimestamp,
  expectedEndTime,
  onComplete
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progress, setProgress] = useState<number>(100);

  const calculateTimeLeft = useCallback(() => {
    const now = Date.now();
    const serverTimeOffset = now - serverTimestamp;
    const adjustedEndTime = expectedEndTime + serverTimeOffset;
    return Math.max(0, Math.floor((adjustedEndTime - now) / 1000));
  }, [serverTimestamp, expectedEndTime]);

  useEffect(() => {
    const totalDuration = expectedEndTime - serverTimestamp;
    const updateTimer = () => {
      const secondsLeft = calculateTimeLeft();
      setTimeLeft(secondsLeft);
      
      // Calculate progress percentage
      const elapsed = Date.now() - serverTimestamp;
      const progressPercent = Math.max(0, Math.min(100, (1 - elapsed / totalDuration) * 100));
      setProgress(progressPercent);

      if (secondsLeft === 0) {
        onComplete?.();
        return;
      }
    };

    // Initial update
    updateTimer();

    // Update every 100ms for smooth progress animation
    const intervalId = setInterval(updateTimer, 100);

    return () => clearInterval(intervalId);
  }, [serverTimestamp, expectedEndTime, calculateTimeLeft, onComplete]);

  return (
    <div className="countdown-timer">
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
            strokeDasharray={`${progress}, 100`}
          />
        </svg>
        <span className="countdown-number">{timeLeft}</span>
      </div>
    </div>
  );
}; 