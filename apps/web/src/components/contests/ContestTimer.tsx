'use client';

import { useState, useEffect } from 'react';

interface ContestTimerProps {
  startTime: string;
  endTime: string;
  status: string;
}

export function ContestTimer({ startTime, endTime, status }: ContestTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  if (status === 'ENDED' || status === 'RESULTS_PUBLISHED') {
    return (
      <div className="text-sm text-zinc-500">
        Contest ended
      </div>
    );
  }

  if (now < start) {
    const diff = start - now;
    return (
      <div>
        <div className="text-xs text-zinc-500 mb-1">Starts in</div>
        <div className="text-lg font-mono font-bold text-cyan-400">
          {formatDuration(diff)}
        </div>
      </div>
    );
  }

  if (now < end) {
    const diff = end - now;
    const isLow = diff < 10 * 60 * 1000; // < 10 min
    return (
      <div>
        <div className="text-xs text-zinc-500 mb-1">Time remaining</div>
        <div className={`text-lg font-mono font-bold ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>
          {formatDuration(diff)}
        </div>
      </div>
    );
  }

  return <div className="text-sm text-zinc-500">Contest ended</div>;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
