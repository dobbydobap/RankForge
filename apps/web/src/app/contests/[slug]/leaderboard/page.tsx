'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { VerdictBadge } from '@/components/submissions/VerdictBadge';
import { useContest, useLeaderboard, useProblemStats } from '@/hooks/use-api';

export default function LeaderboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: contest } = useContest(slug);
  const { data: leaderboard, isLoading } = useLeaderboard(contest?.id || '');
  const { data: stats } = useProblemStats(contest?.id || '');

  if (isLoading || !contest) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Loading leaderboard...</div>
        </div>
      </>
    );
  }

  const entries = leaderboard?.entries || [];
  const problemLabels = contest.problems?.map((p: any) => p.label) || [];

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-100">Leaderboard</h1>
              {leaderboard?.isFrozen && (
                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-900/50 text-yellow-400 border border-yellow-800 rounded">
                  Frozen
                </span>
              )}
            </div>
            <Link
              href={`/contests/${slug}`}
              className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
            >
              &larr; Back to {contest.title}
            </Link>
          </div>
        </div>

        {/* Problem Stats */}
        {stats && stats.length > 0 && (
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {stats.map((s: any) => (
              <div
                key={s.label}
                className="flex-shrink-0 px-4 py-3 border border-zinc-800 rounded-lg bg-zinc-900/50 min-w-[140px]"
              >
                <div className="text-sm font-mono font-bold text-emerald-400">{s.label}</div>
                <div className="text-xs text-zinc-400 mt-0.5 truncate">{s.title}</div>
                <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                  <span>{s.solvedCount}/{s.attemptedCount}</span>
                  <span>{s.acceptanceRate}%</span>
                </div>
                {s.firstSolver && (
                  <div className="text-xs text-yellow-400 mt-1">
                    FB: {s.firstSolver.username}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Standings Table */}
        {entries.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">No standings yet.</div>
        ) : (
          <div className="border border-zinc-800 rounded-xl overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-center px-3 py-3 text-xs font-medium text-zinc-400 uppercase w-14">
                    #
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-zinc-400 uppercase">
                    User
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-zinc-400 uppercase w-20">
                    Score
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-zinc-400 uppercase w-20">
                    Penalty
                  </th>
                  {problemLabels.map((label: string) => (
                    <th
                      key={label}
                      className="text-center px-3 py-3 text-xs font-medium text-zinc-400 uppercase w-20"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {entries.map((entry: any) => (
                  <tr key={entry.userId} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="text-center px-3 py-3 text-sm font-bold text-zinc-300">
                      {entry.rank <= 3 ? (
                        <span
                          className={
                            entry.rank === 1
                              ? 'text-yellow-400'
                              : entry.rank === 2
                                ? 'text-zinc-300'
                                : 'text-orange-400'
                          }
                        >
                          {entry.rank}
                        </span>
                      ) : (
                        entry.rank
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/users/${entry.username}`}
                        className="text-sm font-medium text-zinc-200 hover:text-emerald-400 transition-colors"
                      >
                        {entry.displayName || entry.username}
                      </Link>
                      <span className="text-xs text-zinc-500 ml-1.5">@{entry.username}</span>
                    </td>
                    <td className="text-center px-3 py-3 text-sm font-bold text-zinc-100">
                      {entry.totalScore}
                    </td>
                    <td className="text-center px-3 py-3 text-sm text-zinc-400">
                      {entry.penalty}
                    </td>
                    {problemLabels.map((label: string) => {
                      const pr = entry.problemResults.find((r: any) => r.label === label);
                      if (!pr || pr.attempts === 0) {
                        return (
                          <td key={label} className="text-center px-3 py-3 text-sm text-zinc-600">
                            —
                          </td>
                        );
                      }

                      const isAC = pr.score > 0;
                      return (
                        <td key={label} className="text-center px-3 py-3">
                          <div
                            className={`inline-flex flex-col items-center px-2 py-1 rounded text-xs font-medium ${
                              isAC
                                ? pr.isFirstBlood
                                  ? 'bg-yellow-900/30 text-yellow-400'
                                  : 'bg-emerald-900/30 text-emerald-400'
                                : 'bg-red-900/30 text-red-400'
                            }`}
                          >
                            <span>{isAC ? `+${pr.attempts > 1 ? pr.attempts - 1 : ''}` : `-${pr.attempts}`}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
