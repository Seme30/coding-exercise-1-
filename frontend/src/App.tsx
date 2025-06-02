import React from 'react';
import { Game } from './components/Game';
import { GameProvider } from './context/GameContext';
import './App.css';

export const App: React.FC = () => {
  return (
    <GameProvider>
      <Game />
    </GameProvider>
  );
};

export default App;
