'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { TemporalSlider } from '@/components/leaderboard/TemporalSlider';
import { useContest, useLeaderboardAtTime, useContestAnalytics } from '@/hooks/use-api';
import { ActivityChart } from '@/components/leaderboard/ActivityChart';

export default function TemporalLeaderboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: contest } = useContest(slug);
  const [minute, setMinute] = useState(0);

  const { data: standings, isLoading } = useLeaderboardAtTime(
    contest?.id || '',
    minute,
  );
  const { data: analytics } = useContestAnalytics(contest?.id || '');

  if (!contest) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-rf-gray">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-rf-cream">Temporal Leaderboard</h1>
            <div className="flex items-center gap-3 mt-1">
              <Link
                href={`/contests/${slug}`}
                className="text-sm text-rf-gray hover:text-rf-sage transition-colors"
              >
                {contest.title}
              </Link>
              <span className="text-rf-iron">|</span>
              <Link
                href={`/contests/${slug}/leaderboard`}
                className="text-sm text-rf-gray hover:text-rf-sage transition-colors"
              >
                Current Standings
              </Link>
              <span className="text-rf-iron">|</span>
              <Link
                href={`/contests/${slug}/leaderboard/replay`}
                className="text-sm text-rf-sage hover:text-rf-cream transition-colors"
              >
                Replay Mode
              </Link>
            </div>
          </div>
        </div>

        {/* Time Slider */}
        <div className="p-4 border border-rf-border rounded-xl bg-rf-dark/50 mb-6">
          <div className="text-xs text-rf-muted mb-2">
            Scrub through the contest timeline to see how standings evolved
          </div>
          <TemporalSlider
            duration={contest.duration}
            value={minute}
            onChange={setMinute}
          />
        </div>

        {/* Activity Chart */}
        {analytics?.activityTimeline && (
          <div className="p-4 border border-rf-border rounded-xl bg-rf-dark/50 mb-6">
            <h2 className="text-sm font-semibold text-rf-sage mb-3">
              Submission Activity Over Time
            </h2>
            <ActivityChart data={analytics.activityTimeline} />
            {analytics.peakActivity && (
              <div className="mt-2 text-xs text-rf-muted">
                Peak activity: minutes {analytics.peakActivity.startMinute}–{analytics.peakActivity.endMinute} ({analytics.peakActivity.submissions} submissions)
              </div>
            )}
          </div>
        )}

        {/* Standings at time T */}
        {isLoading ? (
          <div className="text-center py-8 text-rf-muted">Loading standings...</div>
        ) : !standings?.entries?.length ? (
          <div className="text-center py-8 text-rf-muted">
            No activity at minute {minute}.
          </div>
        ) : (
          <div className="border border-rf-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-rf-border bg-rf-dark/50">
                  <th className="text-center px-3 py-3 text-xs font-medium text-rf-gray uppercase w-14">#</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-rf-gray uppercase">User</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-rf-gray uppercase w-20">Score</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-rf-gray uppercase w-20">Penalty</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-rf-gray uppercase w-20">Solved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rf-border">
                {standings.entries
                  .filter((e: any) => e.totalScore > 0 || e.solvedCount > 0)
                  .map((entry: any) => (
                    <tr key={entry.userId} className="hover:bg-rf-dark/50 transition-colors">
                      <td className="text-center px-3 py-3 text-sm font-bold text-rf-sage">
                        {entry.rank}
                      </td>
                      <td className="px-3 py-3 text-sm text-rf-cream">
                        {entry.displayName || entry.username}
                      </td>
                      <td className="text-center px-3 py-3 text-sm font-bold text-rf-cream">
                        {entry.totalScore}
                      </td>
                      <td className="text-center px-3 py-3 text-sm text-rf-gray">
                        {entry.penalty}
                      </td>
                      <td className="text-center px-3 py-3 text-sm text-rf-gray">
                        {entry.solvedCount}
                      </td>
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
