'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { VerdictBadge } from '@/components/submissions/VerdictBadge';
import { useSubmissions } from '@/hooks/use-api';
import { LANGUAGE_DISPLAY } from '@rankforge/shared';

export default function SubmissionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSubmissions({ page });

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-rf-cream mb-6">Submissions</h1>

        {isLoading ? (
          <div className="text-center py-12 text-rf-muted">Loading submissions...</div>
        ) : !data?.submissions.length ? (
          <div className="text-center py-12 text-rf-muted">No submissions yet.</div>
        ) : (
          <>
            <div className="border border-rf-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-rf-border bg-rf-dark/50">
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
                <tbody className="divide-y divide-rf-border">
                  {data.submissions.map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-rf-dark/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/problems/${sub.problemSlug}`}
                          className="text-sm text-rf-cream hover:text-rf-sage transition-colors"
                        >
                          {sub.problemTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Link
                          href={`/users/${sub.username}`}
                          className="text-sm text-rf-gray hover:text-rf-cream transition-colors"
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
                      <td className="px-4 py-3 text-right text-sm text-rf-muted hidden lg:table-cell">
                        {new Date(sub.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-rf-iron rounded-lg text-rf-sage hover:border-rf-gray disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-rf-gray">
                  Page {data.page} of {data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="px-3 py-1.5 text-sm border border-rf-iron rounded-lg text-rf-sage hover:border-rf-gray disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
