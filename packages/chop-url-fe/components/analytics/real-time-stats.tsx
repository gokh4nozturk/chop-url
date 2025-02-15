'use client';

import { ErrorBoundary } from '@/components/error-boundary';
import { useAnalyticsStore } from '@/lib/store/analytics';
import type { WebSocketState } from '@/lib/store/websocket';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Clock, Loader2, Users, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const MAX_RETRIES = 5;

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
  }, []);

  useEffect(() => {
    if (!isMounted || !wsStore) return;

    // Check online status on mount and set up listeners
    setIsOffline(!window.navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isMounted, wsStore]);

  useEffect(() => {
    if (!isMounted || !wsStore) return;

    const { connect, subscribe, unsubscribe } = wsStore;
    let retryTimeout: NodeJS.Timeout;
    let mounted = true;

    const setupWebSocket = async () => {
      try {
        if (!mounted || isOffline) return;
        await connect();

        const room = `url:${urlId}`;
        if (!hasSubscribed.current) {
          await subscribe(room);
          hasSubscribed.current = true;
        }

        setRetryCount(0);
        await fetchAnalytics(urlId);
      } catch (error) {
        if (!mounted) return;
        setRetryCount((prev) => {
          const newCount = prev + 1;
          if (newCount < MAX_RETRIES && mounted) {
            retryTimeout = setTimeout(setupWebSocket, 3000);
          }
          return newCount;
        });
      }
    };

    setupWebSocket();

    return () => {
      mounted = false;
      const room = `url:${urlId}`;
      clearTimeout(retryTimeout);
      unsubscribe(room);
      hasSubscribed.current = false;
    };
  }, [isMounted, wsStore, urlId, fetchAnalytics, isOffline]);

  // Don't render anything on server-side
  if (!isMounted || !wsStore) {
    return (
      <div className="p-4 bg-background border rounded-lg">Loading...</div>
    );
  }

  const connectionStatus = useMemo(() => {
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
  }, [wsStore.isConnected, retryCount]);

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
