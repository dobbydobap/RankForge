'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

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
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-rf-gray">Loading analytics...</div>
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
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Growth Analytics</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Rating" value={growth.currentRating} accent />
          <StatCard title="Max Rating" value={growth.maxRating} />
          <StatCard title="Problems Solved" value={growth.solvedCount} />
          <StatCard title="Contests" value={growth.contestCount} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Rating History */}
          {growth.ratingHistory.length > 0 && (
            <div className="p-4 border border-rf-border rounded-xl bg-rf-dark/50">
              <h2 className="text-sm font-semibold text-rf-pink mb-3">Rating Over Time</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growth.ratingHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
                    <XAxis
                      dataKey="date"
                      stroke="#666666"
                      fontSize={10}
                      tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#666666" fontSize={10} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #444444", borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="newRating" stroke="#E0E0E0" strokeWidth={2} dot={{ r: 3 }} name="Rating" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Topic Mastery Radar */}
          {radarData.length > 0 && (
            <div className="p-4 border border-rf-border rounded-xl bg-rf-dark/50">
              <h2 className="text-sm font-semibold text-rf-pink mb-3">Topic Mastery</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#444444" />
                    <PolarAngleAxis dataKey="topic" stroke="#666666" fontSize={10} />
                    <Radar dataKey="count" stroke="#E0E0E0" fill="#E0E0E0" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Activity Heatmap (simple version) */}
        <div className="p-4 border border-rf-border rounded-xl bg-rf-dark/50 mb-6">
          <h2 className="text-sm font-semibold text-rf-pink mb-3">
            Solve Activity (Last 30 Days)
          </h2>
          <div className="flex gap-1 flex-wrap">
            {heatmapDays.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count} solved`}
                className={`w-6 h-6 rounded-sm ${
                  d.count === 0
                    ? 'bg-rf-border'
                    : d.count <= 2
                      ? 'bg-rf-dark'
                      : d.count <= 5
                        ? 'bg-rf-iron'
                        : 'bg-rf-accent-hover'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-rf-gray">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-rf-border" />
            <div className="w-3 h-3 rounded-sm bg-rf-dark" />
            <div className="w-3 h-3 rounded-sm bg-rf-iron" />
            <div className="w-3 h-3 rounded-sm bg-rf-accent-hover" />
            <span>More</span>
          </div>
        </div>

        {/* Top topics table */}
        {growth.topicMastery.length > 0 && (
          <div className="p-4 border border-rf-border rounded-xl bg-rf-dark/50">
            <h2 className="text-sm font-semibold text-rf-pink mb-3">Strongest Topics</h2>
            <div className="space-y-2">
              {growth.topicMastery.map((t: any) => (
                <div key={t.topic} className="flex items-center gap-3">
                  <span className="text-sm text-rf-pink w-32">{t.topic}</span>
                  <div className="flex-1 h-2 bg-rf-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rf-accent-hover rounded-full"
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

function StatCard({ title, value, accent }: { title: string; value: number; accent?: boolean }) {
  return (
    <div className="p-4 rounded-xl border border-rf-border bg-rf-dark/50">
      <p className="text-xs text-rf-gray">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? 'text-rf-pink' : 'text-white'}`}>{value}</p>
    </div>
  );
}
