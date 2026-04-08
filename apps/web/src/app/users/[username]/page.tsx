'use client';
import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Navbar } from '@/components/layout/Navbar';
import { api } from '@/lib/api';
import { LANGUAGE_DISPLAY } from '@rankforge/shared';

type Tab = 'recent' | 'contests' | 'skills';

const DIFF_COLORS: Record<string, string> = {
  EASY: '#10b981',
  MEDIUM: '#f59e0b',
  HARD: '#f97316',
  EXPERT: '#ef4444',
};

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [tab, setTab] = useState<Tab>('recent');

  const { data, isLoading } = useQuery({
    queryKey: ['profileStats', username],
    queryFn: () => api.get<any>(`/users/${username}/stats`),
    enabled: !!username,
  });

  const { data: ratings } = useQuery({
    queryKey: ['userRatings', username],
    queryFn: () => api.get<any[]>(`/users/${username}/ratings`),
    enabled: !!username,
  });

  const { data: contests } = useQuery({
    queryKey: ['userContests', username],
    queryFn: () => api.get<any[]>(`/users/${username}/contests`),
    enabled: !!username,
  });

  // Heatmap calculation
  const heatmapData = useMemo(() => {
    if (!data?.stats?.heatmap) return [];
    const days: { date: string; count: number; level: number }[] = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const count = data.stats.heatmap[key] || 0;
      const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4;
      days.push({ date: key, count, level });
    }
    return days;
  }, [data]);

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

  if (!data) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">User not found.</div>
        </div>
      </>
    );
  }

  const { user, stats } = data;
  const ratingColor =
    (user.profile?.currentRating ?? 1200) >= 2000 ? 'text-red-400' :
    (user.profile?.currentRating ?? 1200) >= 1600 ? 'text-purple-400' :
    (user.profile?.currentRating ?? 1200) >= 1400 ? 'text-cyan-400' :
    (user.profile?.currentRating ?? 1200) >= 1200 ? 'text-emerald-400' : 'text-zinc-400';

  const totalSolvable = stats.totalProblems || 1;
  const solvePercent = Math.round((stats.totalSolved / totalSolvable) * 100);

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

          {/* ── LEFT SIDEBAR ── */}
          <div className="space-y-4">
            {/* Avatar & Name */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-2xl font-bold text-zinc-400 shrink-0">
                {(user.profile?.displayName || user.username).charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-100">
                  {user.profile?.displayName || user.username}
                </h1>
                <p className="text-sm text-zinc-500">{user.username}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-zinc-500">Rank</span>
                  <span className={`text-sm font-bold ${ratingColor}`}>
                    {user.profile?.currentRating ?? 1200}
                  </span>
                </div>
              </div>
            </div>

            {user.profile?.bio && (
              <p className="text-sm text-zinc-400">{user.profile.bio}</p>
            )}

            {/* Community Stats */}
            <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 p-4">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Stats</h3>
              <div className="space-y-2.5">
                <StatRow label="Rating" value={String(user.profile?.currentRating ?? 1200)} color={ratingColor} />
                <StatRow label="Max Rating" value={String(user.profile?.maxRating ?? 1200)} />
                <StatRow label="Contests" value={String(user.profile?.contestCount ?? 0)} />
                <StatRow label="Problems Solved" value={String(stats.totalSolved)} color="text-emerald-400" />
              </div>
            </div>

            {/* Languages */}
            {stats.languages.length > 0 && (
              <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 p-4">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Languages</h3>
                <div className="space-y-2">
                  {stats.languages.map((l: any) => (
                    <div key={l.language} className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-300 rounded">
                        {(LANGUAGE_DISPLAY as any)[l.language] || l.language}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {l.count} problems solved
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {stats.skills.length > 0 && (
              <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 p-4">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Skills</h3>
                <div className="space-y-1.5">
                  {stats.skills.slice(0, 8).map((s: any) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 w-28 truncate">{s.name}</span>
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, (s.count / (stats.skills[0]?.count || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-600 w-6 text-right">x{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Badges */}
            {stats.badges.length > 0 && (
              <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 p-4">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {stats.badges.map((b: any) => (
                    <span
                      key={b.name}
                      title={b.description}
                      className="px-2 py-1 text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-800 rounded"
                    >
                      {b.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="space-y-4">

            {/* Solved Progress Donut */}
            <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 p-5">
              <div className="flex items-center gap-8">
                {/* Donut */}
                <div className="relative w-32 h-32 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none" stroke="#10b981"
                      strokeWidth="3" strokeDasharray={`${solvePercent} ${100 - solvePercent}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-zinc-100">{stats.totalSolved}</span>
                    <span className="text-[10px] text-zinc-500">/{stats.totalProblems} Solved</span>
                  </div>
                </div>

                {/* Difficulty Breakdown */}
                <div className="flex-1 grid grid-cols-2 gap-3">
                  {['EASY', 'MEDIUM', 'HARD', 'EXPERT'].map((d) => (
                    <div key={d} className="flex items-center justify-between px-3 py-2 border border-zinc-800 rounded-lg">
                      <span className="text-xs font-medium" style={{ color: DIFF_COLORS[d] }}>
                        {d.charAt(0) + d.slice(1).toLowerCase()}
                      </span>
                      <span className="text-xs text-zinc-300">
                        {stats.solvedByDifficulty[d] || 0}
                        <span className="text-zinc-600">/{stats.totalByDifficulty[d] || 0}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submission Heatmap */}
            <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-zinc-300">
                  <span className="text-zinc-100 font-bold">{stats.totalSubmissions}</span>{' '}
                  submissions in the past one year
                </h3>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span>Total active days: <span className="text-zinc-300">{stats.activeDays}</span></span>
                  <span>Max streak: <span className="text-zinc-300">{stats.maxStreak}</span></span>
                </div>
              </div>

              {/* Heatmap Grid */}
              <div className="overflow-x-auto">
                <div className="flex gap-[3px]" style={{ minWidth: '750px' }}>
                  {Array.from({ length: 53 }, (_, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-[3px]">
                      {Array.from({ length: 7 }, (_, dayIdx) => {
                        const idx = weekIdx * 7 + dayIdx;
                        const cell = heatmapData[idx];
                        if (!cell) return <div key={dayIdx} className="w-[11px] h-[11px]" />;
                        const colors = ['bg-zinc-800', 'bg-emerald-900', 'bg-emerald-700', 'bg-emerald-500', 'bg-emerald-400'];
                        return (
                          <div
                            key={dayIdx}
                            title={`${cell.date}: ${cell.count} submissions`}
                            className={`w-[11px] h-[11px] rounded-[2px] ${colors[cell.level]}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-500 justify-end">
                <span>Less</span>
                <div className="w-[11px] h-[11px] rounded-[2px] bg-zinc-800" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-900" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-700" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-500" />
                <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-400" />
                <span>More</span>
              </div>
            </div>

            {/* Rating Graph */}
            {ratings && ratings.length > 0 && (
              <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 p-5">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Rating History</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ratings}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis
                        dataKey="date" stroke="#71717a" fontSize={10}
                        tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      />
                      <YAxis stroke="#71717a" fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px' }}
                        labelFormatter={(v) => new Date(v).toLocaleDateString()}
                      />
                      <Line type="monotone" dataKey="newRating" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} name="Rating" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Tabs: Recent AC / Contests / Skills */}
            <div className="border border-zinc-800 rounded-xl bg-zinc-900/50">
              <div className="flex border-b border-zinc-800 px-4">
                {([['recent', 'Recent AC'], ['contests', 'Contests'], ['skills', 'Skills']] as [Tab, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      tab === key
                        ? 'text-emerald-400 border-b-2 border-emerald-400'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {tab === 'recent' && (
                  <div className="space-y-1">
                    {stats.recentAC.length === 0 ? (
                      <p className="text-sm text-zinc-500">No solved problems yet.</p>
                    ) : (
                      stats.recentAC.map((p: any) => (
                        <div key={p.slug} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                          <Link
                            href={`/problems/${p.slug}`}
                            className="text-sm text-zinc-200 hover:text-emerald-400 transition-colors"
                          >
                            {p.title}
                          </Link>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium" style={{ color: DIFF_COLORS[p.difficulty] }}>
                              {p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase()}
                            </span>
                            <span className="text-xs text-zinc-600">
                              {timeAgo(p.solvedAt)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {tab === 'contests' && (
                  <div className="space-y-1">
                    {!contests?.length ? (
                      <p className="text-sm text-zinc-500">No contest history.</p>
                    ) : (
                      contests.map((c: any) => (
                        <div key={c.contestId} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                          <Link
                            href={`/contests/${c.slug}`}
                            className="text-sm text-zinc-200 hover:text-emerald-400 transition-colors"
                          >
                            {c.title}
                          </Link>
                          <div className="flex items-center gap-4">
                            {c.rank && <span className="text-xs text-zinc-400">#{c.rank}</span>}
                            {c.ratingChange !== null && (
                              <span className={`text-xs font-bold ${c.ratingChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {c.ratingChange >= 0 ? '+' : ''}{c.ratingChange}
                              </span>
                            )}
                            <span className="text-xs text-zinc-600">
                              {new Date(c.startTime).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {tab === 'skills' && (
                  <div className="space-y-2">
                    {stats.skills.length === 0 ? (
                      <p className="text-sm text-zinc-500">No skills data yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {stats.skills.map((s: any) => (
                          <span
                            key={s.name}
                            className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700"
                          >
                            {s.name} <span className="text-zinc-500 ml-1">x{s.count}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-sm font-bold ${color || 'text-zinc-300'}`}>{value}</span>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
