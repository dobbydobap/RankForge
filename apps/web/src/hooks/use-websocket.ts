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
  const roomsRef = useRef(rooms);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);

  // Keep handlers/rooms refs up to date without retriggering the effect
  handlersRef.current = onEvent;
  roomsRef.current = rooms;

  // Callers pass rooms as inline literals (new identity every render), so key
  // the effect on their VALUE — otherwise the socket is torn down and reopened
  // on every render of a live page.
  const roomsKey = JSON.stringify(rooms ?? []);

  const connect = useCallback(() => {
    const state = wsRef.current?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;

    const url = new URL('/ws', WS_URL);
    if (accessToken) {
      url.searchParams.set('token', accessToken);
    }

    const ws = new WebSocket(url.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      attemptsRef.current = 0;

      // Auto-join rooms
      for (const room of roomsRef.current ?? []) {
        ws.send(JSON.stringify(room));
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
      // Reconnect only while this socket is still the active one (the unmount
      // cleanup nulls wsRef, which previously left a zombie reconnect loop
      // running after navigation). Exponential backoff + jitter avoids a
      // synchronized stampede when the server blips.
      if (wsRef.current !== ws) return;
      const delay = Math.min(3000 * 2 ** attemptsRef.current, 30000) + Math.random() * 1000;
      attemptsRef.current += 1;
      reconnectRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [accessToken]);

  useEffect(() => {
    if (!enabled) return;
    connect();

    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      const ws = wsRef.current;
      wsRef.current = null; // signals onclose not to reconnect
      ws?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect, enabled, roomsKey]);

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
  stream?: {
    onStart?: (data: { submissionId: string; total: number }) => void;
    onProgress?: (data: { submissionId: string; index: number; order: number; total: number; verdict: string }) => void;
  },
) {
  return useWebSocket({
    enabled: !!submissionId,
    rooms: submissionId
      ? [{ event: 'submission:subscribe', data: { submissionId } }]
      : [],
    onEvent: {
      'verdict:update': onVerdict,
      'test:start': (d) => stream?.onStart?.(d),
      'test:progress': (d) => stream?.onProgress?.(d),
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
