import React from 'react';
import './GameInfo.css';

interface GameInfoProps {
  status: string;
  error: string | null;
  socket: any;
  stats: {
    latency: number;
    messagesSent: number;
    messagesReceived: number;
  };
}

const debugLog = (action: string, data?: any) => {
  console.log(`[GameInfo Component] ${action}`, data ?? '');
};

export const GameInfo: React.FC<GameInfoProps> = ({ status, error, socket, stats }) => {
  debugLog('Rendering', { status, error, socketId: socket?.id, stats });

  return (
    <div className="game-info">
      <div className="info-grid">
        <div className="info-section">
          <h3>Game Status</h3>
          <div className="status-message">
            {status}
          </div>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {/* <div className="info-section">
          <h3>Connection Details</h3>
          <div className="connection-details">
            <div>Socket ID: {socket?.id || 'Not connected'}</div>
            <div>Transport: {socket?.io?.engine?.transport?.name || 'None'}</div>
            <div>Latency: {stats.latency}ms</div>
            <div>Messages Sent: {stats.messagesSent}</div>
            <div>Messages Received: {stats.messagesReceived}</div>
          </div>
        </div> */}
      </div>
    </div>
  );
}; 