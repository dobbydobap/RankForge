'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Navbar } from '@/components/layout/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-zinc-100">
          Welcome, {user.profile?.displayName || user.username}
        </h1>
        <p className="mt-1 text-zinc-400">
          Rating: {user.profile?.currentRating ?? 1200}
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard title="Problems Solved" value={user.profile?.solvedCount ?? 0} />
          <DashboardCard title="Contests Joined" value={user.profile?.contestCount ?? 0} />
          <DashboardCard title="Current Rating" value={user.profile?.currentRating ?? 1200} />
          <DashboardCard title="Max Rating" value={user.profile?.maxRating ?? 1200} />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/problems"
                className="block p-3 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors"
              >
                <span className="text-sm font-medium text-zinc-200">Practice Problems</span>
                <span className="block text-xs text-zinc-500 mt-0.5">Solve problems to improve your skills</span>
              </Link>
              <Link
                href="/contests"
                className="block p-3 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors"
              >
                <span className="text-sm font-medium text-zinc-200">View Contests</span>
                <span className="block text-xs text-zinc-500 mt-0.5">Join upcoming or browse past contests</span>
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Recent Submissions</h2>
            <p className="text-sm text-zinc-500">No submissions yet. Start solving problems!</p>
          </div>
        </div>
      </main>
    </>
  );
}

function DashboardCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-100">{value}</p>
    </div>
  );
}
