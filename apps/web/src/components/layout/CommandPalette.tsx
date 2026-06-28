'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type Item = { label: string; sub: string; href: string };

const ROUTES: Item[] = [
  { label: 'Dashboard', sub: 'Page', href: '/dashboard' },
  { label: 'Problems', sub: 'Page', href: '/problems' },
  { label: 'Contests', sub: 'Page', href: '/contests' },
  { label: 'Submissions', sub: 'Page', href: '/submissions' },
  { label: 'Analytics', sub: 'Page', href: '/analytics' },
  { label: 'Home / Landing', sub: 'Page', href: '/' },
];

// ⌘K / Ctrl-K fuzzy launcher across pages + (lazily fetched) problems & contests.
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [dynamic, setDynamic] = useState<Item[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setActive(0);
    setTimeout(() => inputRef.current?.focus(), 0);
    if (dynamic.length === 0) {
      Promise.all([
        api.get<any>('/problems?limit=100').catch(() => null),
        api.get<any>('/contests?limit=100').catch(() => null),
      ]).then(([p, c]) => {
        const items: Item[] = [];
        p?.problems?.forEach((x: any) => items.push({ label: x.title, sub: 'Problem', href: `/problems/${x.slug}` }));
        c?.contests?.forEach((x: any) => items.push({ label: x.title, sub: 'Contest', href: `/contests/${x.slug}` }));
        setDynamic(items);
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const all = useMemo(() => [...ROUTES, ...dynamic], [dynamic]);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all.slice(0, 8);
    return all.filter((i) => i.label.toLowerCase().includes(s)).slice(0, 12);
  }, [q, all]);

  useEffect(() => setActive(0), [q]);

  if (!open) return null;

  const go = (item: Item) => {
    setOpen(false);
    router.push(item.href);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center pt-[14vh] px-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl border border-[var(--c-border-2)] bg-[var(--c-bg)] rf-toast"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--c-border-2)] px-4">
          <span className="label-mono text-rf-iron">⌘K</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(results.length - 1, a + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === 'Enter' && results[active]) {
                go(results[active]);
              }
            }}
            placeholder="Search problems, contests, pages…"
            className="flex-1 bg-transparent py-4 text-sm text-[var(--c-fg)] outline-none placeholder:text-rf-iron"
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {results.length === 0 && <div className="px-4 py-6 label-mono text-rf-iron">No matches</div>}
          {results.map((item, i) => (
            <button
              key={item.href + i}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                i === active ? 'bg-[var(--c-surface-2)] text-[var(--c-fg)]' : 'text-rf-gray'
              }`}
            >
              <span className="truncate">{item.label}</span>
              <span className="label-mono text-rf-iron shrink-0 ml-3">{item.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
