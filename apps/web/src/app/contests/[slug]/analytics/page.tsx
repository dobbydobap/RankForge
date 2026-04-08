'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { useContest } from '@/hooks/use-api';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function ContestAnalyticsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: contest } = useContest(slug);
  const token = useAuthStore((s) => s.accessToken);

  const { data: myAnalytics } = useQuery({
    queryKey: ['myContestAnalytics', contest?.id],
    queryFn: () =>
      api.get<any>(`/analytics/contest/${contest?.id}/me`, { token: token ?? undefined }),
    enabled: !!contest?.id && !!token,
  });

  if (!contest || !myAnalytics) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-rf-gray">Loading analytics...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-rf-cream">Contest Analytics</h1>
          <Link
            href={`/contests/${slug}`}
            className="text-sm text-rf-gray hover:text-rf-sage transition-colors"
          >
            &larr; {myAnalytics.contestTitle}
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 border border-rf-border rounded-xl bg-rf-dark/50">
            <p className="text-xs text-rf-muted">Solved</p>
            <p className="text-2xl font-bold text-rf-sage">
              {myAnalytics.summary.solved}/{myAnalytics.totalProblems}
            </p>
          </div>
          <div className="p-4 border border-rf-border rounded-xl bg-rf-dark/50">
            <p className="text-xs text-rf-muted">Score</p>
            <p className="text-2xl font-bold text-rf-cream">{myAnalytics.summary.totalScore}</p>
          </div>
          <div className="p-4 border border-rf-border rounded-xl bg-rf-dark/50">
            <p className="text-xs text-rf-muted">Participants</p>
            <p className="text-2xl font-bold text-rf-cream">{myAnalytics.totalParticipants}</p>
          </div>
          {myAnalytics.summary.ratingChange && (
            <div className="p-4 border border-rf-border rounded-xl bg-rf-dark/50">
              <p className="text-xs text-rf-muted">Rating Change</p>
              <p className={`text-2xl font-bold ${
                myAnalytics.summary.ratingChange.delta >= 0 ? 'text-rf-sage' : 'text-red-400'
              }`}>
                {myAnalytics.summary.ratingChange.delta >= 0 ? '+' : ''}
                {myAnalytics.summary.ratingChange.delta}
              </p>
            </div>
          )}
        </div>

        {/* Per-problem breakdown */}
        <div className="border border-rf-border rounded-xl overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rf-border bg-rf-dark/50">
                <th className="text-center px-4 py-3 text-xs font-medium text-rf-gray uppercase w-14">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-rf-gray uppercase">Problem</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-rf-gray uppercase w-20">Result</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-rf-gray uppercase w-24">Your Time</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-rf-gray uppercase w-24">Avg Time</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-rf-gray uppercase w-20">Solvers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rf-border">
              {myAnalytics.problemBreakdown.map((p: any) => (
                <tr key={p.label} className="hover:bg-rf-dark/50 transition-colors">
                  <td className="text-center px-4 py-3 text-sm font-mono font-bold text-rf-sage">
                    {p.label}
                  </td>
                  <td className="px-4 py-3 text-sm text-rf-cream">{p.title}</td>
                  <td className="text-center px-4 py-3">
                    {p.solved ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-rf-dark/80 text-rf-sage border border-rf-iron rounded">
                        AC ({p.attempts})
                      </span>
                    ) : p.attempts > 0 ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-red-900/50 text-red-400 border border-red-800 rounded">
                        -{p.attempts}
                      </span>
                    ) : (
                      <span className="text-xs text-rf-iron">—</span>
                    )}
                  </td>
                  <td className="text-center px-4 py-3 text-sm text-rf-sage">
                    {p.solveTime !== null ? `${p.solveTime}m` : '—'}
                  </td>
                  <td className="text-center px-4 py-3 text-sm text-rf-gray">
                    {p.avgSolveTime !== null ? `${p.avgSolveTime}m` : '—'}
                  </td>
                  <td className="text-center px-4 py-3 text-sm text-rf-gray">
                    {p.totalSolvers}/{p.totalAttempted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Solve comparison chart */}
        <div className="p-4 border border-rf-border rounded-xl bg-rf-dark/50">
          <h2 className="text-sm font-semibold text-rf-sage mb-3">
            Your Solve Time vs Average
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={myAnalytics.problemBreakdown.filter((p: any) => p.solveTime !== null)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#3a3a38" />
                <XAxis dataKey="label" stroke="#6A6A67" fontSize={12} />
                <YAxis stroke="#6A6A67" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1c1c1b",
                    border: "1px solid #3a3a38",
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="solveTime" fill="#C1C1A9" name="Your Time (min)" />
                <Bar dataKey="avgSolveTime" fill="#3f3f46" name="Avg Time (min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </>
  );
}
