import React, { useEffect, useRef, useState } from 'react';
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
  const speedRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  const [showParticles, setShowParticles] = useState(false);

  // Sound effects
  const spinSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio elements
    spinSound.current = new Audio('/sounds/spin.mp3');
    winSound.current = new Audio('/sounds/win.mp3');

    // Cleanup
    return () => {
      if (spinSound.current) {
        spinSound.current.pause();
        spinSound.current = null;
      }
      if (winSound.current) {
        winSound.current.pause();
        winSound.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;

    const maxSpeed = 25; // Maximum rotation speed
    const acceleration = 2; // How quickly it speeds up
    const deceleration = 0.98; // How quickly it slows down
    const minSpeed = 0.1; // Speed threshold for stopping

    const animate = () => {
      if (isSpinning) {
        // Accelerate up to max speed
        speedRef.current = Math.min(speedRef.current + acceleration, maxSpeed);
        // Add some wobble during high-speed spinning
        const wobble = Math.sin(Date.now() / 100) * 0.5;
        rotationRef.current += speedRef.current + wobble;

        // Play spin sound if not already playing
        if (spinSound.current && spinSound.current.paused) {
          spinSound.current.play().catch(() => {}); // Ignore autoplay restrictions
        }
      } else {
        // If there's a winner, calculate target rotation
        if (currentWinner) {
          const winnerIndex = players.findIndex(p => p.id === currentWinner.id);
          if (winnerIndex !== -1) {
            const segmentSize = 360 / players.length;
            const targetRotation = segmentSize * winnerIndex;
            const currentRotation = rotationRef.current % 360;
            const shortestDistance = ((targetRotation - currentRotation + 540) % 360) - 180;
            
            // Gradually slow down and align with winner segment
            if (Math.abs(speedRef.current) > minSpeed || Math.abs(shortestDistance) > 0.5) {
              speedRef.current = Math.max(
                Math.abs(shortestDistance) * 0.1,
                speedRef.current * deceleration
              );
              rotationRef.current += shortestDistance > 0 ? speedRef.current : -speedRef.current;
            } else {
              // Perfectly aligned with winner
              rotationRef.current = targetRotation;
              speedRef.current = 0;
              
              // Show celebration particles
              setShowParticles(true);
              
              // Play win sound
              if (winSound.current) {
                winSound.current.play().catch(() => {});
              }
              
              return;
            }
          }
        } else {
          // Default stop behavior - gradually slow down
          speedRef.current *= deceleration;
          if (Math.abs(speedRef.current) < minSpeed) {
            speedRef.current = 0;
            return;
          }
          rotationRef.current += speedRef.current;
        }
      }

      // Apply rotation with smooth easing
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

  // Reset particles when spinning starts
  useEffect(() => {
    if (isSpinning) {
      setShowParticles(false);
    }
  }, [isSpinning]);

  // Calculate segments for each player
  const segments = players.map((player, index) => {
    const angle = (index * 360) / players.length;
    const initials = player.username.slice(0, 2).toUpperCase();
    const isWinner = currentWinner?.id === player.id;
    
    return (
      <div
        key={player.id}
        className={`wheel-segment ${isWinner ? 'winner-segment' : ''}`}
        style={{
          transform: `rotate(${angle}deg)`,
          backgroundColor: `hsl(${(360 / players.length) * index}, 70%, ${isWinner ? '65%' : '60%'})`,
        }}
      >
        <div className="segment-content">
          <div className="segment-3d-effect" />
          <span className="player-initials">{initials}</span>
          {isWinner && showParticles && (
            <div className="winner-particles">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`particle particle-${i}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  });

  return (
    <div className={`spinning-wheel-container ${size}`}>
      <div 
        className={`spinning-wheel ${isSpinning ? 'is-spinning' : ''} ${showParticles ? 'show-particles' : ''}`} 
        ref={wheelRef}
      >
        <div className="wheel-center">
          <div className="center-circle">
            <div className="center-dot" />
          </div>
        </div>
        {segments}
      </div>
      <div className="wheel-pointer">
        <div className="pointer-light" />
      </div>
    </div>
  );
}; 