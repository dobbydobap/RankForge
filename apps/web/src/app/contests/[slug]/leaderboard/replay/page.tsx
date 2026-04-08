'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { TemporalSlider } from '@/components/leaderboard/TemporalSlider';
import { RankGraph } from '@/components/leaderboard/RankGraph';
import { useContest, useReplayData } from '@/hooks/use-api';

export default function ReplayPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: contest } = useContest(slug);
  const { data: replay, isLoading } = useReplayData(contest?.id || '');

  const [frameIdx, setFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const frames = replay?.frames || [];
  const currentFrame = frames[frameIdx];

  // Playback logic
  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      intervalRef.current = setInterval(() => {
        setFrameIdx((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, frames.length]);

  const handleSliderChange = useCallback(
    (minute: number) => {
      // Find the closest frame to this minute
      const idx = frames.findIndex((f: any) => f.minute >= minute);
      setFrameIdx(idx >= 0 ? idx : frames.length - 1);
    },
    [frames],
  );

  const togglePlay = useCallback(() => {
    if (frameIdx >= frames.length - 1) {
      setFrameIdx(0);
    }
    setIsPlaying((p) => !p);
  }, [frameIdx, frames.length]);

  if (!contest || isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">
            {isLoading ? 'Loading replay data...' : 'Loading...'}
          </div>
        </div>
      </>
    );
  }

  if (!replay || frames.length === 0) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">No replay data available for this contest.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Contest Replay</h1>
            <div className="flex items-center gap-3 mt-1">
              <Link
                href={`/contests/${slug}`}
                className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                {contest.title}
              </Link>
              <span className="text-zinc-600">|</span>
              <Link
                href={`/contests/${slug}/leaderboard/temporal`}
                className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                Temporal View
              </Link>
            </div>
          </div>

          {/* Speed controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Speed:</span>
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 text-xs rounded ${
                  speed === s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                } transition-colors`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Timeline slider */}
        <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/50 mb-6">
          <TemporalSlider
            duration={replay.duration}
            value={currentFrame?.minute || 0}
            onChange={handleSliderChange}
            isPlaying={isPlaying}
            onPlayToggle={togglePlay}
          />
        </div>

        {/* Rank Graph */}
        <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/50 mb-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">
            Rank Movement Over Time
          </h2>
          <RankGraph
            frames={frames.slice(0, frameIdx + 1)}
            users={replay.users}
            mode="rank"
          />
        </div>

        {/* Current standings at this frame */}
        {currentFrame && (
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800">
              <span className="text-xs text-zinc-500">
                Standings at minute {currentFrame.minute}
              </span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/30">
                  <th className="text-center px-3 py-2 text-xs font-medium text-zinc-400 uppercase w-14">#</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-zinc-400 uppercase">User</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-zinc-400 uppercase w-20">Score</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-zinc-400 uppercase w-20">Penalty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {currentFrame.standings
                  .filter((s: any) => s.score > 0)
                  .map((entry: any, idx: number) => {
                    // Check rank change from previous frame
                    const prevFrame = frameIdx > 0 ? frames[frameIdx - 1] : null;
                    const prevRank = prevFrame?.standings.find(
                      (s: any) => s.userId === entry.userId,
                    )?.rank;
                    const rankChange = prevRank ? prevRank - entry.rank : 0;

                    return (
                      <tr
                        key={entry.userId}
                        className={`transition-all duration-300 ${
                          rankChange > 0
                            ? 'bg-emerald-900/10'
                            : rankChange < 0
                              ? 'bg-red-900/10'
                              : ''
                        }`}
                      >
                        <td className="text-center px-3 py-2.5 text-sm font-bold text-zinc-300">
                          <div className="flex items-center justify-center gap-1">
                            <span>{entry.rank}</span>
                            {rankChange > 0 && (
                              <span className="text-xs text-emerald-400">+{rankChange}</span>
                            )}
                            {rankChange < 0 && (
                              <span className="text-xs text-red-400">{rankChange}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-zinc-200">
                          {entry.displayName || entry.username}
                        </td>
                        <td className="text-center px-3 py-2.5 text-sm font-bold text-zinc-100">
                          {entry.score}
                        </td>
                        <td className="text-center px-3 py-2.5 text-sm text-zinc-400">
                          {entry.penalty}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
