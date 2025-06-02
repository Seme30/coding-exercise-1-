import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import './WinnerDisplay.css';

interface WinnerDisplayProps {
  winner: {
    username: string;
    score: number;
  };
  isCurrentPlayer: boolean;
}

export const WinnerDisplay: React.FC<WinnerDisplayProps> = ({ winner, isCurrentPlayer }) => {
  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const confettiInterval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(confettiInterval);
        return;
      }

      const particleCount = 50;

      confetti({
        particleCount,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107'],
        angle: randomInRange(55, 125)
      });
    }, 250);

    return () => clearInterval(confettiInterval);
  }, []);

  return (
    <div className={`winner-display ${isCurrentPlayer ? 'is-winner' : 'is-loser'}`}>
      <div className="winner-content">
        <h2 className="game-over">Game Over!</h2>
        {isCurrentPlayer ? (
          <>
            <div className="winner-trophy">🏆</div>
            <h3 className="winner-text">Congratulations!</h3>
            <p className="winner-message">You won with {winner.score} points!</p>
            <div className="winner-celebration">
              <span className="celebration-emoji">🎉</span>
              <span className="celebration-emoji">🎊</span>
              <span className="celebration-emoji">🌟</span>
            </div>
          </>
        ) : (
          <>
            <div className="loser-emoji">😔</div>
            <h3 className="loser-text">Game Over</h3>
            <p className="winner-announcement">
              {winner.username} won with {winner.score} points!
            </p>
            <p className="better-luck">Better luck next time!</p>
          </>
        )}
      </div>
    </div>
  );
}; 