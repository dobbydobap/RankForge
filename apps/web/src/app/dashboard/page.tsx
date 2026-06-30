'use client';

import { useAuthStore } from '@/stores/auth-store';
import { VerdictBadge } from '@/components/submissions/VerdictBadge';
import { PageHeader, SectionLabel, StatTile } from '@/components/layout/Editorial';
import { Reveal } from '@/components/layout/Reveal';
import { RankChip } from '@/components/layout/RankChip';
import { TodayCard } from '@/components/layout/TodayCard';
import { LoadingBlock } from '@/components/ui/Skeleton';
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
      <main className="flex-1 w-full max-w-6xl px-6 lg:px-10 py-10">
        <LoadingBlock rows={4} />
      </main>
    );
  }

  if (!user) return null;

  const maxDiff = Math.max(
    1,
    ...['EASY', 'MEDIUM', 'HARD', 'EXPERT'].map((d) => stats?.difficultyBreakdown?.[d] || 0),
  );

  return (
    <main className="flex-1 w-full max-w-6xl px-6 lg:px-10 py-10">
      <PageHeader
        eyebrow="Dashboard / Overview"
        title={user.profile?.displayName || user.username}
        actions={
          <Link
            href={`/users/${user.username}`}
            className="px-5 py-2.5 text-xs uppercase tracking-wide font-medium bg-[var(--c-fg)] text-[var(--c-bg)] hover:opacity-80 transition-opacity"
          >
            View Profile
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[var(--c-border)] border border-[var(--c-border)]">
        <StatTile label="Rating" value={stats?.profile?.currentRating ?? 1200} emphasis />
        <StatTile label="Max Rating" value={stats?.profile?.maxRating ?? 1200} />
        <StatTile label="Solved" value={stats?.profile?.solvedCount ?? 0} />
        <StatTile label="Contests" value={stats?.profile?.contestCount ?? 0} />
        <StatTile label="Streak" value={`${stats?.streak ?? 0}d`} />
      </div>

      {/* Tier + streak keeper */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <RankChip rating={stats?.profile?.currentRating ?? 100} />
        <TodayCard streak={stats?.streak ?? 0} />
      </div>

      {/* Difficulty Breakdown */}
      {stats?.difficultyBreakdown && Object.keys(stats.difficultyBreakdown).length > 0 && (
        <section className="mt-12">
          <SectionLabel index="01">Problems by Difficulty</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--c-border)] border border-[var(--c-border)]">
            {['EASY', 'MEDIUM', 'HARD', 'EXPERT'].map((d) => {
              const count = stats.difficultyBreakdown[d] || 0;
              return (
                <div key={d} className="bg-[var(--c-surface)] p-5">
                  <div className="label-mono text-rf-gray">{d}</div>
                  <div className="font-display text-3xl text-[var(--c-fg)] mt-2 tabular-nums leading-none">
                    {count}
                  </div>
                  <div className="mt-3 h-1 bg-[var(--c-surface-3)]">
                    <div
                      className="h-full bg-[var(--c-fg)]"
                      style={{ width: `${(count / maxDiff) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Upcoming Contests */}
        <section>
          <SectionLabel index="02">Upcoming Contests</SectionLabel>
          {!stats?.upcomingContests?.length ? (
            <p className="text-sm text-rf-gray">
              No upcoming contests.{' '}
              <Link href="/contests" className="text-[var(--c-fg)] underline underline-offset-4">
                Browse contests
              </Link>
            </p>
          ) : (
            <div className="border border-[var(--c-border)] divide-y divide-[var(--c-border)]">
              {stats.upcomingContests.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/contests/${c.slug}`}
                  className="block p-4 bg-[var(--c-surface)] hover:bg-[var(--c-surface-2)] transition-colors"
                >
                  <div className="text-sm font-medium text-[var(--c-fg)]">{c.title}</div>
                  <div className="label-mono text-rf-gray mt-1">
                    {new Date(c.startTime).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}{' '}
                    · {c.duration} min
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Submissions */}
        <section>
          <SectionLabel index="03">Recent Submissions</SectionLabel>
          {!stats?.recentSubmissions?.length ? (
            <p className="text-sm text-rf-gray">
              No submissions yet.{' '}
              <Link href="/problems" className="text-[var(--c-fg)] underline underline-offset-4">
                Start solving
              </Link>
            </p>
          ) : (
            <div className="border border-[var(--c-border)] divide-y divide-[var(--c-border)]">
              {stats.recentSubmissions.map((s: any) => (
                <Link
                  key={s.id}
                  href={`/submissions/${s.id}`}
                  className="flex items-center justify-between gap-3 p-4 bg-[var(--c-surface)] hover:bg-[var(--c-surface-2)] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-[var(--c-fg)] truncate">{s.problemTitle}</div>
                    <div className="label-mono text-rf-gray mt-1">
                      {(LANGUAGE_DISPLAY as any)[s.language]} · {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <VerdictBadge verdict={s.verdict} short />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick Actions */}
      <Reveal className="block mt-12">
      <section>
        <SectionLabel index="04">Quick Actions</SectionLabel>
        <div className="flex flex-wrap gap-3">
          {[
            ['Practice Problems', '/problems'],
            ['Browse Contests', '/contests'],
            ['My Profile', `/users/${user.username}`],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="px-5 py-2.5 text-xs uppercase tracking-wide font-medium border border-[var(--c-border-2)] text-[var(--c-fg)] hover:border-[var(--c-fg)] transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
      </Reveal>
    </main>
  );
}
