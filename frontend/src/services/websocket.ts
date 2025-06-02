import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private url = 'http://localhost:3000';
  private namespace = '/game';
  private isConnecting: boolean = false;

  private constructor() {
    console.log('[WebSocket] Service initialized');
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public connect(): Socket {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('[WebSocket] Connection already in progress');
      if (this.socket) return this.socket;
      throw new Error('Connection in progress');
    }

    // Return existing socket if it's connected
    if (this.socket?.connected) {
      console.log('[WebSocket] Reusing existing connection');
      return this.socket;
    }

    console.log('[WebSocket] Connecting to:', this.url + this.namespace);
    this.isConnecting = true;

    try {
      // Clean up existing socket if any
      if (this.socket) {
        console.log('[WebSocket] Cleaning up existing socket');
        this.socket.removeAllListeners();
        this.socket.close();
        this.socket = null;
      }

      const socketConfig = {
        transports: ['websocket'],
        path: '/socket.io',
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 5000,
        autoConnect: false // Prevent auto-connection
      };

      console.log('[WebSocket] Creating socket with config:', socketConfig);
      this.socket = io(this.url + this.namespace, socketConfig);

      // Set up event handlers
      this.socket.on('connect', () => {
        console.log('[WebSocket] Connected successfully', {
          id: this.socket?.id,
          transport: this.socket?.io?.engine?.transport?.name
        });
        this.isConnecting = false;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[WebSocket] Disconnected:', reason);
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('[WebSocket] Connection error:', error);
        this.isConnecting = false;
      });

      // Manually connect
      this.socket.connect();
      return this.socket;
    } catch (err) {
      this.isConnecting = false;
      console.error('[WebSocket] Error creating socket:', err);
      throw err;
    }
  }

  public disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting socket');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }
}

export const webSocketService = WebSocketService.getInstance(); 