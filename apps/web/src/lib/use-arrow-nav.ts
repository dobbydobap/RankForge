'use client';

import { useEffect } from 'react';

// Roving Up/Down focus across row links inside a container (a11y for tables/lists).
// Mark each focusable row with `data-row-link`. Enter activates natively (they're <a>).
export function useArrowNav(
  ref: React.RefObject<HTMLElement | null>,
  selector = '[data-row-link]',
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(selector));
      if (!items.length) return;
      e.preventDefault();
      const idx = items.indexOf(document.activeElement as HTMLElement);
      let next = idx === -1 ? 0 : e.key === 'ArrowDown' ? idx + 1 : idx - 1;
      next = Math.max(0, Math.min(items.length - 1, next));
      items[next]?.focus();
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [ref, selector]);
}
