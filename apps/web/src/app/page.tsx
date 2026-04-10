import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1 relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-gray-400/10 to-transparent rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-rf-border bg-rf-dark/80 text-xs text-rf-gray mb-8 animate-[fadeIn_0.6s_ease-out]">
              Competitive Programming Platform
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight animate-[slideUp_0.7s_ease-out]">
              <span className="text-white">Compete.</span>{" "}
              <span className="text-rf-gray">Analyze.</span>{" "}
              <span className="text-white">Rise.</span>
            </h1>
            <p className="mt-6 text-lg text-rf-gray max-w-2xl mx-auto animate-[slideUp_0.8s_ease-out]">
              A competitive programming platform with temporal leaderboards,
              real-time contest tracking, and deep analytics to help you grow.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4 animate-[slideUp_0.9s_ease-out]">
              <Link
                href="/register"
                className="px-6 py-3 text-base font-medium bg-white hover:bg-gray-200 text-rf-black rounded-lg transition-all hover:scale-105 active:scale-95"
              >
                Get Started
              </Link>
              <Link
                href="/problems"
                className="px-6 py-3 text-base font-medium border border-rf-border hover:border-rf-iron text-rf-light rounded-lg transition-all hover:scale-105 active:scale-95"
              >
                Browse Problems
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-20 flex items-center justify-center gap-8 text-center animate-[fadeIn_1s_ease-out]">
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
            {[
              { icon: '\u23F1', title: 'Temporal Leaderboard', desc: 'Scrub through time to see how rankings evolved during a contest. Powered by segment trees for instant queries.' },
              { icon: '\u26A1', title: 'Real-Time Contests', desc: 'Live verdict updates, synchronized timers, and instant leaderboard changes via WebSockets.' },
              { icon: '\uD83D\uDCC8', title: 'Deep Analytics', desc: 'Track your rating, topic mastery, solve streaks, and compare performance across contests.' },
            ].map((card, i) => (
              <div
                key={card.title}
                className="group p-6 rounded-xl border border-rf-border bg-rf-card hover:border-rf-iron hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${1 + i * 0.15}s`, animation: `slideUp 0.6s ease-out ${1 + i * 0.15}s both` }}
              >
                <div className="w-10 h-10 rounded-lg bg-rf-border/50 flex items-center justify-center text-rf-light text-xl mb-4 group-hover:bg-rf-iron/30 transition-colors">
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-rf-gray leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

    </>
  );
}
