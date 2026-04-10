'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <nav className="border-b border-rf-border bg-rf-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-white tracking-tight">
              Rank<span className="text-rf-gray">Forge</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/problems"
                className="text-sm text-rf-gray hover:text-white transition-colors"
              >
                Problems
              </Link>
              <Link
                href="/contests"
                className="text-sm text-rf-gray hover:text-white transition-colors"
              >
                Contests
              </Link>
              <Link
                href="/submissions"
                className="text-sm text-rf-gray hover:text-white transition-colors"
              >
                Submissions
              </Link>
              <Link
                href="/contests"
                className="text-sm text-rf-gray hover:text-white transition-colors"
              >
                Leaderboard
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-rf-gray hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href={`/users/${user.username}`}
                  className="text-sm text-rf-gray hover:text-white transition-colors"
                >
                  {user.username}
                </Link>
                <button
                  onClick={() => logout()}
                  className="text-sm text-rf-gray hover:text-rf-pink transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-rf-gray hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium bg-rf-accent hover:bg-rf-accent-hover text-white rounded-lg transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
