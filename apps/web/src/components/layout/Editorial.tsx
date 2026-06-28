import * as React from 'react';
import { CountUp } from './CountUp';

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
    <header className="border-b border-[var(--c-border-2)] pb-6 mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <div className="rf-enter label-mono text-rf-gray mb-3" style={{ animationDelay: '40ms' }}>
              {eyebrow}
            </div>
          )}
          <h1
            className="rf-enter font-display text-4xl sm:text-5xl lg:text-6xl uppercase text-[var(--c-fg)] break-words"
            style={{ animationDelay: '110ms' }}
          >
            {title}
          </h1>
        </div>
        {actions && (
          <div className="rf-enter shrink-0 flex items-center gap-3" style={{ animationDelay: '200ms' }}>
            {actions}
          </div>
        )}
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
      <span className="flex-1 h-px bg-[var(--c-border-2)]" />
    </div>
  );
}

// Stat tile: tiny mono label over an oversized display number that counts up on view.
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
  // Animate leading-integer values ("1240", "9d", "95+"); pass others through.
  const raw = typeof value === 'number' || typeof value === 'string' ? String(value) : null;
  const m = raw ? raw.match(/^(\d[\d,]*)(.*)$/) : null;
  const display = m ? (
    <CountUp value={parseInt(m[1].replace(/,/g, ''), 10)} suffix={m[2]} />
  ) : (
    value
  );

  return (
    <div
      className={`group p-5 transition-all duration-300 ${
        emphasis
          ? 'bg-[var(--c-fg)] text-[var(--c-bg)]'
          : 'bg-[var(--c-surface)] text-[var(--c-fg)] hover:bg-[var(--c-surface-2)]'
      }`}
    >
      <div className={`label-mono ${emphasis ? 'opacity-70' : 'text-rf-gray'}`}>{label}</div>
      <div className="font-display text-3xl lg:text-4xl mt-2 tabular-nums leading-none transition-transform duration-300 group-hover:translate-x-0.5">
        {display}
      </div>
      {sub && <div className={`text-xs mt-2 ${emphasis ? 'opacity-70' : 'text-rf-gray'}`}>{sub}</div>}
    </div>
  );
}
