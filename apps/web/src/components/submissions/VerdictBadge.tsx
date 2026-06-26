'use client';

import { VERDICT_DISPLAY, VERDICT_SHORT } from '@rankforge/shared';

interface VerdictBadgeProps {
  verdict: string;
  short?: boolean;
}

// Monochrome: meaning carried by fill + glyph, not color.
// Accepted = solid white chip (stands out). Failures = outlined. Pending = dim/pulse.
const VERDICT_STYLE: Record<string, { cls: string; glyph: string }> = {
  ACCEPTED: { cls: 'bg-[var(--c-fg)] text-[var(--c-bg)] border-[var(--c-fg)] font-semibold', glyph: '✓' },
  WRONG_ANSWER: { cls: 'bg-transparent text-rf-light border-rf-iron', glyph: '✕' },
  TIME_LIMIT_EXCEEDED: { cls: 'bg-transparent text-rf-light border-rf-iron', glyph: '◔' },
  MEMORY_LIMIT_EXCEEDED: { cls: 'bg-transparent text-rf-light border-rf-iron', glyph: '▤' },
  RUNTIME_ERROR: { cls: 'bg-transparent text-rf-light border-rf-iron', glyph: '!' },
  COMPILATION_ERROR: { cls: 'bg-transparent text-rf-light border-rf-iron', glyph: '⚠' },
  PENDING: { cls: 'bg-transparent text-rf-gray border-[var(--c-border-2)] animate-pulse', glyph: '◌' },
  JUDGING: { cls: 'bg-transparent text-rf-gray border-[var(--c-border-2)] animate-pulse', glyph: '◌' },
};

export function VerdictBadge({ verdict, short }: VerdictBadgeProps) {
  const style = VERDICT_STYLE[verdict] || VERDICT_STYLE.PENDING;
  const label = short
    ? (VERDICT_SHORT as any)[verdict] || verdict
    : (VERDICT_DISPLAY as any)[verdict] || verdict;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono uppercase tracking-wide border ${style.cls}`}
    >
      <span aria-hidden>{style.glyph}</span>
      {label}
    </span>
  );
}
