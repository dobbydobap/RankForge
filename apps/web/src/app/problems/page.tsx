'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProblemFilters, DifficultyBadge } from '@/components/problems/ProblemFilters';
import { PageHeader } from '@/components/layout/Editorial';
import { useProblems, useTags } from '@/hooks/use-api';

export default function ProblemsPage() {
  const [difficulty, setDifficulty] = useState('');
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: tagsData } = useTags();
  const { data, isLoading } = useProblems({ difficulty, tag, search, page });

  return (
    <>
      <main className="flex-1 w-full max-w-6xl px-6 lg:px-10 py-10">
        <PageHeader
          eyebrow="Practice / Archive"
          title="Problems"
          actions={
            <span className="label-mono text-rf-gray">
              {data?.total ?? data?.problems?.length ?? 0} total
            </span>
          }
        />

        <ProblemFilters
          difficulty={difficulty}
          tag={tag}
          search={search}
          onDifficultyChange={(d) => { setDifficulty(d); setPage(1); }}
          onTagChange={(t) => { setTag(t); setPage(1); }}
          onSearchChange={(s) => { setSearch(s); setPage(1); }}
          tags={tagsData ?? []}
        />

        <div className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 label-mono text-rf-gray animate-pulse">Loading…</div>
          ) : !data?.problems.length ? (
            <div className="text-center py-12 label-mono text-rf-gray">No problems found</div>
          ) : (
            <>
              <div className="border border-[var(--c-border)]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--c-border)] bg-[var(--c-surface)]">
                      <th className="text-left px-4 py-3 text-xs font-medium text-rf-gray uppercase tracking-wider">
                        Title
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-rf-gray uppercase tracking-wider hidden sm:table-cell">
                        Difficulty
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-rf-gray uppercase tracking-wider hidden md:table-cell">
                        Tags
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-rf-gray uppercase tracking-wider hidden sm:table-cell">
                        Submissions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--c-border)]">
                    {data.problems.map((problem: any) => (
                      <tr key={problem.id} className="hover:bg-[var(--c-surface)] transition-colors">
                        <td className="px-4 py-3">
                          <Link
                            href={`/problems/${problem.slug}`}
                            className="text-sm font-medium text-[var(--c-fg)] hover:underline underline-offset-4 transition-colors"
                          >
                            {problem.title}
                          </Link>
                          <div className="sm:hidden mt-1">
                            <DifficultyBadge difficulty={problem.difficulty} />
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <DifficultyBadge difficulty={problem.difficulty} />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {problem.tags.slice(0, 3).map((t: string) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 text-[11px] font-mono uppercase tracking-wide border border-[var(--c-border-2)] text-rf-gray"
                              >
                                {t}
                              </span>
                            ))}
                            {problem.tags.length > 3 && (
                              <span className="text-xs text-rf-gray">
                                +{problem.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-rf-gray hidden sm:table-cell">
                          {problem.submissionCount}
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
        </div>
      </main>
    </>
  );
}
