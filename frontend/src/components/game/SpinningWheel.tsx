import React, { useEffect, useRef } from 'react';
import './SpinningWheel.css';

interface Player {
  id: string;
  username: string;
  score: number;
}

interface SpinningWheelProps {
  isSpinning: boolean;
  size?: 'small' | 'medium' | 'large';
  players: Player[];
  currentWinner?: Player;
}

export const SpinningWheel: React.FC<SpinningWheelProps> = ({ 
  isSpinning, 
  size = 'medium',
  players,
  currentWinner
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;

    const animate = () => {
      if (!isSpinning) {
        // If there's a winner, rotate to point to their position
        if (currentWinner) {
          const winnerIndex = players.findIndex(p => p.id === currentWinner.id);
          if (winnerIndex !== -1) {
            const targetRotation = (360 / players.length) * winnerIndex;
            const currentRotation = rotationRef.current % 360;
            const diff = targetRotation - currentRotation;
            
            if (Math.abs(diff) < 0.5) {
              rotationRef.current = targetRotation;
              wheel.style.transform = `rotate(${rotationRef.current}deg)`;
              return;
            }
            
            rotationRef.current += diff * 0.1; // Smooth stop
          }
        } else {
          // Default stop behavior
          const currentRotation = rotationRef.current % 360;
          const targetRotation = Math.round(currentRotation / 45) * 45;
          const diff = targetRotation - currentRotation;
          
          if (Math.abs(diff) < 0.5) {
            rotationRef.current = targetRotation;
            wheel.style.transform = `rotate(${rotationRef.current}deg)`;
            return;
          }
          
          rotationRef.current += diff * 0.1;
        }
      } else {
        // Spin with acceleration
        rotationRef.current += 10;
      }

      wheel.style.transform = `rotate(${rotationRef.current}deg)`;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpinning, currentWinner, players]);

  // Calculate segments for each player
  const segments = players.map((player, index) => {
    const angle = (index * 360) / players.length;
    const initials = player.username.slice(0, 2).toUpperCase();
    return (
      <div
        key={player.id}
        className={`wheel-segment ${currentWinner?.id === player.id ? 'winner-segment' : ''}`}
        style={{
          transform: `rotate(${angle}deg)`,
          backgroundColor: `hsl(${(360 / players.length) * index}, 70%, 60%)`
        }}
      >
        <div className="segment-content">
          <span className="player-initials">{initials}</span>
        </div>
      </div>
    );
  });

  return (
    <div className={`spinning-wheel-container ${size}`}>
      <div 
        className={`spinning-wheel ${isSpinning ? 'is-spinning' : ''}`} 
        ref={wheelRef}
      >
        <div className="wheel-center">
          <div className="center-circle" />
        </div>
        {segments}
      </div>
      <div className="wheel-pointer" />
    </div>
  );
}; 