'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home' },
  { href: '/problems', label: 'Problems' },
  { href: '/contests', label: 'Contests' },
  { href: '/submissions', label: 'Submissions' },
  { href: '/analytics', label: 'Analytics' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <div className="h-screen flex bg-rf-black overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[224px] h-full flex flex-col border-r border-[var(--c-border-2)] bg-[var(--c-bg)] shrink-0 relative z-10">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[var(--c-border-2)]">
          <Link href="/" className="group font-display text-base font-extrabold tracking-tight text-[var(--c-fg)] uppercase">
            Rank<span className="transition-colors group-hover:text-rf-gray">Forge</span>
            <sup className="text-[8px] align-super ml-0.5">™</sup>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto">
          <div className="label-mono text-rf-iron px-5 mb-3">Index</div>
          {NAV_ITEMS.map((item, i) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 pl-5 pr-4 py-2.5 text-sm transition-colors ${
                  isActive ? 'text-[var(--c-fg)] bg-[var(--c-surface-2)]' : 'text-rf-gray hover:text-[var(--c-fg)] hover:bg-[var(--c-surface)]'
                }`}
              >
                {isActive && <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--c-fg)]" />}
                <span className="font-mono text-[10px] text-rf-iron tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="uppercase tracking-wide text-[13px] transition-transform duration-200 group-hover:translate-x-1">{item.label}</span>
                {isActive && <span className="ml-auto text-rf-gray text-xs">→</span>}
              </Link>
            );
          })}

          <div className="label-mono text-rf-iron px-5 mt-6 mb-3">Other</div>
          {isAuthenticated && user && (
            <Link
              href={`/users/${user.username}`}
              className={`group relative flex items-center gap-3 pl-5 pr-4 py-2.5 text-sm transition-colors ${
                pathname.startsWith('/users/') ? 'text-[var(--c-fg)] bg-[var(--c-surface-2)]' : 'text-rf-gray hover:text-[var(--c-fg)] hover:bg-[var(--c-surface)]'
              }`}
            >
              {pathname.startsWith('/users/') && <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--c-fg)]" />}
              <span className="font-mono text-[10px] text-rf-iron tabular-nums">06</span>
              <span className="uppercase tracking-wide text-[13px] transition-transform duration-200 group-hover:translate-x-1">Profile</span>
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={`group relative flex items-center gap-3 pl-5 pr-4 py-2.5 text-sm transition-colors ${
                pathname === '/admin' ? 'text-[var(--c-fg)] bg-[var(--c-surface-2)]' : 'text-rf-gray hover:text-[var(--c-fg)] hover:bg-[var(--c-surface)]'
              }`}
            >
              {pathname === '/admin' && <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--c-fg)]" />}
              <span className="font-mono text-[10px] text-rf-iron tabular-nums">07</span>
              <span className="uppercase tracking-wide text-[13px] transition-transform duration-200 group-hover:translate-x-1">Admin</span>
            </Link>
          )}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-[var(--c-border-2)]">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--c-fg)] text-[var(--c-bg)] flex items-center justify-center text-xs font-display font-extrabold">
                {(user.profile?.displayName || user.username).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[var(--c-fg)] truncate">{user.profile?.displayName || user.username}</div>
                <div className="label-mono text-rf-iron truncate">@{user.username}</div>
              </div>
              <button
                onClick={() => logout()}
                className="text-rf-iron hover:text-[var(--c-fg)] transition-colors"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link href="/login" className="flex items-center justify-center py-2 text-xs uppercase tracking-wide text-rf-gray hover:text-[var(--c-fg)] border border-[var(--c-border)] hover:border-rf-iron transition-all">
                Login
              </Link>
              <Link href="/register" className="flex items-center justify-center py-2 text-xs uppercase tracking-wide font-medium text-[var(--c-bg)] bg-[var(--c-fg)] hover:opacity-80 transition-all">
                Register
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {children}
      </main>
    </div>
  );
}
