'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { ProblemFilters, DifficultyBadge } from '@/components/problems/ProblemFilters';
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
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-rf-cream">Problems</h1>
        </div>

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
            <div className="text-center py-12 text-rf-muted">Loading problems...</div>
          ) : !data?.problems.length ? (
            <div className="text-center py-12 text-rf-muted">No problems found.</div>
          ) : (
            <>
              <div className="border border-rf-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-rf-border bg-rf-dark/50">
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
                  <tbody className="divide-y divide-rf-border">
                    {data.problems.map((problem: any) => (
                      <tr key={problem.id} className="hover:bg-rf-dark/50 transition-colors">
                        <td className="px-4 py-3">
                          <Link
                            href={`/problems/${problem.slug}`}
                            className="text-sm font-medium text-rf-cream hover:text-rf-sage transition-colors"
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
                                className="px-2 py-0.5 text-xs bg-rf-border text-rf-gray rounded"
                              >
                                {t}
                              </span>
                            ))}
                            {problem.tags.length > 3 && (
                              <span className="text-xs text-rf-muted">
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
        </div>
      </main>
    </>
  );
}
