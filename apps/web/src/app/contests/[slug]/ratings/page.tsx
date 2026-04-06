'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { useContest, useRatingChanges } from '@/hooks/use-api';

export default function ContestRatingsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: contest } = useContest(slug);
  const { data: changes, isLoading } = useRatingChanges(contest?.id || '');

  if (!contest || isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">Rating Changes</h1>
          <Link
            href={`/contests/${slug}`}
            className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            &larr; {contest.title}
          </Link>
        </div>

        {!changes?.length ? (
          <div className="text-center py-12 text-zinc-500">
            Ratings have not been calculated for this contest yet.
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-center px-4 py-3 text-xs font-medium text-zinc-400 uppercase w-14">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase">User</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-zinc-400 uppercase w-28">Old Rating</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-zinc-400 uppercase w-28">New Rating</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-zinc-400 uppercase w-24">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {changes.map((c: any) => (
                  <tr key={c.userId} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="text-center px-4 py-3 text-sm font-bold text-zinc-300">
                      {c.rank}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/users/${c.username}`}
                        className="text-sm font-medium text-zinc-200 hover:text-emerald-400 transition-colors"
                      >
                        {c.displayName || c.username}
                      </Link>
                      <span className="text-xs text-zinc-500 ml-1.5">@{c.username}</span>
                    </td>
                    <td className="text-center px-4 py-3 text-sm text-zinc-400">
                      {c.oldRating}
                    </td>
                    <td className="text-center px-4 py-3 text-sm font-medium text-zinc-200">
                      {c.newRating}
                    </td>
                    <td className="text-center px-4 py-3">
                      <span
                        className={`text-sm font-bold ${
                          c.change > 0
                            ? 'text-emerald-400'
                            : c.change < 0
                              ? 'text-red-400'
                              : 'text-zinc-400'
                        }`}
                      >
                        {c.change > 0 ? '+' : ''}{c.change}
                      </span>
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
