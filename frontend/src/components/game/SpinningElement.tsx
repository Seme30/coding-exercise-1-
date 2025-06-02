import React from 'react';
import './SpinningElement.css';

interface SpinningElementProps {
  isSpinning: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const SpinningElement: React.FC<SpinningElementProps> = ({ 
  isSpinning, 
  size = 'medium',
  color = '#4CAF50'
}) => {
  return (
    <div className={`
      spinning-element-container
      ${isSpinning ? 'is-spinning' : ''}
      size-${size}
    `}>
      <div 
        className="spinning-element"
        style={{ 
          '--spinner-color': color
        } as React.CSSProperties}
      >
        <div className="inner-circle"></div>
        <div className="outer-circle"></div>
        <div className="spinner-particles">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`particle particle-${i + 1}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
}; 