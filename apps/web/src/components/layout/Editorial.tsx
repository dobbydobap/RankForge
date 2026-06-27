import * as React from 'react';

/**
 * Editorial layout primitives shared across all data pages.
 * Brutalist: oversized Archivo titles, mono kicker/index labels, hairline rules.
 */

// Page header: mono eyebrow + oversized display title + optional right-aligned actions, hairline below.
export function PageHeader({
  eyebrow,
  title,
  actions,
  meta,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <header className="border-b border-[var(--c-border)] pb-6 mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <div className="label-mono text-rf-gray mb-3">{eyebrow}</div>}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase text-[var(--c-fg)] break-words">
            {title}
          </h1>
        </div>
        {actions && <div className="shrink-0 flex items-center gap-3">{actions}</div>}
      </div>
      {meta && <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2">{meta}</div>}
    </header>
  );
}

// A mono key/value pair for the header meta row.
export function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="label-mono text-rf-iron">{label}</div>
      <div className="text-sm text-[var(--c-fg)] mt-0.5 tabular-nums">{value}</div>
    </div>
  );
}

// Section divider: index number + uppercase mono label + hairline filling the row.
export function SectionLabel({
  index,
  children,
  className = '',
}: {
  index?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 mb-4 ${className}`}>
      {index && <span className="font-mono text-[10px] text-rf-iron tabular-nums">{index}</span>}
      <span className="label-mono text-[var(--c-fg)] whitespace-nowrap">{children}</span>
      <span className="flex-1 h-px bg-[var(--c-border)]" />
    </div>
  );
}

// Stat tile: tiny mono label over an oversized display number.
export function StatTile({
  label,
  value,
  sub,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`border p-5 ${
        emphasis
          ? 'border-[var(--c-fg)] bg-[var(--c-fg)] text-[var(--c-bg)]'
          : 'border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-fg)]'
      }`}
    >
      <div className={`label-mono ${emphasis ? 'opacity-70' : 'text-rf-gray'}`}>{label}</div>
      <div className="font-display text-3xl lg:text-4xl mt-2 tabular-nums leading-none">{value}</div>
      {sub && <div className={`text-xs mt-2 ${emphasis ? 'opacity-70' : 'text-rf-gray'}`}>{sub}</div>}
    </div>
  );
}
