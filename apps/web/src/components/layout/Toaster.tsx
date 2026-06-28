'use client';

import { useToastStore } from '@/stores/toast-store';

const GLYPH = { default: '›', success: '✓', error: '✕' } as const;

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2 w-[320px] max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className="rf-toast text-left flex items-start gap-3 border border-[var(--c-border-2)] bg-[var(--c-surface)] px-4 py-3 text-sm text-[var(--c-fg)] hover:bg-[var(--c-surface-2)] transition-colors"
        >
          <span className="font-mono text-xs text-rf-gray mt-0.5">{GLYPH[t.variant]}</span>
          <span className="flex-1">{t.message}</span>
        </button>
      ))}
    </div>
  );
}
