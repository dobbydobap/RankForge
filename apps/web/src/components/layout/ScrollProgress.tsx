'use client';

import { useEffect, useState } from 'react';

// Thin top hairline that fills with scroll. Uses capture so it catches the
// inner scroll containers (AppLayout <main>, landing root) — not just window.
export function ScrollProgress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = (e: Event) => {
      const el = e.target as HTMLElement;
      if (!el || typeof el.scrollHeight !== 'number') return;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;
      setP(Math.min(1, Math.max(0, el.scrollTop / max)));
    };
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[80] h-[2px] pointer-events-none">
      <div
        className="h-full bg-[var(--c-fg)] origin-left"
        style={{ width: `${p * 100}%`, transition: 'width 80ms linear' }}
      />
    </div>
  );
}
