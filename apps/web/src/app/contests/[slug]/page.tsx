'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { ContestStatusBadge } from '@/components/contests/ContestStatusBadge';
import { ContestTimer } from '@/components/contests/ContestTimer';
import { useContest, useRegisterContest } from '@/hooks/use-api';
import { useAuthStore } from '@/stores/auth-store';

export default function ContestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { isAuthenticated } = useAuthStore();
  const { data: contest, isLoading } = useContest(slug);
  const registerMutation = useRegisterContest();

  const handleRegister = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (contest) {
      await registerMutation.mutateAsync(contest.id);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Loading contest...</div>
        </div>
      </>
    );
  }

  if (!contest) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Contest not found.</div>
        </div>
      </>
    );
  }

  const isLive = ['LIVE', 'FROZEN'].includes(contest.status);
  const isEnded = ['ENDED', 'RESULTS_PUBLISHED'].includes(contest.status);
  const showProblems = isLive || isEnded || contest.isCreator;

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-zinc-100">{contest.title}</h1>
              <ContestStatusBadge status={contest.status} />
            </div>
            {contest.description && (
              <p className="text-sm text-zinc-400 mt-1 max-w-2xl">{contest.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-zinc-400">
              <span>
                {new Date(contest.startTime).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span>{contest.duration} minutes</span>
              <span>{contest.participantCount} participants</span>
              <span>{contest.problems.length} problems</span>
            </div>
          </div>

          <div className="text-right">
            <ContestTimer
              startTime={contest.startTime}
              endTime={contest.endTime}
              status={contest.status}
            />
            {!contest.isRegistered && !isEnded && (
              <button
                onClick={handleRegister}
                disabled={registerMutation.isPending}
                className="mt-3 px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {registerMutation.isPending ? 'Registering...' : 'Register'}
              </button>
            )}
            {contest.isRegistered && (
              <div className="mt-3 text-sm text-emerald-400">Registered</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Problems */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-200">Problems</h2>
              {(isLive || isEnded) && (
                <Link
                  href={`/contests/${slug}/leaderboard`}
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  View Leaderboard &rarr;
                </Link>
              )}
            </div>

            {!showProblems ? (
              <div className="p-6 border border-zinc-800 rounded-xl bg-zinc-900/50 text-center text-sm text-zinc-500">
                Problems will be visible when the contest starts.
              </div>
            ) : contest.problems.length === 0 ? (
              <div className="p-6 border border-zinc-800 rounded-xl bg-zinc-900/50 text-center text-sm text-zinc-500">
                No problems added yet.
              </div>
            ) : (
              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase w-16">
                        #
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">
                        Title
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400 uppercase w-24">
                        Points
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400 uppercase w-24">
                        Solved
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {contest.problems.map((p: any) => (
                      <tr key={p.label} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono font-bold text-emerald-400">
                          {p.label}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/problems/${p.slug}`}
                            className="text-sm text-zinc-200 hover:text-emerald-400 transition-colors"
                          >
                            {p.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-zinc-400">
                          {p.points}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-zinc-400">
                          {p.solvedCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Announcements */}
            <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 p-4">
              <h3 className="text-sm font-semibold text-zinc-200 mb-3">Announcements</h3>
              {contest.announcements.length === 0 ? (
                <p className="text-xs text-zinc-500">No announcements yet.</p>
              ) : (
                <div className="space-y-2">
                  {contest.announcements.map((a: any) => (
                    <div key={a.id} className="p-2 bg-zinc-800/50 rounded-lg">
                      <p className="text-sm text-zinc-300">{a.content}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {new Date(a.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contest Info */}
            <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 p-4">
              <h3 className="text-sm font-semibold text-zinc-200 mb-3">Contest Rules</h3>
              <div className="space-y-2 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Penalty per wrong submission</span>
                  <span className="text-zinc-300">{contest.penaltyTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration</span>
                  <span className="text-zinc-300">{contest.duration} min</span>
                </div>
                {contest.freezeTime && (
                  <div className="flex justify-between">
                    <span>Leaderboard freeze</span>
                    <span className="text-zinc-300">Last {contest.freezeTime} min</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Visibility</span>
                  <span className="text-zinc-300">{contest.isPublic ? 'Public' : 'Private'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
