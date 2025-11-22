import { useEffect, useRef, useState, useCallback } from "react";

// WebSocket URL - adjust based on your backend setup
// In development, use Vite proxy (/ws) which forwards to ws://localhost:8000
// For production with HTTPS: wss://your-domain.com
const WS_BASE_URL = import.meta.env.DEV 
  ? (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host
  : (import.meta.env.VITE_WS_URL || "ws://localhost:8000");

export type WebSocketMessage = {
  type: string;
  data?: any;
  message?: string;
};

export function useWebSocket(
  endpoint: string,
  onMessage?: (message: WebSocketMessage) => void,
  enabled: boolean = true
) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      const token = localStorage.getItem("token");
      // WebSocket doesn't support custom headers in browser, so we use query parameter
      // Backend should accept token in query: ?token=xxx
      // Alternative: Backend could accept token in first message after connection
      const wsUrl = `${WS_BASE_URL}${endpoint}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
      
      console.log("🔌 Connecting to WebSocket:", wsUrl.replace(token || "", "[TOKEN]"));
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("✅ WebSocket connected successfully");
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        
        // If backend requires token in first message instead of query param, uncomment this:
        // if (token) {
        //   ws.send(JSON.stringify({ type: "auth", token }));
        // }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("📨 WebSocket message received:", message);
          if (onMessage) {
            onMessage(message);
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err, event.data);
        }
      };

      ws.onerror = (err) => {
        console.error("❌ WebSocket error:", err);
        setError("WebSocket connection error");
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log("🔌 WebSocket disconnected", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        setIsConnected(false);
        wsRef.current = null;

        // Don't reconnect if it was a clean close or authentication error
        if (event.code === 1000 || event.code === 1008) {
          console.log("WebSocket closed cleanly, not reconnecting");
          return;
        }

        // Attempt to reconnect
        if (enabled && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error("Max reconnection attempts reached");
          setError("Failed to connect to WebSocket after multiple attempts");
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      setError("Failed to connect to WebSocket");
    }
  }, [endpoint, onMessage, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    error,
    sendMessage,
    disconnect,
    connect,
  };
}

