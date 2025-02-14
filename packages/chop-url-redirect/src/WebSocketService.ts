export class WebSocketService {
  private rooms: Map<string, Set<WebSocket>> = new Map();

  broadcast(room: string, data: unknown) {
    console.log('Broadcasting event to room:', room);
    console.log('Event data:', data);

    const clients = this.rooms.get(room);
    if (!clients || clients.size === 0) {
      console.log('No clients in room:', room);
      return;
    }

    const message = JSON.stringify({
      type: 'event',
      data,
    });

    console.log('Broadcasting message:', message);
    console.log('Number of clients:', clients.size);

    const inactiveClients = new Set<WebSocket>();

    for (const client of clients) {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
          console.log('Message sent successfully to client');
        } else {
          console.log('Client not ready, marking for removal');
          inactiveClients.add(client);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        inactiveClients.add(client);
      }
    }

    // Remove inactive clients
    for (const client of inactiveClients) {
      clients.delete(client);
    }

    // Clean up empty room
    if (clients.size === 0) {
      console.log('Room is empty, removing:', room);
      this.rooms.delete(room);
    }
  }

  addToRoom(room: string, client: WebSocket) {
    console.log('Adding client to room:', room);
    if (!this.rooms.has(room)) {
      console.log('Creating new room:', room);
      this.rooms.set(room, new Set());
    }

    const clients = this.rooms.get(room);
    if (clients) {
      clients.add(client);
      console.log(
        'Client added to room:',
        room,
        'Total clients:',
        clients.size
      );
      return true;
    }
    return false;
  }

  removeFromRoom(room: string, client: WebSocket) {
    console.log('Removing client from room:', room);
    const clients = this.rooms.get(room);
    if (clients) {
      clients.delete(client);
      console.log('Client removed from room:', room);

      if (clients.size === 0) {
        console.log('Room is empty, removing:', room);
        this.rooms.delete(room);
      }
      return true;
    }
    return false;
  }

  getRoomSize(room: string): number {
    return this.rooms.get(room)?.size || 0;
  }

  getAllRooms(): string[] {
    return Array.from(this.rooms.keys());
  }
}
