'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const VERDICT_COLORS: Record<string, string> = {
  ACCEPTED: '#B0B0B0', WRONG_ANSWER: '#ef4444', TIME_LIMIT_EXCEEDED: '#f59e0b',
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
      <main className="flex-1 w-full px-6 lg:px-10 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>

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
              <div className="p-4 border border-rf-border rounded-xl bg-rf-dark/50 mb-6">
                <h2 className="text-sm font-semibold text-orange-400 mb-3">Verdict Distribution</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.verdictBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                      <XAxis dataKey="verdict" stroke="#3a3a42" fontSize={9} angle={-30} textAnchor="end" height={60} />
                      <YAxis stroke="#3a3a42" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "#111113", border: "1px solid #1f1f23", borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="count">
                        {stats.verdictBreakdown.map((entry: any, idx: number) => (
                          <Cell key={idx} fill={VERDICT_COLORS[entry.verdict] || "#6A6A67"} />
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
        <div className="border border-rf-border rounded-xl bg-rf-dark/50 p-4">
          <h2 className="text-sm font-semibold text-orange-400 mb-3">User Management</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setUserPage(1); }}
            placeholder="Search users..."
            className="w-full max-w-md px-3 py-2 mb-4 bg-rf-dark border border-rf-iron rounded-lg text-white text-sm placeholder-rf-iron focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          {users?.users && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-rf-border">
                    <th className="text-left px-3 py-2 text-xs font-medium text-rf-gray uppercase">Username</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-rf-gray uppercase">Email</th>
                    <th className="text-center px-3 py-2 text-xs font-medium text-rf-gray uppercase">Role</th>
                    <th className="text-center px-3 py-2 text-xs font-medium text-rf-gray uppercase">Rating</th>
                    <th className="text-center px-3 py-2 text-xs font-medium text-rf-gray uppercase">Solved</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-rf-gray uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rf-border">
                  {users.users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-rf-dark/50">
                      <td className="px-3 py-2 text-sm text-white">{u.username}</td>
                      <td className="px-3 py-2 text-sm text-rf-gray">{u.email}</td>
                      <td className="text-center px-3 py-2">
                        <span className="px-2 py-0.5 text-xs bg-rf-border text-orange-400 rounded">{u.role}</span>
                      </td>
                      <td className="text-center px-3 py-2 text-sm text-orange-400">{u.rating}</td>
                      <td className="text-center px-3 py-2 text-sm text-orange-400">{u.solvedCount}</td>
                      <td className="text-right px-3 py-2 text-xs text-rf-gray">
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
                className="px-3 py-1 text-xs border border-rf-iron rounded text-orange-400 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-xs text-rf-gray">{users.page}/{users.totalPages}</span>
              <button
                onClick={() => setUserPage((p) => Math.min(users.totalPages, p + 1))}
                disabled={userPage === users.totalPages}
                className="px-3 py-1 text-xs border border-rf-iron rounded text-orange-400 disabled:opacity-50"
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
    <div className="p-3 rounded-xl border border-rf-border bg-rf-dark/50">
      <p className="text-xs text-rf-gray">{title}</p>
      <p className={`mt-1 text-xl font-bold ${accent ? 'text-orange-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
