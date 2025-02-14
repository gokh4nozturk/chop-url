import { EventData } from '../analytics/types';

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'event';
  room?: string;
  data?: EventData;
}

export class WebSocketService {
  private rooms: Map<string, Set<WebSocket>> = new Map();

  private cleanupInactiveConnections(room: string) {
    const clients = this.rooms.get(room);
    if (!clients) return;

    const activeClients = new Set(
      [...clients].filter((ws) => ws.readyState === WebSocket.OPEN)
    );

    if (activeClients.size === 0) {
      this.rooms.delete(room);
    } else {
      this.rooms.set(room, activeClients);
    }
  }

  subscribe(ws: WebSocket, room: string) {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)?.add(ws);
  }

  unsubscribe(ws: WebSocket, room: string) {
    this.rooms.get(room)?.delete(ws);
    this.cleanupInactiveConnections(room);
  }

  broadcast(room: string, data: EventData) {
    const message: WebSocketMessage = {
      type: 'event',
      data,
    };

    // Önce temizlik yap
    this.cleanupInactiveConnections(room);

    // Sonra broadcast yap
    for (const client of this.rooms.get(room) || []) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  }

  handleConnection = (ws: WebSocket) => {
    console.log('New WebSocket connection established');

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
          case 'subscribe':
            if (message.room) {
              this.subscribe(ws, message.room);
              ws.send(
                JSON.stringify({
                  type: 'subscribed',
                  room: message.room,
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
      // Tüm odalardan çıkış yap
      for (const [room, clients] of this.rooms.entries()) {
        if (clients.has(ws)) {
          this.unsubscribe(ws, room);
        }
      }
    });

    ws.addEventListener('error', (error: Event) => {
      console.error('WebSocket error:', error);
    });
  };
}
