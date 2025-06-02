import React from 'react';
import './AppLayout.css';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="app-layout">
      <div className="game-background" />
      <div className="content-container">
        {children}
      </div>
    </div>
  );
}; 