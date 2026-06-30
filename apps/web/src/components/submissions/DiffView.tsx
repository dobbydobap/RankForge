// Side-by-side expected vs actual with mismatched lines highlighted (monochrome).
export function DiffView({ expected, actual }: { expected: string; actual: string }) {
  const e = (expected ?? '').replace(/\s+$/, '').split('\n');
  const a = (actual ?? '').replace(/\s+$/, '').split('\n');
  const rows = Math.max(e.length, a.length);
  const lines = Array.from({ length: rows }, (_, i) => ({
    e: e[i] ?? '',
    a: a[i] ?? '',
    diff: (e[i] ?? '') !== (a[i] ?? ''),
  }));

  const Col = ({ title, pick }: { title: string; pick: 'e' | 'a' }) => (
    <div className="bg-[var(--c-bg)] min-w-0">
      <div className="label-mono text-rf-gray px-3 py-1.5 border-b border-[var(--c-border-2)]">{title}</div>
      <div className="max-h-44 overflow-auto">
        {lines.map((ln, i) => (
          <div
            key={i}
            className={`px-3 py-0.5 flex gap-2 whitespace-pre ${
              ln.diff ? 'bg-[var(--c-surface-2)] text-[var(--c-fg)]' : 'text-rf-gray'
            }`}
          >
            <span className="text-rf-iron select-none tabular-nums">{String(i + 1).padStart(2, ' ')}</span>
            <span className="flex-1">{(ln[pick] || ' ')}</span>
            {ln.diff && <span className="text-rf-iron select-none">▸</span>}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-px bg-[var(--c-border-2)] border border-[var(--c-border-2)] text-xs font-mono">
      <Col title="Expected" pick="e" />
      <Col title="Your Output" pick="a" />
    </div>
  );
}
