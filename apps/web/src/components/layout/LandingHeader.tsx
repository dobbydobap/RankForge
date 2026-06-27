'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';

// Auth-aware header for the (standalone) landing page — shows the logged-in state
// instead of always rendering Login / Get Started.
export function LandingHeader() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  return (
    <header className="flex items-center justify-between px-6 lg:px-10 h-16 border-b border-[var(--c-fg)]">
      <Link href="/" className="font-display text-lg font-extrabold uppercase tracking-tight">
        RankForge<sup className="text-[9px] align-super ml-0.5">™</sup>
      </Link>

      <nav className="hidden md:flex items-center gap-8 label-mono">
        <Link href="/problems" className="hover:opacity-40 transition-opacity">Problems</Link>
        <Link href="/contests" className="hover:opacity-40 transition-opacity">Contests</Link>
        {isAuthenticated ? (
          <Link href="/dashboard" className="hover:opacity-40 transition-opacity">Dashboard</Link>
        ) : (
          <Link href="/login" className="hover:opacity-40 transition-opacity">Login</Link>
        )}
      </nav>

      {/* Render nothing until auth resolves, to avoid flashing the wrong CTA */}
      {isLoading ? (
        <span className="w-[110px]" aria-hidden />
      ) : isAuthenticated && user ? (
        <Link
          href="/dashboard"
          className="label-mono bg-[var(--c-fg)] text-[var(--c-bg)] px-4 py-2 hover:opacity-80 transition-colors"
        >
          {user.username} →
        </Link>
      ) : (
        <Link
          href="/register"
          className="label-mono bg-[var(--c-fg)] text-[var(--c-bg)] px-4 py-2 hover:opacity-80 transition-colors"
        >
          Get Started →
        </Link>
      )}
    </header>
  );
}
