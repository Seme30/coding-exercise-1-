import { Game } from './components/Game';
import { GameProvider } from './context/GameContext';
import './App.css';

function App() {
  return (
    <GameProvider>
      <div className="App">
        <h1>Multi-Round Points Game</h1>
        <Game />
      </div>
    </GameProvider>
  );
}

export default App;
