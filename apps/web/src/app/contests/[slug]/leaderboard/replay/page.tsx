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
          <div className="text-rf-gray">
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
          <div className="text-rf-gray">No replay data available for this contest.</div>
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
            <h1 className="text-2xl font-bold text-rf-cream">Contest Replay</h1>
            <div className="flex items-center gap-3 mt-1">
              <Link
                href={`/contests/${slug}`}
                className="text-sm text-rf-gray hover:text-rf-sage transition-colors"
              >
                {contest.title}
              </Link>
              <span className="text-rf-iron">|</span>
              <Link
                href={`/contests/${slug}/leaderboard/temporal`}
                className="text-sm text-rf-gray hover:text-rf-sage transition-colors"
              >
                Temporal View
              </Link>
            </div>
          </div>

          {/* Speed controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-rf-muted">Speed:</span>
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 text-xs rounded ${
                  speed === s
                    ? 'bg-rf-accent text-rf-black'
                    : 'bg-rf-border text-rf-gray hover:bg-rf-iron'
                } transition-colors`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Timeline slider */}
        <div className="p-4 border border-rf-border rounded-xl bg-rf-dark/50 mb-6">
          <TemporalSlider
            duration={replay.duration}
            value={currentFrame?.minute || 0}
            onChange={handleSliderChange}
            isPlaying={isPlaying}
            onPlayToggle={togglePlay}
          />
        </div>

        {/* Rank Graph */}
        <div className="p-4 border border-rf-border rounded-xl bg-rf-dark/50 mb-6">
          <h2 className="text-sm font-semibold text-rf-sage mb-3">
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
          <div className="border border-rf-border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-rf-dark/50 border-b border-rf-border">
              <span className="text-xs text-rf-muted">
                Standings at minute {currentFrame.minute}
              </span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-rf-border bg-rf-dark/30">
                  <th className="text-center px-3 py-2 text-xs font-medium text-rf-gray uppercase w-14">#</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-rf-gray uppercase">User</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-rf-gray uppercase w-20">Score</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-rf-gray uppercase w-20">Penalty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rf-border">
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
                            ? 'bg-rf-dark/10'
                            : rankChange < 0
                              ? 'bg-red-900/10'
                              : ''
                        }`}
                      >
                        <td className="text-center px-3 py-2.5 text-sm font-bold text-rf-sage">
                          <div className="flex items-center justify-center gap-1">
                            <span>{entry.rank}</span>
                            {rankChange > 0 && (
                              <span className="text-xs text-rf-sage">+{rankChange}</span>
                            )}
                            {rankChange < 0 && (
                              <span className="text-xs text-red-400">{rankChange}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-rf-cream">
                          {entry.displayName || entry.username}
                        </td>
                        <td className="text-center px-3 py-2.5 text-sm font-bold text-rf-cream">
                          {entry.score}
                        </td>
                        <td className="text-center px-3 py-2.5 text-sm text-rf-gray">
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
