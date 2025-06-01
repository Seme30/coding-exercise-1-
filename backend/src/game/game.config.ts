export const GameConfig = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 10,
  MIN_USERNAME_LENGTH: 2,
  MAX_USERNAME_LENGTH: 20,
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  PLAYER_TIMEOUT: 60000, // 1 minute
} as const;
