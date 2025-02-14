'use client';

import { ErrorBoundary } from '@/components/error-boundary';
import { useAnalyticsStore } from '@/lib/store/analytics';
import { useWebSocketStore } from '@/lib/store/websocket';
import { Activity, Clock, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface RealTimeStatsProps {
  urlId: string;
}

function RealTimeStatsContent({ urlId }: RealTimeStatsProps) {
  const { connect, subscribe, unsubscribe, isConnected } = useWebSocketStore();
  const { urlStats, fetchAnalytics, isLoading } = useAnalyticsStore();
  const hasSubscribed = useRef(false);
  const lastUpdateRef = useRef<Date | null>(null);
  const [lastUpdateDisplay, setLastUpdateDisplay] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const MAX_RETRIES = 5;

  // Update display time every second
  useEffect(() => {
    const updateDisplayTime = () => {
      if (lastUpdateRef.current) {
        setLastUpdateDisplay(lastUpdateRef.current.toLocaleTimeString());
      }
    };

    const timer = setInterval(updateDisplayTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial setup and WebSocket connection
  useEffect(() => {
    console.log('[RealTimeStats] Component mounted with urlId:', urlId);
    let retryTimeout: NodeJS.Timeout;
    let mounted = true;

    const setupWebSocket = async () => {
      try {
        if (!mounted) return;
        setError(null);
        await connect();

        const room = `url:${urlId}`;
        if (!hasSubscribed.current) {
          await subscribe(room);
          hasSubscribed.current = true;
        }

        setRetryCount(0);
        await fetchAnalytics(urlId);
        if (mounted) {
          lastUpdateRef.current = new Date();
          setLastUpdateDisplay(lastUpdateRef.current.toLocaleTimeString());
        }
      } catch (error) {
        if (!mounted) return;
        setError(error instanceof Error ? error.message : 'Connection failed');
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

  // Update lastUpdate when urlStats changes
  useEffect(() => {
    if (urlStats) {
      lastUpdateRef.current = new Date();
      setLastUpdateDisplay(lastUpdateRef.current.toLocaleTimeString());
      setError(null);
    }
  }, [urlStats]);

  // Listen for WebSocket events and update lastUpdate time
  useEffect(() => {
    const unsubscribe = useWebSocketStore.subscribe((state) => {
      if (state.lastPongTime) {
        lastUpdateRef.current = new Date();
        setLastUpdateDisplay(lastUpdateRef.current.toLocaleTimeString());
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Memoize connection status to prevent unnecessary re-renders
  const connectionStatus = useMemo(() => {
    return isConnected ? (
      <span className="px-2 py-1 text-sm bg-green-100 text-green-800 rounded">
        Connected {lastUpdateDisplay && `(Last update: ${lastUpdateDisplay})`}
      </span>
    ) : (
      <span className="px-2 py-1 text-sm bg-red-100 text-red-800 rounded">
        {error ||
          (retryCount >= MAX_RETRIES ? 'Connection Failed' : 'Disconnected')}
        {retryCount > 0 &&
          retryCount < MAX_RETRIES &&
          ` (Retry ${retryCount}/${MAX_RETRIES})`}
      </span>
    );
  }, [isConnected, lastUpdateDisplay, error, retryCount]);

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
