'use client';

import { useAnalyticsStore } from '@/lib/store/analytics';
import { useWebSocketStore } from '@/lib/store/websocket';
import { Activity, Clock, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface RealTimeStatsProps {
  urlId: string;
}

export function RealTimeStats({ urlId }: RealTimeStatsProps) {
  const { connect, subscribe, unsubscribe, isConnected } = useWebSocketStore();
  const { urlStats, fetchAnalytics, isLoading } = useAnalyticsStore();
  const hasSubscribed = useRef(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const MAX_RETRIES = 5;

  // Initial setup and WebSocket connection
  useEffect(() => {
    console.log('[RealTimeStats] Component mounted with urlId:', urlId);
    let retryTimeout: NodeJS.Timeout;
    let mounted = true;

    const setupWebSocket = async () => {
      try {
        if (!mounted) return;
        setError(null);
        console.log('[RealTimeStats] Setting up WebSocket connection...');
        await connect();
        console.log('[RealTimeStats] WebSocket connected:', isConnected);

        const room = `url:${urlId}`;
        if (!hasSubscribed.current) {
          console.log('[RealTimeStats] Subscribing to room:', room);
          await subscribe(room);
          hasSubscribed.current = true;
          console.log('[RealTimeStats] Subscribed to room:', room);
        }

        // Reset retry count on successful connection
        setRetryCount(0);

        console.log('[RealTimeStats] Fetching initial analytics...');
        await fetchAnalytics(urlId);
        if (mounted) setLastUpdate(new Date());
      } catch (error) {
        console.error('[RealTimeStats] Error in setup:', error);
        if (!mounted) return;

        setError(error instanceof Error ? error.message : 'Connection failed');

        // Increment retry count and attempt reconnection
        setRetryCount((prev) => {
          const newCount = prev + 1;
          if (newCount < MAX_RETRIES && mounted) {
            console.log(
              `[RealTimeStats] Retry attempt ${newCount}/${MAX_RETRIES} in 3 seconds...`
            );
            retryTimeout = setTimeout(setupWebSocket, 3000);
          } else {
            console.log('[RealTimeStats] Max retries reached');
          }
          return newCount;
        });
      }
    };

    setupWebSocket();

    // Polling as a fallback
    const pollInterval = setInterval(() => {
      if (mounted && (!isConnected || retryCount >= MAX_RETRIES)) {
        console.log('[RealTimeStats] Polling for updates...');
        fetchAnalytics(urlId).catch((error) => {
          console.error('[RealTimeStats] Polling error:', error);
        });
      }
    }, 10000); // Poll every 10 seconds if WebSocket fails

    return () => {
      mounted = false;
      const room = `url:${urlId}`;
      console.log('[RealTimeStats] Cleaning up subscription for room:', room);
      clearTimeout(retryTimeout);
      clearInterval(pollInterval);
      unsubscribe(room);
      hasSubscribed.current = false;
    };
  }, [
    urlId,
    connect,
    subscribe,
    unsubscribe,
    fetchAnalytics,
    isConnected,
    retryCount,
  ]);

  // Update lastUpdate when urlStats changes
  useEffect(() => {
    if (urlStats) {
      console.log('[RealTimeStats] Stats updated:', urlStats);
      setLastUpdate(new Date());
      setError(null); // Clear any previous errors on successful update
    }
  }, [urlStats]);

  // WebSocket bağlantı durumunu göster
  const connectionStatus = isConnected ? (
    <span className="px-2 py-1 text-sm bg-green-100 text-green-800 rounded">
      Connected{' '}
      {lastUpdate && `(Last update: ${lastUpdate.toLocaleTimeString()})`}
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
