import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050508] relative overflow-hidden">
      {/* Space-like gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[40%] w-[300px] h-[300px] bg-white/[0.015] rounded-full blur-[100px]" />
        <div className="absolute top-[30%] right-[20%] w-[200px] h-[200px] bg-orange-500/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] left-[30%] w-[250px] h-[250px] bg-white/[0.008] rounded-full blur-[130px]" />
        {/* Noise overlay for space texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 lg:px-16 h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-white/10 border border-white/10 flex items-center justify-center text-white text-xs font-bold">
            R
          </div>
          <span className="text-sm font-medium text-white/90">RankForge</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/problems" className="text-sm text-white/40 hover:text-white/80 transition-colors">Problems</Link>
          <Link href="/contests" className="text-sm text-white/40 hover:text-white/80 transition-colors">Contests</Link>
          <Link href="/login" className="text-sm text-white/40 hover:text-white/80 transition-colors">Login</Link>
          <Link href="/register" className="text-sm px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-white/90 rounded-lg transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8 pt-28 pb-20">
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.03] text-[11px] text-white/40 mb-10 tracking-wide" style={{ animation: 'fadeIn 0.6s ease-out' }}>
          COMPETITIVE PROGRAMMING PLATFORM
        </div>

        <h1 className="text-6xl lg:text-[5.5rem] font-bold tracking-tight text-center leading-[1.08]" style={{ animation: 'slideUp 0.7s ease-out' }}>
          <span className="text-white/95">Compete.</span><br />
          <span className="text-white/30">Analyze.</span><br />
          <span className="text-white/95">Rise.</span>
        </h1>

        <p className="mt-8 text-base text-white/35 max-w-md text-center leading-relaxed" style={{ animation: 'slideUp 0.8s ease-out' }}>
          Temporal leaderboards powered by segment trees, real-time contests, and deep analytics.
        </p>

        <div className="mt-12 flex items-center gap-4" style={{ animation: 'slideUp 0.9s ease-out' }}>
          <Link href="/register" className="px-8 py-3 text-sm font-medium bg-white text-black rounded-xl transition-all hover:bg-white/90">
            Start Coding
          </Link>
          <Link href="/problems" className="px-8 py-3 text-sm font-medium border border-white/10 hover:border-white/20 text-white/60 hover:text-white/80 rounded-xl transition-all">
            Browse Problems
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 flex items-center justify-center gap-16 py-10 mx-16 border-t border-white/[0.04]" style={{ animation: 'fadeIn 1s ease-out' }}>
        {[
          ['95+', 'Problems'],
          ['10', 'Languages'],
          ['Real-time', 'WebSockets'],
          ['Segment Tree', 'Temporal Leaderboard'],
        ].map(([val, label]) => (
          <div key={label} className="text-center">
            <div className="text-lg font-semibold text-white/80">{val}</div>
            <div className="text-[11px] text-white/25 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 px-16 py-20">
        {[
          { title: 'Temporal Leaderboard', desc: 'Scrub through time to see how rankings evolved. Powered by segment trees.' },
          { title: 'Real-Time Contests', desc: 'Live verdict updates, synchronized timers, and instant leaderboard changes.' },
          { title: 'Deep Analytics', desc: 'Track rating, topic mastery, solve streaks, and compare across contests.' },
        ].map((card, i) => (
          <div
            key={card.title}
            className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
            style={{ animation: `slideUp 0.6s ease-out ${1 + i * 0.12}s both` }}
          >
            <h3 className="text-sm font-semibold text-white/80">{card.title}</h3>
            <p className="mt-2 text-sm text-white/30 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
