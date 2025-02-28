'use client';

import { ErrorBoundary } from '@/components/error-boundary';
import { useAnalyticsStore } from '@/lib/store/analytics';
import type { WebSocketState } from '@/lib/store/websocket';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Clock, Loader2, Users, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StatGroup } from './stat-group';

interface RealTimeStatsProps {
  urlId: string;
}

function RealTimeStatsContent({ urlId }: RealTimeStatsProps) {
  const { urlStats, fetchAnalytics, isLoading } = useAnalyticsStore();
  const currentUrlStats = urlStats?.[urlId];
  const hasSubscribed = useRef(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [wsStore, setWsStore] = useState<WebSocketState | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const MAX_RETRIES = 5;
  const INITIAL_RETRY_DELAY = 1000;
  const MAX_RETRY_DELAY = 10000;

  const getRetryDelay = useCallback((attempt: number) => {
    // Exponential backoff with jitter
    const delay = Math.min(INITIAL_RETRY_DELAY * 2 ** attempt, MAX_RETRY_DELAY);
    // Add random jitter ±20%
    return delay * (0.8 + Math.random() * 0.4);
  }, []);

  const connectionStatus = useMemo(() => {
    if (!wsStore) return null;

    const getStatusColor = () => {
      if (wsStore.isConnected) return 'bg-green-100 text-green-800';
      if (retryCount >= MAX_RETRIES) return 'bg-red-100 text-red-800';
      return 'bg-yellow-100 text-yellow-800';
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`${wsStore.isConnected}-${retryCount}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`flex items-center gap-2 px-2 py-1 text-sm rounded ${getStatusColor()}`}
        >
          {wsStore.isConnected ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Wifi className="w-4 h-4" />
            </motion.div>
          ) : retryCount >= MAX_RETRIES ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, opacity: 0.5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <WifiOff className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, opacity: 0.5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Loader2 className="w-4 h-4 animate-spin" />
            </motion.div>
          )}
          <motion.span
            className="hidden sm:inline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {wsStore.isConnected
              ? 'Connected'
              : retryCount >= MAX_RETRIES
                ? 'Connection Failed'
                : `Reconnecting${
                    retryCount > 0 ? ` (${retryCount}/${MAX_RETRIES})` : ''
                  }`}
          </motion.span>
        </motion.div>
      </AnimatePresence>
    );
  }, [wsStore, retryCount]);

  // Initialize WebSocket store after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initWsStore = async () => {
      try {
        const { useWebSocketStore } = await import('@/lib/store/websocket');
        const store = useWebSocketStore.getState();
        setWsStore(store);
        setIsMounted(true);
      } catch (error) {
        console.error('Failed to initialize WebSocket store:', error);
      }
    };

    initWsStore();

    return () => {
      // Cleanup any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMounted || !wsStore) return;

    // Check online status on mount and set up listeners
    const updateOnlineStatus = () => {
      const isOnline = window.navigator.onLine;
      setIsOffline(!isOnline);

      if (isOnline && retryCount > 0) {
        // Try to reconnect immediately when we come back online
        setupWebSocket();
      }
    };

    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [isMounted, wsStore, retryCount]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const setupWebSocket = useCallback(async () => {
    if (!wsStore || !isMounted || isOffline) return;

    try {
      const { connect, subscribe } = wsStore;
      await connect();

      const room = `url:${urlId}`;
      if (!hasSubscribed.current) {
        await subscribe(room);
        hasSubscribed.current = true;
      }

      setRetryCount(0);
      await fetchAnalytics(urlId);

      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
    } catch (error) {
      console.warn('WebSocket connection failed:', error);

      setRetryCount((prev) => {
        const newCount = prev + 1;

        if (newCount < MAX_RETRIES) {
          const delay = getRetryDelay(newCount);
          console.log(
            `Attempting reconnection ${newCount}/${MAX_RETRIES} in ${Math.round(
              delay
            )}ms`
          );

          // Clear any existing timeout before setting a new one
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            setupWebSocket();
          }, delay);
        }

        return newCount;
      });
    }
  }, [wsStore, isMounted, isOffline, urlId, fetchAnalytics, getRetryDelay]);

  useEffect(() => {
    if (!isMounted || !wsStore) return;

    let mounted = true;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        setupWebSocket();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    setupWebSocket();

    return () => {
      mounted = false;
      const room = `url:${urlId}`;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }

      if (wsStore) {
        wsStore.unsubscribe(room);
      }

      hasSubscribed.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMounted, wsStore, urlId, setupWebSocket]);

  // Don't render anything on server-side
  if (!isMounted || !wsStore) {
    return (
      <div className="p-4 bg-background border rounded-lg">Loading...</div>
    );
  }

  const stats = [
    {
      title: 'Total Clicks',
      value: isLoading
        ? '...'
        : currentUrlStats?.totalEvents?.toString() || '0',
      icon: Activity,
    },
    {
      title: 'Unique Visitors',
      value: isLoading
        ? '...'
        : currentUrlStats?.uniqueVisitors?.toString() || '0',
      icon: Users,
    },
    {
      title: 'Last Click',
      value: isLoading
        ? '...'
        : currentUrlStats?.lastEventAt
          ? new Date(currentUrlStats.lastEventAt).toLocaleTimeString()
          : 'Never',
      icon: Clock,
    },
  ];

  return (
    <div className="p-4 bg-background border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Real-time Analytics</h3>
        {connectionStatus}
      </div>

      <StatGroup stats={stats} loading={isLoading} className="!grid-cols-3" />
    </div>
  );
}

export function RealTimeStats(props: RealTimeStatsProps) {
  return (
    <ErrorBoundary>
      <RealTimeStatsContent {...props} />
    </ErrorBoundary>
  );
}
