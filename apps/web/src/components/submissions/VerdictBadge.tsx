'use client';

import { VERDICT_DISPLAY, VERDICT_SHORT } from '@rankforge/shared';

interface VerdictBadgeProps {
  verdict: string;
  short?: boolean;
}

const VERDICT_COLORS: Record<string, string> = {
  ACCEPTED: 'bg-emerald-900/50 text-emerald-400 border-emerald-800',
  WRONG_ANSWER: 'bg-red-900/50 text-red-400 border-red-800',
  TIME_LIMIT_EXCEEDED: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
  MEMORY_LIMIT_EXCEEDED: 'bg-orange-900/50 text-orange-400 border-orange-800',
  RUNTIME_ERROR: 'bg-purple-900/50 text-purple-400 border-purple-800',
  COMPILATION_ERROR: 'bg-pink-900/50 text-pink-400 border-pink-800',
  PENDING: 'bg-zinc-800/50 text-zinc-400 border-zinc-700',
  JUDGING: 'bg-blue-900/50 text-blue-400 border-blue-800',
};

export function VerdictBadge({ verdict, short }: VerdictBadgeProps) {
  const color = VERDICT_COLORS[verdict] || VERDICT_COLORS.PENDING;
  const label = short
    ? (VERDICT_SHORT as any)[verdict] || verdict
    : (VERDICT_DISPLAY as any)[verdict] || verdict;

  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded border ${color}`}>
      {label}
    </span>
  );
}
