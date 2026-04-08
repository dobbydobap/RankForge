import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1 relative overflow-hidden">
        {/* Pink glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-pink-500/40 via-fuchsia-500/20 to-transparent rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-rf-border bg-rf-dark/80 text-xs text-rf-gray mb-8">
              Competitive Programming Platform
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">
              <span className="text-white">Compete.</span>{" "}
              <span className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 bg-clip-text text-transparent">Analyze.</span>{" "}
              <span className="text-white">Rise.</span>
            </h1>
            <p className="mt-6 text-lg text-rf-gray max-w-2xl mx-auto">
              A competitive programming platform with temporal leaderboards,
              real-time contest tracking, and deep analytics to help you grow.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/register"
                className="px-6 py-3 text-base font-medium bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white rounded-lg transition-all shadow-lg shadow-pink-500/25"
              >
                Get Started
              </Link>
              <Link
                href="/problems"
                className="px-6 py-3 text-base font-medium border border-rf-border hover:border-rf-iron text-rf-light rounded-lg transition-colors"
              >
                Browse Problems
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-20 flex items-center justify-center gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-white">95+</div>
              <div className="text-xs text-rf-gray">Problems</div>
            </div>
            <div className="w-px h-8 bg-rf-border" />
            <div>
              <div className="text-2xl font-bold text-white">10</div>
              <div className="text-xs text-rf-gray">Languages</div>
            </div>
            <div className="w-px h-8 bg-rf-border" />
            <div>
              <div className="text-2xl font-bold text-white">Real-time</div>
              <div className="text-xs text-rf-gray">WebSocket Updates</div>
            </div>
            <div className="w-px h-8 bg-rf-border" />
            <div>
              <div className="text-2xl font-bold text-white">Segment Tree</div>
              <div className="text-xs text-rf-gray">Temporal Leaderboard</div>
            </div>
          </div>

          {/* Feature cards */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group p-6 rounded-xl border border-rf-border bg-rf-card hover:border-pink-500/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 flex items-center justify-center text-pink-400 text-xl mb-4">
                &#9201;
              </div>
              <h3 className="text-lg font-semibold text-white">
                Temporal Leaderboard
              </h3>
              <p className="mt-2 text-sm text-rf-gray leading-relaxed">
                Scrub through time to see how rankings evolved during a contest.
                Powered by segment trees for instant queries.
              </p>
            </div>
            <div className="group p-6 rounded-xl border border-rf-border bg-rf-card hover:border-pink-500/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 flex items-center justify-center text-pink-400 text-xl mb-4">
                &#9889;
              </div>
              <h3 className="text-lg font-semibold text-white">
                Real-Time Contests
              </h3>
              <p className="mt-2 text-sm text-rf-gray leading-relaxed">
                Live verdict updates, synchronized timers, and instant
                leaderboard changes via WebSockets.
              </p>
            </div>
            <div className="group p-6 rounded-xl border border-rf-border bg-rf-card hover:border-pink-500/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 flex items-center justify-center text-pink-400 text-xl mb-4">
                &#128200;
              </div>
              <h3 className="text-lg font-semibold text-white">
                Deep Analytics
              </h3>
              <p className="mt-2 text-sm text-rf-gray leading-relaxed">
                Track your rating, topic mastery, solve streaks, and compare
                performance across contests.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
