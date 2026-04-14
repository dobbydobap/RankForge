'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ContestStatusBadge } from '@/components/contests/ContestStatusBadge';
import { useContests } from '@/hooks/use-api';

export default function ContestsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useContests({ page });

  return (
    <>
      <main className="flex-1 w-full px-6 lg:px-10 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Contests</h1>
          <Link
            href="/contests/create"
            className="px-4 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors"
          >
            Create Contest
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-rf-gray">Loading contests...</div>
        ) : !data?.contests.length ? (
          <div className="text-center py-12 text-rf-gray">No contests yet.</div>
        ) : (
          <>
            <div className="space-y-3">
              {data.contests.map((contest: any) => (
                <Link
                  key={contest.id}
                  href={`/contests/${contest.slug}`}
                  className="block p-5 rounded-xl border border-[#2a2a30] bg-[#141416] hover:border-rf-gray transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-lg font-semibold text-white">
                          {contest.title}
                        </h2>
                        <ContestStatusBadge status={contest.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-rf-gray">
                        <span>
                          {new Date(contest.startTime).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>{contest.duration} min</span>
                        <span>{contest.problemCount} problems</span>
                        <span>{contest.participantCount} participants</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-rf-iron rounded-lg text-orange-400 hover:border-rf-gray disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-rf-gray">
                  Page {data.page} of {data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="px-3 py-1.5 text-sm border border-rf-iron rounded-lg text-orange-400 hover:border-rf-gray disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
