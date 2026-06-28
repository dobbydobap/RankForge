// Editorial shimmer placeholder. Compose a few to mimic the real layout.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`rf-skeleton ${className}`} aria-hidden />;
}

// A labelled loading block used in place of "Loading…" text.
export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy>
      <Skeleton className="h-10 w-1/3" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--c-border)] border border-[var(--c-border)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
