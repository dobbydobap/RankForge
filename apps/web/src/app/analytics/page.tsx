'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, SectionLabel, StatTile } from '@/components/layout/Editorial';

export default function GrowthAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  const { data: growth, isLoading } = useQuery({
    queryKey: ['growth'],
    queryFn: () => api.get<any>('/analytics/growth/me', { token: token ?? undefined }),
    enabled: !!token,
  });

  if (authLoading || isLoading) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center">
          <div className="label-mono text-rf-gray animate-pulse">Loading…</div>
        </div>
      </>
    );
  }

  if (!growth) return null;

  // Prepare topic radar data (top 8)
  const radarData = growth.topicMastery.slice(0, 8).map((t: any) => ({
    topic: t.topic,
    count: t.count,
  }));

  // Prepare heatmap data (last 30 days)
  const heatmapDays: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    heatmapDays.push({ date: key, count: growth.dailyActivity[key] || 0 });
  }

  return (
    <>
      <main className="flex-1 w-full max-w-6xl px-6 lg:px-10 py-10">
        <PageHeader eyebrow="Growth / Insights" title="Analytics" />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--c-border)] border border-[var(--c-border)] mb-12">
          <StatTile label="Rating" value={growth.currentRating} emphasis />
          <StatTile label="Max Rating" value={growth.maxRating} />
          <StatTile label="Problems Solved" value={growth.solvedCount} />
          <StatTile label="Contests" value={growth.contestCount} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Rating History */}
          {growth.ratingHistory.length > 0 && (
            <div className="p-4 border border-[var(--c-border)] bg-[var(--c-surface)]">
              <h2 className="label-mono text-[var(--c-fg)] mb-4">Rating Over Time</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growth.ratingHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                    <XAxis
                      dataKey="date"
                      stroke="#3a3a42"
                      fontSize={10}
                      tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#3a3a42" fontSize={10} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 0, fontSize: '12px', color: 'var(--c-fg)' }}
                    />
                    <Line type="monotone" dataKey="newRating" stroke="#8a8a98" strokeWidth={2} dot={{ r: 3 }} name="Rating" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Topic Mastery Radar */}
          {radarData.length > 0 && (
            <div className="p-4 border border-[var(--c-border)] bg-[var(--c-surface)]">
              <h2 className="label-mono text-[var(--c-fg)] mb-4">Topic Mastery</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1f1f23" />
                    <PolarAngleAxis dataKey="topic" stroke="#3a3a42" fontSize={10} />
                    <Radar dataKey="count" stroke="#8a8a98" fill="#8a8a98" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Activity Heatmap (simple version) */}
        <div className="p-4 border border-[var(--c-border)] bg-[var(--c-surface)] mb-6">
          <h2 className="label-mono text-[var(--c-fg)] mb-4">
            Solve Activity (Last 30 Days)
          </h2>
          <div className="flex gap-1 flex-wrap">
            {heatmapDays.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count} solved`}
                className={`w-6 h-6 rounded-sm ${
                  d.count === 0
                    ? 'bg-[var(--c-surface-2)]'
                    : d.count <= 2
                      ? 'bg-[var(--c-border-2)]'
                      : d.count <= 5
                        ? 'bg-orange-800'
                        : 'bg-orange-500'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-rf-gray">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-[var(--c-surface-2)]" />
            <div className="w-3 h-3 rounded-sm bg-[var(--c-border-2)]" />
            <div className="w-3 h-3 rounded-sm bg-orange-800" />
            <div className="w-3 h-3 rounded-sm bg-orange-500" />
            <span>More</span>
          </div>
        </div>

        {/* Top topics table */}
        {growth.topicMastery.length > 0 && (
          <div className="p-4 border border-[var(--c-border)] bg-[var(--c-surface)]">
            <h2 className="label-mono text-[var(--c-fg)] mb-4">Strongest Topics</h2>
            <div className="space-y-2">
              {growth.topicMastery.map((t: any) => (
                <div key={t.topic} className="flex items-center gap-3">
                  <span className="text-sm text-[var(--c-fg)] w-32 truncate">{t.topic}</span>
                  <div className="flex-1 h-1.5 bg-[var(--c-surface-3)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--c-fg)]"
                      style={{
                        width: `${Math.min(100, (t.count / (growth.topicMastery[0]?.count || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-rf-gray w-8 text-right">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
