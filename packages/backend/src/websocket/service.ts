import { EventData } from '../analytics/types';

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'event' | 'ping' | 'pong';
  room?: string;
  data?: EventData;
  timestamp?: number;
}

export class WebSocketService {
  private rooms: Map<string, Set<WebSocket>> = new Map();
  private pingIntervals: Map<WebSocket, NodeJS.Timeout> = new Map();
  private lastPongTimes: Map<WebSocket, number> = new Map();
  private readonly PING_INTERVAL = 30000; // 30 seconds
  private readonly PONG_TIMEOUT = 10000; // 10 seconds

  private cleanupInactiveConnections(room: string) {
    const clients = this.rooms.get(room);
    if (!clients) return;

    const now = Date.now();
    const activeClients = new Set(
      [...clients].filter((ws) => {
        const lastPong = this.lastPongTimes.get(ws) || 0;
        const isActive =
          ws.readyState === WebSocket.OPEN &&
          now - lastPong < this.PONG_TIMEOUT;
        if (!isActive) {
          this.cleanupClient(ws);
        }
        return isActive;
      })
    );

    if (activeClients.size === 0) {
      this.rooms.delete(room);
    } else {
      this.rooms.set(room, activeClients);
    }
  }

  private cleanupClient(ws: WebSocket) {
    const pingInterval = this.pingIntervals.get(ws);
    if (pingInterval) {
      clearInterval(pingInterval);
      this.pingIntervals.delete(ws);
    }
    this.lastPongTimes.delete(ws);

    // Remove from all rooms
    for (const [room, clients] of this.rooms.entries()) {
      if (clients.has(ws)) {
        clients.delete(ws);
        if (clients.size === 0) {
          this.rooms.delete(room);
        }
      }
    }
  }

  private setupPingPong(ws: WebSocket) {
    this.lastPongTimes.set(ws, Date.now());

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const message: WebSocketMessage = {
          type: 'ping',
          timestamp: Date.now(),
        };
        ws.send(JSON.stringify(message));
      } else {
        this.cleanupClient(ws);
      }
    }, this.PING_INTERVAL);

    this.pingIntervals.set(ws, pingInterval);
  }

  subscribe(ws: WebSocket, room: string) {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)?.add(ws);

    // Setup ping/pong if not already set
    if (!this.pingIntervals.has(ws)) {
      this.setupPingPong(ws);
    }
  }

  unsubscribe(ws: WebSocket, room: string) {
    this.rooms.get(room)?.delete(ws);
    this.cleanupInactiveConnections(room);
  }

  broadcast(room: string, data: EventData) {
    const message: WebSocketMessage = {
      type: 'event',
      data,
      timestamp: Date.now(),
    };

    // Clean up inactive connections before broadcasting
    this.cleanupInactiveConnections(room);

    const clients = this.rooms.get(room);
    if (!clients) return;

    const failedClients = new Set<WebSocket>();

    for (const client of clients) {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        } else {
          failedClients.add(client);
        }
      } catch (error) {
        console.error('Broadcast error:', error);
        failedClients.add(client);
      }
    }

    // Cleanup failed clients
    for (const client of failedClients) {
      this.cleanupClient(client);
    }
  }

  handleConnection = (ws: WebSocket) => {
    console.log('New WebSocket connection established');
    this.setupPingPong(ws);

    ws.addEventListener('message', (event: MessageEvent) => {
      try {
        const data =
          typeof event.data === 'string'
            ? event.data
            : event.data instanceof ArrayBuffer
              ? new TextDecoder().decode(event.data)
              : '';

        const message: WebSocketMessage = JSON.parse(data);
        console.log('Received message:', message);

        switch (message.type) {
          case 'pong':
            this.lastPongTimes.set(ws, Date.now());
            break;

          case 'subscribe':
            if (message.room) {
              this.subscribe(ws, message.room);
              ws.send(
                JSON.stringify({
                  type: 'subscribed',
                  room: message.room,
                  timestamp: Date.now(),
                })
              );
              console.log(`Client subscribed to room: ${message.room}`);
            }
            break;

          case 'unsubscribe':
            if (message.room) {
              this.unsubscribe(ws, message.room);
              ws.send(
                JSON.stringify({
                  type: 'unsubscribed',
                  room: message.room,
                  timestamp: Date.now(),
                })
              );
              console.log(`Client unsubscribed from room: ${message.room}`);
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      this.cleanupClient(ws);
    });

    ws.addEventListener('error', (error: Event) => {
      console.error('WebSocket error:', error);
      this.cleanupClient(ws);
    });
  };
}
