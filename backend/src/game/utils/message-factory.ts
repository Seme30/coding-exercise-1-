import * as WSMessages from '../types/websocket-messages';
import { GAME_CONSTANTS } from '../constants';
export class GameMessageFactory {
  private static createBaseMessage(type: string): Pick<WSMessages.WebSocketMessage, 'type' | 'timestamp'> {
    return {
      type,
      timestamp: Date.now()
    };
  }
  static createPlayerUpdate(players: any[], totalPlayers: number): WSMessages.PlayerUpdateMessage {
    return {
      type: 'player_update' as const,
      timestamp: Date.now(),
      data: {
        players,
        totalPlayers
      }
    };
  }
  static createGameStart(data: any): WSMessages.GameStartMessage {
    return {
      type: 'game_start' as const,
      timestamp: Date.now(),
      data: {
        ...data,
        startTime: new Date(),
        countdownDuration: GAME_CONSTANTS.COUNTDOWN_DURATION
      }
    };
  }
  static createNewRound(data: any): WSMessages.NewRoundMessage {
    return {
      type: 'new_round' as const,
      timestamp: Date.now(),
      data: {
        ...data,
        startTime: new Date()
      }
    };
  }
  static createRoundResult(data: any): WSMessages.RoundResultMessage {
    return {
      type: 'round_result' as const,
      timestamp: Date.now(),
      data
    };
  }
  static createGameOver(data: any): WSMessages.GameOverMessage {
    return {
      type: 'game_over' as const,
      timestamp: Date.now(),
      data
    };
  }
  static createError(code: string, message: string, details?: any): WSMessages.ErrorMessage {
    return {
      type: 'error' as const,
      timestamp: Date.now(),
      data: {
        code,
        message,
        details
      }
    };
  }
}
