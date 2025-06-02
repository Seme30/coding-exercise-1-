import React from 'react';
import { AppLayout } from './layout/AppLayout';
import { JoinGame } from './join/JoinGame';
import { PlayerList } from './players/PlayerList';
import { GameInfo } from './game/GameInfo';
import { RoundInfo } from './game/RoundInfo';
import { WinnerDisplay } from './game/WinnerDisplay';
import { SpinningWheel } from './game/SpinningWheel';
import { useGameConnection, useGameState, usePlayers, useGameActions } from '../context/GameContext';
import './Game.css';

const debugLog = (action: string, data?: any) => {
  console.log(`[Game Component] ${action}`, data ?? '');
};

export const Game: React.FC = () => {
  const { isConnected, isConnecting, connectionError, socket, latency, reconnect } = useGameConnection();
  const { gameActive, currentRound, totalRounds, statusMessage, roundWinner, gameWinner } = useGameState();
  const { players, currentPlayerId } = usePlayers();
  const { joinGame } = useGameActions();

  debugLog('Rendering with state', { 
    isConnected, 
    currentPlayerId, 
    gameActive, 
    playerCount: players.length,
    players,
    gameWinner
  });

  const handleJoinSuccess = async (username: string) => {
    try {
      debugLog('Joining game', { username });
      await joinGame(username);
    } catch (err) {
      debugLog('Join game error', err);
    }
  };

  const showJoinForm = isConnected && !currentPlayerId && !gameActive;
  const isSpinning = gameActive && players.some(p => p.isSpinning);

  return (
    <AppLayout>
      <div className="game-container">
        <GameInfo 
          status={statusMessage}
          error={connectionError}
          socket={socket}
          stats={{
            latency,
            messagesSent: 0,
            messagesReceived: 0
          }}
        />

        {isConnecting && (
          <div className="connecting-toast">
            Connecting to server...
          </div>
        )}

        {showJoinForm && (
          <JoinGame 
            socket={socket}
            onJoinSuccess={handleJoinSuccess}
          />
        )}

        {isConnected && (
          <>
            {gameActive && (
              <>
                <RoundInfo
                  currentRound={currentRound}
                  totalRounds={totalRounds}
                  isActive={gameActive}
                  roundWinner={roundWinner}
                />
                <div className="game-wheel-container">
                  <SpinningWheel 
                    isSpinning={isSpinning}
                    size="large"
                    spokeCount={8}
                  />
                </div>
              </>
            )}

            <PlayerList 
              players={players}
              currentPlayerId={currentPlayerId}
              gameActive={gameActive}
            />

            {gameWinner && !gameActive && (
              <WinnerDisplay
                winner={gameWinner}
                isCurrentPlayer={gameWinner.id === currentPlayerId}
              />
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};
