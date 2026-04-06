'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Navbar } from '@/components/layout/Navbar';
import { VerdictBadge } from '@/components/submissions/VerdictBadge';
import { DifficultyBadge } from '@/components/problems/ProblemFilters';
import {
  useUserProfile,
  useUserRatingHistory,
  useUserContestHistory,
  useUserSolvedProblems,
} from '@/hooks/use-api';

type Tab = 'overview' | 'contests' | 'solved';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [tab, setTab] = useState<Tab>('overview');

  const { data: user, isLoading } = useUserProfile(username);
  const { data: ratings } = useUserRatingHistory(username);
  const { data: contests } = useUserContestHistory(username);
  const { data: solved } = useUserSolvedProblems(username);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Loading profile...</div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">User not found.</div>
        </div>
      </>
    );
  }

  const ratingColor =
    (user.profile?.currentRating ?? 1200) >= 2000
      ? 'text-red-400'
      : (user.profile?.currentRating ?? 1200) >= 1600
        ? 'text-purple-400'
        : (user.profile?.currentRating ?? 1200) >= 1400
          ? 'text-cyan-400'
          : 'text-zinc-300';

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="flex items-start gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-2xl font-bold text-zinc-400">
            {(user.profile?.displayName || user.username).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-zinc-100">
              {user.profile?.displayName || user.username}
            </h1>
            <p className="text-sm text-zinc-400">@{user.username}</p>
            {user.profile?.bio && (
              <p className="text-sm text-zinc-400 mt-1">{user.profile.bio}</p>
            )}
            <div className="flex items-center gap-6 mt-3">
              <div>
                <span className="text-xs text-zinc-500">Rating</span>
                <div className={`text-lg font-bold ${ratingColor}`}>
                  {user.profile?.currentRating ?? 1200}
                </div>
              </div>
              <div>
                <span className="text-xs text-zinc-500">Max</span>
                <div className="text-lg font-bold text-zinc-300">
                  {user.profile?.maxRating ?? 1200}
                </div>
              </div>
              <div>
                <span className="text-xs text-zinc-500">Solved</span>
                <div className="text-lg font-bold text-emerald-400">
                  {user.profile?.solvedCount ?? 0}
                </div>
              </div>
              <div>
                <span className="text-xs text-zinc-500">Contests</span>
                <div className="text-lg font-bold text-zinc-300">
                  {user.profile?.contestCount ?? 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 mb-6">
          {(['overview', 'contests', 'solved'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Rating Graph */}
            {ratings && ratings.length > 0 && (
              <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/50">
                <h2 className="text-sm font-semibold text-zinc-300 mb-3">Rating History</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ratings}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis
                        dataKey="date"
                        stroke="#71717a"
                        fontSize={10}
                        tickFormatter={(v) =>
                          new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                        }
                      />
                      <YAxis stroke="#71717a" fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        labelFormatter={(v) => new Date(v).toLocaleDateString()}
                      />
                      <Line
                        type="monotone"
                        dataKey="newRating"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#10b981' }}
                        name="Rating"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recent Solved */}
            {solved && solved.length > 0 && (
              <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/50">
                <h2 className="text-sm font-semibold text-zinc-300 mb-3">
                  Recently Solved ({solved.length} total)
                </h2>
                <div className="space-y-1.5">
                  {solved.slice(0, 10).map((p: any) => (
                    <div key={p.problemId} className="flex items-center justify-between py-1.5">
                      <Link
                        href={`/problems/${p.slug}`}
                        className="text-sm text-zinc-200 hover:text-emerald-400 transition-colors"
                      >
                        {p.title}
                      </Link>
                      <div className="flex items-center gap-2">
                        <DifficultyBadge difficulty={p.difficulty} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'contests' && (
          <div>
            {!contests?.length ? (
              <div className="text-center py-8 text-zinc-500">No contest history.</div>
            ) : (
              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Contest</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-zinc-400 uppercase w-20">Rank</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-zinc-400 uppercase w-24">Rating Change</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-zinc-400 uppercase w-24">New Rating</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400 uppercase hidden sm:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {contests.map((c: any) => (
                      <tr key={c.contestId} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="px-4 py-3">
                          <Link
                            href={`/contests/${c.slug}`}
                            className="text-sm text-zinc-200 hover:text-emerald-400 transition-colors"
                          >
                            {c.title}
                          </Link>
                        </td>
                        <td className="text-center px-4 py-3 text-sm text-zinc-300">
                          {c.rank ?? '—'}
                        </td>
                        <td className="text-center px-4 py-3 text-sm">
                          {c.ratingChange !== null ? (
                            <span className={c.ratingChange >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {c.ratingChange >= 0 ? '+' : ''}{c.ratingChange}
                            </span>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </td>
                        <td className="text-center px-4 py-3 text-sm text-zinc-300">
                          {c.newRating ?? '—'}
                        </td>
                        <td className="text-right px-4 py-3 text-sm text-zinc-500 hidden sm:table-cell">
                          {new Date(c.startTime).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'solved' && (
          <div>
            {!solved?.length ? (
              <div className="text-center py-8 text-zinc-500">No solved problems yet.</div>
            ) : (
              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Problem</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase w-24">Difficulty</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase hidden md:table-cell">Tags</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400 uppercase hidden sm:table-cell">Solved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {solved.map((p: any) => (
                      <tr key={p.problemId} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="px-4 py-3">
                          <Link
                            href={`/problems/${p.slug}`}
                            className="text-sm text-zinc-200 hover:text-emerald-400 transition-colors"
                          >
                            {p.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <DifficultyBadge difficulty={p.difficulty} />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {p.tags.slice(0, 3).map((t: string) => (
                              <span key={t} className="px-1.5 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded">{t}</span>
                            ))}
                          </div>
                        </td>
                        <td className="text-right px-4 py-3 text-xs text-zinc-500 hidden sm:table-cell">
                          {new Date(p.solvedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
