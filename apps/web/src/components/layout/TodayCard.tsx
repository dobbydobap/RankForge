'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Streak keeper with a live countdown to midnight.
export function TodayCard({ streak }: { streak: number }) {
  const [left, setLeft] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      const ms = end.getTime() - now.getTime();
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      setLeft(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border border-[var(--c-border-2)] bg-[var(--c-surface)] p-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="label-mono text-rf-gray">Today</div>
        <div className="font-display text-2xl lg:text-3xl text-[var(--c-fg)] mt-1 leading-none">
          {streak}-day streak
        </div>
        <div className="label-mono text-rf-iron mt-2 tabular-nums">{left} left to keep it</div>
      </div>
      <Link
        href="/problems"
        className="group shrink-0 inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-wide font-medium bg-[var(--c-fg)] text-[var(--c-bg)] hover:opacity-80 transition-opacity"
      >
        Solve <span className="transition-transform group-hover:translate-x-1">→</span>
      </Link>
    </div>
  );
}
