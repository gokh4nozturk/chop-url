'use client';

import { ErrorBoundary } from '@/components/error-boundary';
import { useAnalyticsStore } from '@/lib/store/analytics';
import { useWebSocketStore } from '@/lib/store/websocket';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Clock, Users, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface RealTimeStatsProps {
  urlId: string;
}

function RealTimeStatsContent({ urlId }: RealTimeStatsProps) {
  const { connect, subscribe, unsubscribe, isConnected } = useWebSocketStore();
  const { urlStats, fetchAnalytics, isLoading } = useAnalyticsStore();
  const hasSubscribed = useRef(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5;

  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    let mounted = true;

    const setupWebSocket = async () => {
      try {
        if (!mounted) return;
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
  }, [urlId, connect, subscribe, unsubscribe, fetchAnalytics]);

  const connectionStatus = useMemo(() => {
    const getStatusColor = () => {
      if (isConnected) return 'bg-green-100 text-green-800';
      if (retryCount >= MAX_RETRIES) return 'bg-red-100 text-red-800';
      return 'bg-yellow-100 text-yellow-800';
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`${isConnected}-${retryCount}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`flex items-center gap-2 px-2 py-1 text-sm rounded ${getStatusColor()}`}
        >
          {isConnected ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Wifi className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, opacity: 0.5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <WifiOff className="w-4 h-4" />
            </motion.div>
          )}
          <motion.span
            className="hidden sm:inline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {isConnected
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
  }, [isConnected, retryCount]);

  return (
    <div className="p-4 bg-background border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Real-time Analytics</h3>
        {connectionStatus}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="text-sm text-muted-foreground">Total Clicks</div>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : urlStats?.totalEvents || 0}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="text-sm text-muted-foreground">Unique Visitors</div>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : urlStats?.uniqueVisitors || 0}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="text-sm text-muted-foreground">Last Click</div>
            <div className="text-2xl font-bold">
              {isLoading
                ? '...'
                : urlStats?.lastEventAt
                  ? new Date(urlStats.lastEventAt).toLocaleTimeString()
                  : 'Never'}
            </div>
          </div>
        </div>
      </div>
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
