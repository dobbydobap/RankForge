'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

type EventHandler = (data: any) => void;

interface UseWebSocketOptions {
  /** Rooms to auto-join on connect */
  rooms?: { event: string; data: Record<string, string> }[];
  /** Event handlers */
  onEvent?: Record<string, EventHandler>;
  /** Auto-connect (default true) */
  enabled?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { rooms, onEvent, enabled = true } = options;
  const accessToken = useAuthStore((s) => s.accessToken);
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(onEvent);
  const [isConnected, setIsConnected] = useState(false);

  // Keep handlers ref up to date
  handlersRef.current = onEvent;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = new URL('/ws', WS_URL);
    if (accessToken) {
      url.searchParams.set('token', accessToken);
    }

    const ws = new WebSocket(url.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);

      // Auto-join rooms
      if (rooms) {
        for (const room of rooms) {
          ws.send(JSON.stringify(room));
        }
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const handler = handlersRef.current?.[msg.event];
        if (handler) {
          handler(msg.data);
        }
      } catch {
        // ignore invalid messages
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Auto-reconnect after 3s
      setTimeout(() => {
        if (enabled) connect();
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [accessToken, rooms, enabled]);

  useEffect(() => {
    if (!enabled) return;
    connect();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect, enabled]);

  const send = useCallback((event: string, data: Record<string, string>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, ...data }));
    }
  }, []);

  return { isConnected, send };
}

/** Hook for live verdict updates on a specific submission */
export function useVerdictUpdates(
  submissionId: string | null,
  onVerdict: (data: { submissionId: string; verdict: string; timeUsed: number | null; memoryUsed: number | null }) => void,
) {
  return useWebSocket({
    enabled: !!submissionId,
    rooms: submissionId
      ? [{ event: 'submission:subscribe', data: { submissionId } }]
      : [],
    onEvent: {
      'verdict:update': onVerdict,
    },
  });
}

/** Hook for live contest updates (leaderboard changes, announcements) */
export function useContestUpdates(
  contestId: string | null,
  handlers: {
    onLeaderboardUpdate?: () => void;
    onAnnouncement?: (data: any) => void;
    onTimerSync?: (data: any) => void;
    onFreeze?: () => void;
  },
) {
  return useWebSocket({
    enabled: !!contestId,
    rooms: contestId
      ? [{ event: 'contest:join', data: { contestId } }]
      : [],
    onEvent: {
      'leaderboard:update': () => handlers.onLeaderboardUpdate?.(),
      'contest:announcement': (data) => handlers.onAnnouncement?.(data),
      'contest:timer': (data) => handlers.onTimerSync?.(data),
      'contest:freeze': () => handlers.onFreeze?.(),
    },
  });
}
