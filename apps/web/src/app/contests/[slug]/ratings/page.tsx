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
          <div className="text-rf-gray">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Rating Changes</h1>
          <Link
            href={`/contests/${slug}`}
            className="text-sm text-rf-gray hover:text-rf-pink transition-colors"
          >
            &larr; {contest.title}
          </Link>
        </div>

        {!changes?.length ? (
          <div className="text-center py-12 text-rf-gray">
            Ratings have not been calculated for this contest yet.
          </div>
        ) : (
          <div className="border border-rf-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-rf-border bg-rf-dark/50">
                  <th className="text-center px-4 py-3 text-xs font-medium text-rf-gray uppercase w-14">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-rf-gray uppercase">User</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-rf-gray uppercase w-28">Old Rating</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-rf-gray uppercase w-28">New Rating</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-rf-gray uppercase w-24">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rf-border">
                {changes.map((c: any) => (
                  <tr key={c.userId} className="hover:bg-rf-dark/50 transition-colors">
                    <td className="text-center px-4 py-3 text-sm font-bold text-rf-pink">
                      {c.rank}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/users/${c.username}`}
                        className="text-sm font-medium text-white hover:text-rf-pink transition-colors"
                      >
                        {c.displayName || c.username}
                      </Link>
                      <span className="text-xs text-rf-gray ml-1.5">@{c.username}</span>
                    </td>
                    <td className="text-center px-4 py-3 text-sm text-rf-gray">
                      {c.oldRating}
                    </td>
                    <td className="text-center px-4 py-3 text-sm font-medium text-white">
                      {c.newRating}
                    </td>
                    <td className="text-center px-4 py-3">
                      <span
                        className={`text-sm font-bold ${
                          c.change > 0
                            ? 'text-rf-pink'
                            : c.change < 0
                              ? 'text-red-400'
                              : 'text-rf-gray'
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
