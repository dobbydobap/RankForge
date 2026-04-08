import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">
              <span className="text-rf-cream">Compete.</span>{" "}
              <span className="text-rf-sage">Analyze.</span>{" "}
              <span className="text-rf-cream">Rise.</span>
            </h1>
            <p className="mt-6 text-lg text-rf-gray max-w-2xl mx-auto">
              A competitive programming platform with temporal leaderboards,
              real-time contest tracking, and deep analytics to help you grow.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/register"
                className="px-6 py-3 text-base font-medium bg-rf-accent hover:bg-rf-accent-hover text-white rounded-lg transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/problems"
                className="px-6 py-3 text-base font-medium border border-rf-iron hover:border-rf-gray text-rf-sage rounded-lg transition-colors"
              >
                Browse Problems
              </Link>
            </div>
          </div>

          <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-rf-border bg-rf-dark/50">
              <div className="text-rf-sage text-2xl mb-3">&#9201;</div>
              <h3 className="text-lg font-semibold text-rf-cream">
                Temporal Leaderboard
              </h3>
              <p className="mt-2 text-sm text-rf-gray">
                Scrub through time to see how rankings evolved during a contest.
                Powered by segment trees for instant queries.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-rf-border bg-rf-dark/50">
              <div className="text-rf-sage text-2xl mb-3">&#9889;</div>
              <h3 className="text-lg font-semibold text-rf-cream">
                Real-Time Contests
              </h3>
              <p className="mt-2 text-sm text-rf-gray">
                Live verdict updates, synchronized timers, and instant
                leaderboard changes via WebSockets.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-rf-border bg-rf-dark/50">
              <div className="text-rf-sage text-2xl mb-3">&#128200;</div>
              <h3 className="text-lg font-semibold text-rf-cream">
                Deep Analytics
              </h3>
              <p className="mt-2 text-sm text-rf-gray">
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
