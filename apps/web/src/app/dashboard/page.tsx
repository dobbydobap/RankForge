'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Navbar } from '@/components/layout/Navbar';
import { VerdictBadge } from '@/components/submissions/VerdictBadge';
import { useDashboardStats } from '@/hooks/use-api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LANGUAGE_DISPLAY } from '@rankforge/shared';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const { data: stats, isLoading } = useDashboardStats();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-zinc-100">
          Welcome, {user.profile?.displayName || user.username}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Here&apos;s your progress overview
        </p>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Rating" value={stats?.profile?.currentRating ?? 1200} accent />
          <StatCard title="Max Rating" value={stats?.profile?.maxRating ?? 1200} />
          <StatCard title="Solved" value={stats?.profile?.solvedCount ?? 0} />
          <StatCard title="Contests" value={stats?.profile?.contestCount ?? 0} />
          <StatCard title="Streak" value={`${stats?.streak ?? 0}d`} />
        </div>

        {/* Difficulty Breakdown */}
        {stats?.difficultyBreakdown && Object.keys(stats.difficultyBreakdown).length > 0 && (
          <div className="mt-6 p-4 border border-zinc-800 rounded-xl bg-zinc-900/50">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">Problems by Difficulty</h2>
            <div className="flex items-center gap-4">
              {['EASY', 'MEDIUM', 'HARD', 'EXPERT'].map((d) => {
                const count = stats.difficultyBreakdown[d] || 0;
                const colors: Record<string, string> = {
                  EASY: 'bg-emerald-500', MEDIUM: 'bg-yellow-500',
                  HARD: 'bg-orange-500', EXPERT: 'bg-red-500',
                };
                return (
                  <div key={d} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colors[d]}`} />
                    <span className="text-xs text-zinc-400">
                      {d.charAt(0) + d.slice(1).toLowerCase()}: {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Contests */}
          <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/50">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">Upcoming Contests</h2>
            {!stats?.upcomingContests?.length ? (
              <p className="text-xs text-zinc-500">
                No upcoming contests.{' '}
                <Link href="/contests" className="text-emerald-400 hover:text-emerald-300">
                  Browse contests
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {stats.upcomingContests.map((c: any) => (
                  <Link
                    key={c.id}
                    href={`/contests/${c.slug}`}
                    className="block p-3 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors"
                  >
                    <div className="text-sm font-medium text-zinc-200">{c.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {new Date(c.startTime).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}{' '}
                      &middot; {c.duration} min
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/50">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">Recent Submissions</h2>
            {!stats?.recentSubmissions?.length ? (
              <p className="text-xs text-zinc-500">
                No submissions yet.{' '}
                <Link href="/problems" className="text-emerald-400 hover:text-emerald-300">
                  Start solving
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {stats.recentSubmissions.map((s: any) => (
                  <Link
                    key={s.id}
                    href={`/submissions/${s.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                  >
                    <div>
                      <div className="text-sm text-zinc-200">{s.problemTitle}</div>
                      <div className="text-xs text-zinc-500">
                        {(LANGUAGE_DISPLAY as any)[s.language]} &middot;{' '}
                        {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <VerdictBadge verdict={s.verdict} short />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-3">
          <Link
            href="/problems"
            className="px-4 py-2 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
          >
            Practice Problems
          </Link>
          <Link
            href="/contests"
            className="px-4 py-2 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
          >
            Browse Contests
          </Link>
          <Link
            href={`/users/${user.username}`}
            className="px-4 py-2 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
          >
            My Profile
          </Link>
        </div>
      </main>
    </>
  );
}

function StatCard({ title, value, accent }: { title: string; value: string | number; accent?: boolean }) {
  return (
    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
      <p className="text-xs text-zinc-500">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? 'text-emerald-400' : 'text-zinc-100'}`}>
        {value}
      </p>
    </div>
  );
}
