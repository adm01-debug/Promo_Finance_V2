/**
 * WebSocket Service
 * Real-time communication with server
 */

type MessageHandler = (data: unknown) => void;
type ConnectionHandler = () => void;

interface WebSocketOptions {
  url: string;
  protocols?: string | string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

interface PendingMessage {
  type: string;
  payload: unknown;
  timestamp: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private options: Required<WebSocketOptions>;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private disconnectionHandlers: Set<ConnectionHandler> = new Set();
  private reconnectAttempts = 0;
  private isIntentionallyClosed = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pendingMessages: PendingMessage[] = [];
  private isConnected = false;

  constructor(options: WebSocketOptions) {
    this.options = {
      url: options.url,
      protocols: options.protocols ?? [],
      reconnect: options.reconnect ?? true,
      reconnectInterval: options.reconnectInterval ?? 3000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
      heartbeatInterval: options.heartbeatInterval ?? 30000,
      debug: options.debug ?? false,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('Already connected');
      return;
    }

    this.isIntentionallyClosed = false;
    this.log(`Connecting to ${this.options.url}...`);

    try {
      this.ws = new WebSocket(
        this.options.url,
        this.options.protocols as string | string[]
      );

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      this.log('Connection error:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.log('Disconnected');
  }

  /**
   * Send a message
   */
  send<T = unknown>(type: string, payload: T): void {
    const message = JSON.stringify({ type, payload, timestamp: Date.now() });

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
      this.log(`Sent [${type}]:`, payload);
    } else {
      // Queue message for later
      this.pendingMessages.push({ type, payload, timestamp: Date.now() });
      this.log(`Queued [${type}]:`, payload);
    }
  }

  /**
   * Subscribe to a message type
   */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  /**
   * Subscribe to connection event
   */
  onConnect(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  /**
   * Subscribe to disconnection event
   */
  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectionHandlers.add(handler);
    return () => {
      this.disconnectionHandlers.delete(handler);
    };
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection state
   */
  get state(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  // Private methods

  private handleOpen(): void {
    this.log('Connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;

    // Start heartbeat
    this.startHeartbeat();

    // Send pending messages
    this.flushPendingMessages();

    // Notify handlers
    this.connectionHandlers.forEach((handler) => handler());
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const { type, payload } = JSON.parse(event.data);
      this.log(`Received [${type}]:`, payload);

      // Handle heartbeat response
      if (type === 'pong') {
        return;
      }

      // Notify handlers
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(payload);
          } catch (error) {
            console.error(`Handler error for ${type}:`, error);
          }
        });
      }

      // Also notify wildcard handlers
      const wildcardHandlers = this.handlers.get('*');
      if (wildcardHandlers) {
        wildcardHandlers.forEach((handler) => {
          try {
            handler({ type, payload });
          } catch (error) {
            console.error('Wildcard handler error:', error);
          }
        });
      }
    } catch (error) {
      this.log('Failed to parse message:', event.data);
    }
  }

  private handleClose(event: CloseEvent): void {
    this.log(`Disconnected (code: ${event.code}, reason: ${event.reason})`);
    this.isConnected = false;
    this.stopHeartbeat();

    // Notify handlers
    this.disconnectionHandlers.forEach((handler) => handler());

    // Attempt reconnection if not intentionally closed
    if (!this.isIntentionallyClosed && this.options.reconnect) {
      this.scheduleReconnect();
    }
  }

  private handleError(event: Event): void {
    this.log('WebSocket error:', event);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.options.reconnectInterval * this.reconnectAttempts;

    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})...`);

    setTimeout(() => {
      if (!this.isIntentionallyClosed) {
        this.connect();
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private flushPendingMessages(): void {
    if (this.pendingMessages.length === 0) return;

    this.log(`Flushing ${this.pendingMessages.length} pending messages...`);

    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift()!;
      // Only send if message is less than 5 minutes old
      if (Date.now() - message.timestamp < 5 * 60 * 1000) {
        this.send(message.type, message.payload);
      }
    }
  }

  private log(...args: unknown[]): void {
    if (this.options.debug) {
      console.log('[WebSocket]', ...args);
    }
  }
}

// Singleton instance
let wsService: WebSocketService | null = null;

/**
 * Get or create WebSocket service
 */
export function getWebSocketService(options?: WebSocketOptions): WebSocketService {
  if (!wsService && options) {
    wsService = new WebSocketService(options);
  }

  if (!wsService) {
    throw new Error('WebSocket service not initialized. Call with options first.');
  }

  return wsService;
}

/**
 * Create a new WebSocket service
 */
export function createWebSocketService(options: WebSocketOptions): WebSocketService {
  return new WebSocketService(options);
}

// React hook for WebSocket
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseWebSocketOptions extends Omit<WebSocketOptions, 'url'> {
  url: string;
  onMessage?: (type: string, payload: unknown) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<{ type: string; payload: unknown } | null>(null);
  const wsRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    const ws = createWebSocketService({
      url: options.url,
      protocols: options.protocols,
      reconnect: options.reconnect,
      reconnectInterval: options.reconnectInterval,
      maxReconnectAttempts: options.maxReconnectAttempts,
      heartbeatInterval: options.heartbeatInterval,
      debug: options.debug,
    });

    wsRef.current = ws;

    const unsubConnect = ws.onConnect(() => {
      setIsConnected(true);
      options.onConnect?.();
    });

    const unsubDisconnect = ws.onDisconnect(() => {
      setIsConnected(false);
      options.onDisconnect?.();
    });

    const unsubMessage = ws.on('*', (data) => {
      const { type, payload } = data as { type: string; payload: unknown };
      setLastMessage({ type, payload });
      options.onMessage?.(type, payload);
    });

    if (options.autoConnect !== false) {
      ws.connect();
    }

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubMessage();
      ws.disconnect();
    };
  }, [options.url]);

  const connect = useCallback(() => {
    wsRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
  }, []);

  const send = useCallback(<T,>(type: string, payload: T) => {
    wsRef.current?.send(type, payload);
  }, []);

  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    return wsRef.current?.on(type, handler) ?? (() => {});
  }, []);

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
    send,
    subscribe,
  };
}

export default WebSocketService;
