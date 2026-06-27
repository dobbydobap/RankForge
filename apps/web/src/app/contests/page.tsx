'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ContestStatusBadge } from '@/components/contests/ContestStatusBadge';
import { PageHeader } from '@/components/layout/Editorial';
import { useContests } from '@/hooks/use-api';

export default function ContestsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useContests({ page });

  return (
    <>
      <main className="flex-1 w-full max-w-6xl px-6 lg:px-10 py-10">
        <PageHeader
          eyebrow="Compete / Rounds"
          title="Contests"
          actions={
            <Link
              href="/contests/create"
              className="px-5 py-2.5 text-xs uppercase tracking-wide font-medium bg-[var(--c-fg)] hover:opacity-80 text-[var(--c-bg)] transition-opacity"
            >
              Create Contest
            </Link>
          }
        />

        {isLoading ? (
          <div className="text-center py-12 label-mono text-rf-gray animate-pulse">Loading…</div>
        ) : !data?.contests.length ? (
          <div className="text-center py-12 label-mono text-rf-gray">No contests yet</div>
        ) : (
          <>
            <div className="border border-[var(--c-border)] divide-y divide-[var(--c-border)]">
              {data.contests.map((contest: any, i: number) => (
                <Link
                  key={contest.id}
                  href={`/contests/${contest.slug}`}
                  className="group flex items-start gap-5 p-5 bg-[var(--c-surface)] hover:bg-[var(--c-surface-2)] transition-colors"
                >
                  <span className="font-mono text-xs text-rf-iron tabular-nums pt-1.5">
                    {String((data.page - 1) * (data.contests.length) + i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h2 className="text-lg font-semibold text-[var(--c-fg)] group-hover:underline underline-offset-4">
                        {contest.title}
                      </h2>
                      <ContestStatusBadge status={contest.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 label-mono text-rf-gray">
                      <span>
                        {new Date(contest.startTime).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      <span>{contest.duration} min</span>
                      <span>{contest.problemCount} problems</span>
                      <span>{contest.participantCount} participants</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-1.5 text-xs uppercase tracking-wide border border-[var(--c-border-2)] text-[var(--c-fg)] hover:border-[var(--c-fg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <span className="label-mono text-rf-gray tabular-nums">
                  {data.page} / {data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="px-4 py-1.5 text-xs uppercase tracking-wide border border-[var(--c-border-2)] text-[var(--c-fg)] hover:border-[var(--c-fg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
