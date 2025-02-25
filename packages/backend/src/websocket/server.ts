import { WebSocketPair } from '@cloudflare/workers-types';

interface WebSocketMessage {
  type: 'performance' | 'health' | 'ssl';
  domainId: number;
  data: unknown;
}

interface WebSocketServer {
  accept(): void;
  send(data: string): void;
  close(): void;
  addEventListener(type: string, handler: (event: unknown) => void): void;
}

export class WebSocketManager {
  private clients: Map<number, Set<WebSocket>> = new Map();

  handleConnection(
    domainId: number,
    pair: { [key: string]: WebSocketServer }
  ): void {
    const [client, server] = Object.values(pair) as [
      WebSocket,
      WebSocketServer,
    ];

    // Client'ı kaydet
    if (!this.clients.has(domainId)) {
      this.clients.set(domainId, new Set());
    }
    this.clients.get(domainId)?.add(client);

    // Bağlantı olaylarını dinle
    server.accept();

    server.addEventListener('close', () => {
      this.clients.get(domainId)?.delete(client);
      if (this.clients.get(domainId)?.size === 0) {
        this.clients.delete(domainId);
      }
    });

    server.addEventListener('error', (event: unknown) => {
      console.error('WebSocket error:', event);
      server.close();
    });

    // Bağlantı başarılı mesajı gönder
    server.send(
      JSON.stringify({
        type: 'connection',
        status: 'connected',
        timestamp: new Date().toISOString(),
      })
    );
  }

  broadcast(message: WebSocketMessage): void {
    const { domainId } = message;
    const clients = this.clients.get(domainId);

    if (!clients) return;

    const messageStr = JSON.stringify(message);

    for (const client of clients) {
      try {
        client.send(messageStr);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        client.close();
      }
    }
  }

  getConnectedClients(domainId: number): number {
    return this.clients.get(domainId)?.size || 0;
  }

  closeAllConnections(): void {
    for (const [, clients] of this.clients) {
      for (const client of clients) {
        try {
          client.close();
        } catch (error) {
          console.error('Error closing WebSocket connection:', error);
        }
      }
    }
    this.clients.clear();
  }
}

export const webSocketManager = new WebSocketManager();
