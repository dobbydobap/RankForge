// Stark monochrome "ACCEPTED" stamp — animates in on mount (CSS .rf-stamp).
export function AcceptedStamp() {
  return (
    <div className="rf-stamp inline-flex items-center gap-2 border-2 border-[var(--c-fg)] text-[var(--c-fg)] px-5 py-2 font-display uppercase tracking-[0.2em] text-xl select-none">
      Accepted
      <span aria-hidden>✓</span>
    </div>
  );
}
