import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useAnalyticsStore } from './analytics';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8788/ws';

interface WebSocketState {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  rooms: Set<string>;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: (room: string) => Promise<void>;
  unsubscribe: (room: string) => void;
}

export const useWebSocketStore = create<WebSocketState>()(
  devtools(
    (set, get) => ({
      socket: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      rooms: new Set(),

      connect: async () => {
        try {
          const { socket, isConnected, isConnecting } = get();

          if (socket || isConnected || isConnecting) {
            console.log('[WebSocket] Already connected or connecting');
            return;
          }

          set({ isConnecting: true, error: null });
          console.log('[WebSocket] Connecting to:', WS_URL);

          const ws = new WebSocket(WS_URL);
          let connectionTimeout: NodeJS.Timeout;

          return new Promise<void>((resolve, reject) => {
            connectionTimeout = setTimeout(() => {
              console.log('[WebSocket] Connection timeout');
              ws.close();
              reject(new Error('Connection timeout'));
            }, 5000);

            ws.onopen = () => {
              console.log('[WebSocket] Connected successfully');
              clearTimeout(connectionTimeout);
              set({ socket: ws, isConnected: true, isConnecting: false });
              resolve();
            };

            ws.onclose = () => {
              console.log('[WebSocket] Connection closed');
              clearTimeout(connectionTimeout);
              set({
                socket: null,
                isConnected: false,
                isConnecting: false,
                rooms: new Set(),
              });
            };

            ws.onerror = (event) => {
              console.error('[WebSocket] Error:', event);
              clearTimeout(connectionTimeout);
              set({
                error: new Error('WebSocket connection failed'),
                isConnecting: false,
              });
              reject(new Error('WebSocket connection failed'));
            };

            ws.onmessage = async (event) => {
              try {
                const data = JSON.parse(event.data);
                console.log('[WebSocket] Received message:', data);

                if (data.type === 'event' && data.urlId) {
                  console.log(
                    '[WebSocket] Updating analytics for urlId:',
                    data.urlId
                  );
                  const analytics = useAnalyticsStore.getState();
                  await analytics.fetchAnalytics(data.urlId.toString());
                }
              } catch (error) {
                console.error('[WebSocket] Error processing message:', error);
              }
            };
          });
        } catch (error) {
          console.error('[WebSocket] Connection error:', error);
          set({
            error: error instanceof Error ? error : new Error('Unknown error'),
            isConnecting: false,
          });
          throw error;
        }
      },

      disconnect: () => {
        const { socket } = get();
        if (socket) {
          console.log('[WebSocket] Disconnecting...');
          socket.close();
          set({
            socket: null,
            isConnected: false,
            rooms: new Set(),
          });
        }
      },

      subscribe: async (room: string) => {
        const { socket, rooms } = get();
        if (!socket) {
          throw new Error('WebSocket not connected');
        }

        if (rooms.has(room)) {
          console.log('[WebSocket] Already subscribed to room:', room);
          return;
        }

        console.log('[WebSocket] Subscribing to room:', room);
        socket.send(JSON.stringify({ type: 'subscribe', room }));
        rooms.add(room);
        set({ rooms: new Set(rooms) });
      },

      unsubscribe: (room: string) => {
        const { socket, rooms } = get();
        if (!socket) return;

        console.log('[WebSocket] Unsubscribing from room:', room);
        socket.send(JSON.stringify({ type: 'unsubscribe', room }));
        rooms.delete(room);
        set({ rooms: new Set(rooms) });
      },
    }),
    { name: 'websocket-store' }
  )
);
