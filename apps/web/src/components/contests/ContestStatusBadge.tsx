'use client';

// Monochrome: LIVE is the only solid (white) chip; rest are outlined with a glyph.
const STATUS_STYLE: Record<string, { cls: string; glyph: string }> = {
  DRAFT: { cls: 'bg-transparent text-rf-gray border-[var(--c-border-2)]', glyph: '○' },
  PUBLISHED: { cls: 'bg-transparent text-rf-light border-rf-iron', glyph: '◇' },
  REGISTRATION_OPEN: { cls: 'bg-transparent text-rf-light border-rf-iron', glyph: '+' },
  LIVE: { cls: 'bg-[var(--c-fg)] text-[var(--c-bg)] border-[var(--c-fg)] font-semibold', glyph: '●' },
  FROZEN: { cls: 'bg-transparent text-rf-light border-rf-iron', glyph: '❄' },
  ENDED: { cls: 'bg-transparent text-rf-gray border-[var(--c-border-2)]', glyph: '■' },
  RESULTS_PUBLISHED: { cls: 'bg-transparent text-rf-light border-rf-iron', glyph: '★' },
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  REGISTRATION_OPEN: 'Registration Open',
  LIVE: 'Live',
  FROZEN: 'Frozen',
  ENDED: 'Ended',
  RESULTS_PUBLISHED: 'Results',
};

export function ContestStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status] || STATUS_STYLE.DRAFT;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono uppercase tracking-wide border ${style.cls}`}
    >
      <span aria-hidden>{style.glyph}</span>
      {STATUS_LABEL[status] || status}
    </span>
  );
}
