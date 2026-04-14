import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-rf-black relative overflow-hidden">
      {/* Orange ambient glow */}
      <div className="absolute top-[-30%] right-[-10%] w-[700px] h-[700px] bg-orange-600/[0.07] rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-5%] w-[500px] h-[500px] bg-orange-500/[0.04] rounded-full blur-[160px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 lg:px-16 h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white text-sm font-bold">
            R
          </div>
          <span className="text-base font-semibold text-white">RankForge</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/problems" className="text-sm text-rf-gray hover:text-white transition-colors">Problems</Link>
          <Link href="/contests" className="text-sm text-rf-gray hover:text-white transition-colors">Contests</Link>
          <Link href="/login" className="text-sm text-rf-gray hover:text-white transition-colors">Login</Link>
          <Link href="/register" className="text-sm px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white rounded-lg transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8 pt-24 pb-16">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-rf-border bg-rf-dark/60 text-xs text-rf-gray mb-8" style={{ animation: 'fadeIn 0.6s ease-out' }}>
          Competitive Programming Platform
        </div>

        <h1 className="text-6xl lg:text-8xl font-bold tracking-tight text-center leading-[1.05]" style={{ animation: 'slideUp 0.7s ease-out' }}>
          <span className="text-white">Compete.</span><br />
          <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">Analyze.</span><br />
          <span className="text-white">Rise.</span>
        </h1>

        <p className="mt-8 text-lg text-rf-gray max-w-xl text-center leading-relaxed" style={{ animation: 'slideUp 0.8s ease-out' }}>
          Temporal leaderboards, real-time contests, and deep analytics — all in one platform.
        </p>

        <div className="mt-10 flex items-center gap-4" style={{ animation: 'slideUp 0.9s ease-out' }}>
          <Link href="/register" className="px-8 py-3.5 text-sm font-medium bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white rounded-xl transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30">
            Start Coding
          </Link>
          <Link href="/problems" className="px-8 py-3.5 text-sm font-medium border border-rf-border hover:border-rf-iron text-rf-light rounded-xl transition-all">
            Browse Problems
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 flex items-center justify-center gap-12 py-12 border-y border-rf-border/50 mx-16" style={{ animation: 'fadeIn 1s ease-out' }}>
        {[
          ['95+', 'Problems'],
          ['10', 'Languages'],
          ['Real-time', 'WebSockets'],
          ['Segment Tree', 'Temporal Leaderboard'],
        ].map(([val, label]) => (
          <div key={label} className="text-center">
            <div className="text-xl font-bold text-white">{val}</div>
            <div className="text-xs text-rf-iron mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 px-16 py-20">
        {[
          { icon: '⏱', title: 'Temporal Leaderboard', desc: 'Scrub through time to see how rankings evolved. Powered by segment trees for instant queries.' },
          { icon: '⚡', title: 'Real-Time Contests', desc: 'Live verdict updates, synchronized timers, and instant leaderboard changes via WebSockets.' },
          { icon: '📈', title: 'Deep Analytics', desc: 'Track rating, topic mastery, solve streaks, and compare performance across contests.' },
        ].map((card, i) => (
          <div
            key={card.title}
            className="p-6 rounded-2xl border border-rf-border bg-rf-card/50 hover:border-orange-500/20 hover:-translate-y-1 transition-all duration-300 group"
            style={{ animation: `slideUp 0.6s ease-out ${1 + i * 0.15}s both` }}
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-lg mb-4 group-hover:bg-orange-500/15 transition-colors">
              {card.icon}
            </div>
            <h3 className="text-base font-semibold text-white">{card.title}</h3>
            <p className="mt-2 text-sm text-rf-gray leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
