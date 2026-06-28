import { rankTier } from '@/lib/rank';

// Tier label + progress bar to the next tier (e.g. Newbie → Pupil).
export function RankChip({ rating }: { rating: number }) {
  const { tier, next, progress } = rankTier(rating);
  return (
    <div className="border border-[var(--c-border-2)] bg-[var(--c-surface)] p-5">
      <div className="flex items-center justify-between">
        <span className="label-mono text-rf-gray">Tier</span>
        <span className="font-mono text-[10px] text-rf-iron tabular-nums">{rating}</span>
      </div>
      <div className="font-display uppercase text-2xl lg:text-3xl mt-1 text-[var(--c-fg)] leading-none">
        {tier.name}
      </div>
      <div className="mt-4 h-1 bg-[var(--c-surface-3)]">
        <div
          className="h-full bg-[var(--c-fg)]"
          style={{ width: `${progress * 100}%`, transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)' }}
        />
      </div>
      <div className="label-mono text-rf-iron mt-2">
        {next ? `${next.min - rating} to ${next.name}` : 'Max tier'}
      </div>
    </div>
  );
}
