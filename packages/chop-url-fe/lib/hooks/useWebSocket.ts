import { useCallback, useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  data: unknown;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (event: Event) => void;
  onClose?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(
  domainId: number,
  options: UseWebSocketOptions = {}
) {
  const {
    onMessage,
    onError,
    onClose,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const connect = useCallback(() => {
    if (!domainId) return;

    try {
      setIsConnecting(true);
      setError(null);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(
        `${protocol}//${window.location.host}/api/ws/${domainId}`
      );

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          onMessage?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (event) => {
        setError('WebSocket connection error');
        onError?.(event);
      };

      ws.onclose = () => {
        setIsConnected(false);
        onClose?.();

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(
            () => {
              reconnectAttemptsRef.current += 1;
              connect();
            },
            reconnectInterval * 2 ** reconnectAttemptsRef.current
          );
        } else {
          setError('Maximum reconnection attempts exceeded');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      setIsConnecting(false);
      setError('Failed to establish WebSocket connection');
      console.error('WebSocket connection error:', error);
    }
  }, [
    domainId,
    maxReconnectAttempts,
    onClose,
    onError,
    onMessage,
    reconnectInterval,
  ]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  useEffect(() => {
    if (domainId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [connect, disconnect, domainId]);

  return {
    isConnected,
    isConnecting,
    error,
    disconnect,
    reconnect: connect,
  };
}

// Performans metriklerini yönetmek için özel hook
export function usePerformanceMetrics(domainId: number) {
  const [metrics, setMetrics] = useState<{
    responseTime: number;
    uptime: number;
    lastMinute: {
      requests: number;
      errors: number;
      avgResponseTime: number;
    };
    lastHour: {
      uptime: number;
      downtime: number;
      incidents: number;
    };
  } | null>(null);

  const handleMessage = (message: WebSocketMessage) => {
    if (message.type === 'performance' && message.data) {
      setMetrics(message.data as typeof metrics);
    }
  };

  const { isConnected, isConnecting, error } = useWebSocket(domainId, {
    onMessage: handleMessage,
  });

  return {
    metrics,
    isConnected,
    isConnecting,
    error,
  };
}

// SSL durumunu izlemek için özel hook
export function useSslStatus(domainId: number) {
  const [sslStatus, setSslStatus] = useState<{
    status: string;
    validFrom?: string;
    validTo?: string;
    issuer?: string;
    autoRenewal: boolean;
    daysUntilExpiry?: number;
  } | null>(null);

  const handleMessage = (message: WebSocketMessage) => {
    if (message.type === 'ssl' && message.data) {
      setSslStatus(message.data as typeof sslStatus);
    }
  };

  const { isConnected, isConnecting, error } = useWebSocket(domainId, {
    onMessage: handleMessage,
  });

  return {
    sslStatus,
    isConnected,
    isConnecting,
    error,
  };
}

// Domain sağlık durumunu izlemek için özel hook
export function useDomainHealth(domainId: number) {
  const [healthData, setHealthData] = useState<{
    status: 'healthy' | 'issues' | 'critical';
    dnsStatus: 'ok' | 'issues' | 'unreachable';
    sslStatus: string;
    lastChecked: string;
    issues: Array<{
      type: string;
      severity: 'warning' | 'error';
      message: string;
      recommendation?: string;
    }>;
  } | null>(null);

  const handleMessage = (message: WebSocketMessage) => {
    if (message.type === 'health' && message.data) {
      setHealthData(message.data as typeof healthData);
    }
  };

  const { isConnected, isConnecting, error } = useWebSocket(domainId, {
    onMessage: handleMessage,
  });

  return {
    healthData,
    isConnected,
    isConnecting,
    error,
  };
}
