'use client';

import { useEffect, useState } from 'react';

// Toggles the `dark` class on <html> and persists to localStorage.
// Initial class is applied pre-paint by the inline script in layout.tsx (no FOUC).
export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const next = !root.classList.contains('dark');
    localStorage.setItem('rf-theme', next ? 'dark' : 'light');
    const apply = () => {
      root.classList.toggle('dark', next);
      setDark(next);
    };
    // Smooth crossfade between themes where supported (Chrome/Edge).
    const start = (document as Document & { startViewTransition?: (cb: () => void) => void })
      .startViewTransition;
    if (typeof start === 'function') start.call(document, apply);
    else apply();
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light / dark theme"
      title={dark ? 'Switch to light' : 'Switch to dark'}
      className="fixed top-3 right-3 z-[100] w-9 h-9 flex items-center justify-center border border-[var(--c-border-2)] bg-[var(--c-surface)] text-[var(--c-fg)] hover:bg-[var(--c-surface-2)] transition-colors"
    >
      <span className={`inline-flex transition-transform duration-500 ${dark ? 'rotate-0' : 'rotate-90'}`}>
      {dark ? (
        // sun
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // moon
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
        </svg>
      )}
      </span>
    </button>
  );
}
