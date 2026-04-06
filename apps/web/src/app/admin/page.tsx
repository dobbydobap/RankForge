'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const VERDICT_COLORS: Record<string, string> = {
  ACCEPTED: '#10b981', WRONG_ANSWER: '#ef4444', TIME_LIMIT_EXCEEDED: '#f59e0b',
  RUNTIME_ERROR: '#8b5cf6', COMPILATION_ERROR: '#ec4899',
  PENDING: '#71717a', JUDGING: '#3b82f6', MEMORY_LIMIT_EXCEEDED: '#f97316',
};

export default function AdminPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [search, setSearch] = useState('');
  const [userPage, setUserPage] = useState(1);

  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.get<any>('/admin/stats', { token: token ?? undefined }),
    enabled: !!token,
  });

  const { data: users } = useQuery({
    queryKey: ['adminUsers', search, userPage],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', String(userPage));
      return api.get<any>(`/admin/users?${params}`, { token: token ?? undefined });
    },
    enabled: !!token,
  });

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-6">Admin Dashboard</h1>

        {/* System Stats */}
        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <StatCard title="Users" value={stats.users} />
              <StatCard title="Problems" value={stats.problems} />
              <StatCard title="Contests" value={stats.contests} />
              <StatCard title="Submissions" value={stats.submissions} />
              <StatCard title="Live Contests" value={stats.liveContests} accent />
              <StatCard title="24h Submissions" value={stats.submissionsLast24h} />
            </div>

            {/* Verdict Distribution */}
            {stats.verdictBreakdown?.length > 0 && (
              <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/50 mb-6">
                <h2 className="text-sm font-semibold text-zinc-300 mb-3">Verdict Distribution</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.verdictBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="verdict" stroke="#71717a" fontSize={9} angle={-30} textAnchor="end" height={60} />
                      <YAxis stroke="#71717a" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="count">
                        {stats.verdictBreakdown.map((entry: any, idx: number) => (
                          <Cell key={idx} fill={VERDICT_COLORS[entry.verdict] || '#71717a'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        {/* User Management */}
        <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 p-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">User Management</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setUserPage(1); }}
            placeholder="Search users..."
            className="w-full max-w-md px-3 py-2 mb-4 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          {users?.users && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-3 py-2 text-xs font-medium text-zinc-400 uppercase">Username</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-zinc-400 uppercase">Email</th>
                    <th className="text-center px-3 py-2 text-xs font-medium text-zinc-400 uppercase">Role</th>
                    <th className="text-center px-3 py-2 text-xs font-medium text-zinc-400 uppercase">Rating</th>
                    <th className="text-center px-3 py-2 text-xs font-medium text-zinc-400 uppercase">Solved</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-zinc-400 uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {users.users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-zinc-900/50">
                      <td className="px-3 py-2 text-sm text-zinc-200">{u.username}</td>
                      <td className="px-3 py-2 text-sm text-zinc-400">{u.email}</td>
                      <td className="text-center px-3 py-2">
                        <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-300 rounded">{u.role}</span>
                      </td>
                      <td className="text-center px-3 py-2 text-sm text-zinc-300">{u.rating}</td>
                      <td className="text-center px-3 py-2 text-sm text-zinc-300">{u.solvedCount}</td>
                      <td className="text-right px-3 py-2 text-xs text-zinc-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {users && users.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                disabled={userPage === 1}
                className="px-3 py-1 text-xs border border-zinc-700 rounded text-zinc-300 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-xs text-zinc-400">{users.page}/{users.totalPages}</span>
              <button
                onClick={() => setUserPage((p) => Math.min(users.totalPages, p + 1))}
                disabled={userPage === users.totalPages}
                className="px-3 py-1 text-xs border border-zinc-700 rounded text-zinc-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function StatCard({ title, value, accent }: { title: string; value: number; accent?: boolean }) {
  return (
    <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/50">
      <p className="text-xs text-zinc-500">{title}</p>
      <p className={`mt-1 text-xl font-bold ${accent ? 'text-emerald-400' : 'text-zinc-100'}`}>{value}</p>
    </div>
  );
}
