// Editorial empty state — big ∅ mark, display title, optional hint + action.
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-[var(--c-border-2)] py-16 px-6 text-center">
      <div className="font-display text-6xl text-[var(--c-border-2)] select-none leading-none">∅</div>
      <div className="font-display uppercase text-xl text-[var(--c-fg)] mt-5 tracking-tight">{title}</div>
      {hint && <div className="label-mono text-rf-gray mt-2">{hint}</div>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
