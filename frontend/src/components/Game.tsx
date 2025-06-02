import React, { useEffect, useState } from 'react';
import { AppLayout } from './layout/AppLayout';
import { JoinGame } from './join/JoinGame';
import { PlayerList } from './players/PlayerList';
import { GameInfo } from './game/GameInfo';
import { WinnerDisplay } from './game/WinnerDisplay';
import { SpinningWheel } from './game/SpinningWheel';
import { useGameConnection, useGameState, usePlayers, useGameActions } from '../context/GameContext';
import { FaChevronRight, FaChevronLeft, FaUsers, FaUserFriends } from 'react-icons/fa';
import './Game.css';
import { GAME_CONSTANTS } from '../config/constants';

export const Game: React.FC = () => {
  const { isConnected, isConnecting, connectionError, socket, latency, reconnect } = useGameConnection();
  const { gameActive, currentRound, totalRounds, statusMessage, roundWinner, gameWinner, hasJoined, currentUsername } = useGameState();
  const { players, currentPlayerId } = usePlayers();
  const { joinGame, startGame, leaveGame } = useGameActions();
  const [showWinnerDisplay, setShowWinnerDisplay] = useState(false);
  const [isPlayerListCollapsed, setIsPlayerListCollapsed] = useState(false);
  const [roundTimings, setRoundTimings] = useState<{ serverTimestamp: number; expectedEndTime: number; } | undefined>();

  useEffect(() => {
    const currentPlayer = players.find(p => p.id === currentPlayerId);
  }, [players, currentPlayerId, hasJoined, currentUsername]);

  useEffect(() => {
    if (gameWinner && !gameActive && hasJoined) {
      setShowWinnerDisplay(true);
    }
  }, [gameWinner, gameActive, currentPlayerId, hasJoined, players, currentUsername]);

  useEffect(() => {
    if (socket) {
      socket.on('round_start', (data) => {
        setRoundTimings({
          serverTimestamp: data.serverTimestamp,
          expectedEndTime: data.expectedEndTime
        });
      });

      socket.on('round_end', () => {
        setRoundTimings(undefined);
      });

      return () => {
        socket.off('round_start');
        socket.off('round_end');
      };
    }
  }, [socket]);

  const handleJoinSuccess = async (username: string) => {
    try {
      await joinGame(username);
    } catch (err) {
      // Handle error silently
    }
  };

  const togglePlayerList = () => {
    setIsPlayerListCollapsed(!isPlayerListCollapsed);
  };

  const closeWinnerDisplay = () => {
    setShowWinnerDisplay(false);
  };

  const isNewPlayer = isConnected && !hasJoined && !currentPlayerId;
  const isAnyPlayerSpinning = players.some(player => player.isSpinning);
  const isCurrentPlayerWinner = gameWinner?.id === currentPlayerId;
  const isAutoStarting = statusMessage.toLowerCase().includes('auto-starting');
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const minPlayersToStart = GAME_CONSTANTS.MIN_PLAYERS_TO_START;

  return (
    <AppLayout>
      {!isConnected && (
        <div className="connection-status">
          {isConnecting ? 'Connecting...' : `Connection Error: ${connectionError}`}
          <button onClick={reconnect}>Reconnect</button>
        </div>
      )}

      {isConnected && (
        <div className={`active-game-container ${gameActive ? 'game-running' : ''}`}>
          {(gameActive || isAutoStarting) ? (
            <GameInfo 
              currentRound={currentRound} 
              totalRounds={totalRounds}
              statusMessage={statusMessage}
              roundTimings={roundTimings}
            />
          ) : hasJoined && currentPlayer ? (
            <div className="current-player-info">
              <h2>Welcome back, {currentPlayer.username}!</h2>
              <p>Waiting for game to start...</p>
              <div className="players-needed">
                {players.length < minPlayersToStart ? (
                  <p className="waiting-message">
                    Waiting for {minPlayersToStart - players.length} more player{minPlayersToStart - players.length !== 1 ? 's' : ''} to join...
                  </p>
                ) : (
                  <p className="ready-message">
                    Game will start soon!
                  </p>
                )}
              </div>
            </div>
          ) : !isAutoStarting && isNewPlayer && (
            <div className="join-game-container">
              <JoinGame onJoin={joinGame} />
              <div className="players-status">
                <p>Current players: {players.length}</p>
                <p>Need {Math.max(0, minPlayersToStart - players.length)} more to start</p>
              </div>
            </div>
          )}
          
          {players.length > 0 && (
            <div className="game-content">
              <div className={`player-list-container ${isPlayerListCollapsed ? 'collapsed' : ''}`}>
                <button 
                  className="player-list-toggle"
                  onClick={togglePlayerList}
                  aria-label={isPlayerListCollapsed ? "Show player list" : "Hide player list"}
                >
                  {isPlayerListCollapsed ? (
                    <>
                      <FaUsers className="toggle-icon" />
                      <FaChevronRight className="toggle-arrow" />
                    </>
                  ) : (
                    <>
                      <FaUserFriends className="toggle-icon" />
                      <FaChevronLeft className="toggle-arrow" />
                    </>
                  )}
                </button>
                <PlayerList 
                  players={players}
                  currentPlayerId={currentPlayerId}
                  roundWinner={roundWinner}
                  gameWinner={gameWinner}
                />
              </div>

              <div className="game-wheel-container">
                <div className="wheel-wrapper">
                  <SpinningWheel 
                    isSpinning={gameActive && isAnyPlayerSpinning}
                    size="large"
                    players={players}
                    currentWinner={roundWinner}
                  />
                </div>
              </div>
            </div>
          )}

          {roundWinner && !gameWinner && hasJoined && (
            <WinnerDisplay 
              winner={roundWinner}
              isGameWinner={false}
              currentPlayerId={currentPlayerId}
              currentUsername={currentUsername}
            />
          )}

          {gameWinner && showWinnerDisplay && hasJoined && (
            <WinnerDisplay 
              winner={gameWinner}
              isGameWinner={true}
              currentPlayerId={currentPlayerId}
              currentUsername={currentUsername}
              onClose={closeWinnerDisplay}
            />
          )}

          {currentPlayerId && (
            <button 
              className="leave-game-button"
              onClick={leaveGame}
            >
              Leave Game
            </button>
          )}
        </div>
      )}
    </AppLayout>
  );
};
