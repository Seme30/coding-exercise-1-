import React, { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { FaTimes, FaTrophy, FaMedal } from 'react-icons/fa';
import './WinnerDisplay.css';

interface Player {
  id: string;
  username: string;
  score: number;
}

interface WinnerDisplayProps {
  winner: Player;
  isGameWinner: boolean;
  currentPlayerId?: string;
  currentUsername?: string;
  onClose?: () => void;
}

type Shape = 'square' | 'circle';

export const WinnerDisplay: React.FC<WinnerDisplayProps> = ({ 
  winner, 
  isGameWinner,
  currentPlayerId,
  currentUsername,
  onClose 
}) => {
  const isCurrentPlayerWinner = (currentPlayerId && winner.id === currentPlayerId) || 
                              (currentUsername && winner.username === currentUsername);

  const fireConfetti = useCallback(() => {
    // Basic confetti burst
    const basicBurst = () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    };

    // Side cannon bursts
    const sideCannons = () => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    };

    // Realistic firework effect
    const firework = () => {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Random colors
        confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#ff0000', '#00ff00', '#0000ff'],
          shapes: ['circle' as Shape]
        }));
        
        confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#ff0000', '#00ff00', '#0000ff'],
          shapes: ['square' as Shape]
        }));
      }, 250);
    };

    // School pride effect
    const schoolPride = () => {
      const end = Date.now() + (3 * 1000);

      // Gold and silver colors
      const colors = ['#FFD700', '#C0C0C0', '#FFE4B5', '#FFFFFF'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
          shapes: ['square' as Shape],
          scalar: 2
        });
        
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
          shapes: ['square' as Shape],
          scalar: 2
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    };

    if (isGameWinner && isCurrentPlayerWinner) {
      // Sequence of celebrations for game winner
      basicBurst();
      setTimeout(sideCannons, 500);
      setTimeout(firework, 1000);
      setTimeout(schoolPride, 2000);
    } else if (isCurrentPlayerWinner) {
      // Simple celebration for round winner
      basicBurst();
      setTimeout(sideCannons, 300);
    }
  }, [isGameWinner, isCurrentPlayerWinner]);

  useEffect(() => {
    if (isCurrentPlayerWinner) {
      fireConfetti();
    }
  }, [isCurrentPlayerWinner, fireConfetti]);

  const renderWinnerContent = () => (
    <div className="winner-content">
      <div className="winner-trophy">
        {isGameWinner ? <FaTrophy className="trophy-icon" /> : <FaMedal className="medal-icon" />}
      </div>
      <h2>{isGameWinner ? 'Congratulations!' : 'Round Winner!'}</h2>
      <div className="winner-name">
        {isCurrentPlayerWinner ? 'You' : winner.username}
      </div>
      <div className="winner-message">
        {isGameWinner 
          ? (isCurrentPlayerWinner 
              ? "You've won the game!" 
              : `${winner.username} has won the game!`)
          : (isCurrentPlayerWinner 
              ? "You've won this round!" 
              : `${winner.username} won this round!`)}
      </div>
      <div className="winner-score">
        Score: {winner.score}
      </div>
      {isGameWinner && (
        <div className="celebration-emojis">
          <span>🎉</span>
          <span>🎊</span>
          <span>✨</span>
        </div>
      )}
    </div>
  );

  const renderLoserContent = () => (
    <div className="loser-content">
      <h2>{isGameWinner ? 'Game Over' : 'Round Over'}</h2>
      <div className="winner-name">
        {winner.username} wins!
      </div>
      <div className="loser-message">
        {isGameWinner 
          ? "Better luck next time!" 
          : "Keep playing, you can still win!"}
      </div>
      <div className="scores">
        <div className="winner-score">
          Winner's Score: {winner.score}
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className={`winner-display ${isGameWinner ? 'game-winner' : 'round-winner'} ${isCurrentPlayerWinner ? 'is-winner' : 'is-loser'}`} 
      onClick={isGameWinner ? onClose : undefined}
    >
      {isGameWinner && onClose && (
        <button className="close-button" onClick={onClose} aria-label="Close winner display">
          <FaTimes />
        </button>
      )}
      {isCurrentPlayerWinner ? renderWinnerContent() : renderLoserContent()}
    </div>
  );
}; 