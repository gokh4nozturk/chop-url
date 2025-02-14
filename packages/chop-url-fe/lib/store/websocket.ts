import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useAnalyticsStore } from './analytics';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8788/ws';

interface ExtendedWebSocket extends WebSocket {
  pongTimeout?: NodeJS.Timeout;
}

interface WebSocketState {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  rooms: Set<string>;
  lastPongTime: number | null;
  reconnectAttempts: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: (room: string) => Promise<void>;
  unsubscribe: (room: string) => void;
  handlePong: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;
const PING_INTERVAL = 30000;
const PONG_TIMEOUT = 10000;

export const useWebSocketStore = create<WebSocketState>()(
  devtools(
    (set, get) => ({
      socket: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      rooms: new Set(),
      lastPongTime: null,
      reconnectAttempts: 0,

      connect: async () => {
        try {
          const { socket, isConnected, isConnecting, reconnectAttempts } =
            get();

          if (socket?.readyState === WebSocket.OPEN || isConnecting) {
            return;
          }

          if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            set({
              error: new Error('Max reconnection attempts reached'),
              isConnecting: false,
            });
            return;
          }

          set({ isConnecting: true, error: null });

          return new Promise<void>((resolve, reject) => {
            let connectionTimeout: NodeJS.Timeout | null = null;
            let pingInterval: NodeJS.Timeout | null = null;
            let pongTimeout: NodeJS.Timeout | null = null;

            const cleanup = () => {
              if (connectionTimeout) clearTimeout(connectionTimeout);
              if (pingInterval) clearInterval(pingInterval);
              if (pongTimeout) clearTimeout(pongTimeout);
              connectionTimeout = null;
              pingInterval = null;
              pongTimeout = null;
            };

            const ws = new WebSocket(WS_URL);

            const setupPingPong = () => {
              cleanup();

              pingInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  const now = new Date().toLocaleTimeString();
                  console.log(`[WebSocket][${now}] Sending ping`);
                  ws.send(
                    JSON.stringify({ type: 'ping', timestamp: Date.now() })
                  );

                  pongTimeout = setTimeout(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                      const timeoutTime = new Date().toLocaleTimeString();
                      const { reconnectAttempts } = get();

                      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                        console.log(
                          `[WebSocket][${timeoutTime}] Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached, giving up...`
                        );
                        cleanup();
                        ws.close();
                        set({
                          error: new Error('Max reconnection attempts reached'),
                          isConnected: false,
                          socket: null,
                          isConnecting: false,
                        });
                        return;
                      }

                      console.log(
                        `[WebSocket][${timeoutTime}] Pong timeout - attempting reconnection (${
                          reconnectAttempts + 1
                        }/${MAX_RECONNECT_ATTEMPTS})...`
                      );
                      cleanup();
                      ws.close();
                      set((state) => ({
                        error: new Error('Pong timeout'),
                        isConnected: false,
                        socket: null,
                        isConnecting: false,
                        reconnectAttempts: state.reconnectAttempts + 1,
                      }));

                      // Immediate reconnection attempt
                      const currentAttempts = get().reconnectAttempts;
                      if (currentAttempts < MAX_RECONNECT_ATTEMPTS) {
                        setTimeout(() => {
                          console.log(
                            '[WebSocket] Initiating reconnection after pong timeout...'
                          );
                          get().connect();
                        }, 1000); // Daha kısa bir bekleme süresi
                      }
                    }
                  }, PONG_TIMEOUT);
                }
              }, PING_INTERVAL);
            };

            connectionTimeout = setTimeout(() => {
              cleanup();
              ws.close();
              reject(new Error('Connection timeout'));
            }, 10000);

            ws.onopen = () => {
              cleanup();
              set({
                socket: ws,
                isConnected: true,
                isConnecting: false,
                error: null,
                reconnectAttempts: 0,
                lastPongTime: Date.now(),
              });
              setupPingPong();
              resolve();

              // Resubscribe to rooms
              const { rooms } = get();
              for (const room of rooms) {
                ws.send(JSON.stringify({ type: 'subscribe', room }));
              }
            };

            ws.onclose = () => {
              cleanup();
              const currentState = get();

              // Only increment attempts if we're not manually disconnecting
              if (currentState.isConnected) {
                set((state) => ({
                  socket: null,
                  isConnected: false,
                  isConnecting: false,
                  reconnectAttempts: state.reconnectAttempts + 1,
                }));

                // Attempt to reconnect
                setTimeout(() => {
                  const { reconnectAttempts } = get();
                  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    console.log(
                      `[WebSocket] Attempting to reconnect (${
                        reconnectAttempts + 1
                      }/${MAX_RECONNECT_ATTEMPTS})...`
                    );
                    get().connect();
                  }
                }, RECONNECT_DELAY);
              }

              reject(new Error('WebSocket connection closed'));
            };

            ws.onerror = (error) => {
              console.error('WebSocket error:', error);
              cleanup();
              set((state) => ({
                error:
                  error instanceof Error ? error : new Error('WebSocket error'),
                isConnecting: false,
                reconnectAttempts: state.reconnectAttempts + 1,
              }));
              reject(error);
            };

            ws.onmessage = async (event) => {
              try {
                const data = JSON.parse(event.data);
                const now = new Date().toLocaleTimeString();

                // Update lastPongTime for any valid message
                set({ lastPongTime: Date.now() });

                switch (data.type) {
                  case 'ping':
                  case 'pong':
                    console.log(`[WebSocket][${now}] Received ${data.type}`);
                    if (data.type === 'pong') {
                      get().handlePong();
                    }
                    break;

                  case 'event':
                    console.log(`[WebSocket][${now}] Received event:`, data);
                    if (data.data?.urlId) {
                      console.log(
                        `[WebSocket][${now}] Updating analytics for urlId:`,
                        data.data.urlId
                      );
                      const analytics = useAnalyticsStore.getState();
                      await analytics.fetchAnalytics(
                        data.data.urlId.toString()
                      );
                    }
                    break;

                  case 'subscribed':
                  case 'unsubscribed':
                    console.log(
                      `[WebSocket][${now}] ${data.type} to room:`,
                      data.room
                    );
                    set({ lastPongTime: Date.now() });
                    break;

                  default:
                    console.log(
                      `[WebSocket][${now}] Unknown message type:`,
                      data
                    );
                }
              } catch (error) {
                console.error(
                  `[WebSocket][${new Date().toLocaleTimeString()}] Error processing message:`,
                  error
                );
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
            lastPongTime: null,
            reconnectAttempts: 0,
          });
        }
      },

      subscribe: async (room: string) => {
        const { socket, rooms, connect } = get();

        if (!socket || socket.readyState !== WebSocket.OPEN) {
          await connect();
        }

        const currentSocket = get().socket;
        if (!currentSocket) {
          throw new Error('WebSocket not connected');
        }

        if (rooms.has(room)) {
          console.log('[WebSocket] Already subscribed to room:', room);
          return;
        }

        console.log('[WebSocket] Subscribing to room:', room);
        currentSocket.send(JSON.stringify({ type: 'subscribe', room }));
        rooms.add(room);
        set({ rooms: new Set(rooms) });
      },

      unsubscribe: (room: string) => {
        const { socket, rooms } = get();
        if (!socket) {
          console.log('[WebSocket] No active connection to unsubscribe');
          return;
        }

        if (!rooms.has(room)) {
          console.log('[WebSocket] Not subscribed to room:', room);
          return;
        }

        console.log('[WebSocket] Unsubscribing from room:', room);
        socket.send(JSON.stringify({ type: 'unsubscribe', room }));
        rooms.delete(room);
        set({ rooms: new Set(rooms) });
      },

      handlePong: () => {
        const currentTime = Date.now();
        set({ lastPongTime: currentTime });

        const { socket } = get();
        if (socket?.readyState === WebSocket.OPEN) {
          // Clear any existing pong timeout
          const extendedSocket = socket as ExtendedWebSocket;
          if (extendedSocket.pongTimeout) {
            clearTimeout(extendedSocket.pongTimeout);
            extendedSocket.pongTimeout = undefined;
          }
        }
      },
    }),
    { name: 'websocket-store' }
  )
);
