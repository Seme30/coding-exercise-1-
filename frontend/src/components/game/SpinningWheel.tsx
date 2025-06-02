import React, { useEffect, useRef } from 'react';
import './SpinningWheel.css';

interface SpinningWheelProps {
  isSpinning: boolean;
  size?: 'small' | 'medium' | 'large';
  spokeCount?: number;
}

export const SpinningWheel: React.FC<SpinningWheelProps> = ({ 
  isSpinning, 
  size = 'medium',
  spokeCount = 8
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;

    const animate = () => {
      if (!isSpinning) {
        // Slow down and stop
        const currentRotation = rotationRef.current % 360;
        const targetRotation = Math.round(currentRotation / 45) * 45; // Snap to nearest 45 degrees
        const diff = targetRotation - currentRotation;
        
        if (Math.abs(diff) < 0.5) {
          rotationRef.current = targetRotation;
          wheel.style.transform = `rotate(${rotationRef.current}deg)`;
          return;
        }
        
        rotationRef.current += diff * 0.1; // Smooth stop
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
  }, [isSpinning]);

  const spokes = Array.from({ length: spokeCount }, (_, i) => {
    const angle = (i * 360) / spokeCount;
    return (
      <div
        key={i}
        className="spoke"
        style={{ transform: `rotate(${angle}deg)` }}
      />
    );
  });

  return (
    <div className={`spinning-wheel-container ${size}`}>
      <div className={`spinning-wheel ${isSpinning ? 'is-spinning' : ''}`} ref={wheelRef}>
        <div className="wheel-hub">
          <div className="hub-center" />
        </div>
        {spokes}
        <div className="wheel-rim" />
      </div>
      <div className="wheel-pointer" />
    </div>
  );
}; 