'use client';

import { useState } from 'react';
import Link from 'next/link';
import { VerdictBadge } from '@/components/submissions/VerdictBadge';
import { useSubmissions } from '@/hooks/use-api';
import { LANGUAGE_DISPLAY } from '@rankforge/shared';
import { PageHeader } from '@/components/layout/Editorial';

export default function SubmissionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSubmissions({ page });

  return (
    <>
      <main className="flex-1 w-full max-w-6xl px-6 lg:px-10 py-10">
        <PageHeader eyebrow="Activity / Judge" title="Submissions" />

        {isLoading ? (
          <div className="text-center py-12 label-mono text-rf-gray animate-pulse">Loading…</div>
        ) : !data?.submissions.length ? (
          <div className="text-center py-12 label-mono text-rf-gray">No submissions yet</div>
        ) : (
          <>
            <div className="border border-[var(--c-border)]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--c-border)] bg-[var(--c-surface)]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-rf-gray uppercase tracking-wider">
                      Problem
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-rf-gray uppercase tracking-wider hidden sm:table-cell">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-rf-gray uppercase tracking-wider">
                      Verdict
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-rf-gray uppercase tracking-wider hidden md:table-cell">
                      Language
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-rf-gray uppercase tracking-wider hidden md:table-cell">
                      Time
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-rf-gray uppercase tracking-wider hidden lg:table-cell">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--c-border)]">
                  {data.submissions.map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-[var(--c-surface)] transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/problems/${sub.problemSlug}`}
                          className="text-sm text-[var(--c-fg)] hover:underline underline-offset-4 transition-colors"
                        >
                          {sub.problemTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Link
                          href={`/users/${sub.username}`}
                          className="text-sm text-rf-gray hover:text-[var(--c-fg)] transition-colors"
                        >
                          {sub.username}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/submissions/${sub.id}`}>
                          <VerdictBadge verdict={sub.verdict} />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-rf-gray hidden md:table-cell">
                        {(LANGUAGE_DISPLAY as any)[sub.language] || sub.language}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-rf-gray hidden md:table-cell">
                        {sub.timeUsed !== null ? `${sub.timeUsed}ms` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-rf-gray hidden lg:table-cell">
                        {new Date(sub.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
