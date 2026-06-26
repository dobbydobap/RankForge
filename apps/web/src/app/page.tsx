import Link from "next/link";

const FEATURES = [
  {
    n: "001",
    title: "Temporal Leaderboard",
    desc: "Scrub through time to see how rankings evolved — O(log n) segment-tree queries over the entire contest timeline.",
  },
  {
    n: "002",
    title: "Real-Time Contests",
    desc: "Live verdict delivery, synchronized timers, and instant standings pushed over WebSockets.",
  },
  {
    n: "003",
    title: "Deep Analytics",
    desc: "Rating curves, topic-mastery radar, solve streaks, and post-contest performance breakdowns.",
  },
];

const STATS: [string, string][] = [
  ["95+", "Problems"],
  ["10", "Languages"],
  ["RT", "WebSockets"],
  ["O(log n)", "Temporal Queries"],
];

export default function Home() {
  return (
    <div className="h-full overflow-y-auto bg-[var(--c-bg)] text-[var(--c-fg)] selection:bg-[var(--c-fg)] selection:text-[var(--c-bg)]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 lg:px-10 h-16 border-b border-[var(--c-fg)]">
        <Link href="/" className="font-display text-lg font-extrabold uppercase tracking-tight">
          RankForge<sup className="text-[9px] align-super ml-0.5">™</sup>
        </Link>
        <nav className="hidden md:flex items-center gap-8 label-mono">
          <Link href="/problems" className="hover:opacity-40 transition-opacity">Problems</Link>
          <Link href="/contests" className="hover:opacity-40 transition-opacity">Contests</Link>
          <Link href="/login" className="hover:opacity-40 transition-opacity">Login</Link>
        </nav>
        <Link
          href="/register"
          className="label-mono bg-[var(--c-fg)] text-[var(--c-bg)] px-4 py-2 hover:opacity-80 transition-colors"
        >
          Get Started →
        </Link>
      </header>

      {/* Meta strip */}
      <div className="flex items-center justify-between px-6 lg:px-10 py-2 border-b border-[var(--c-fg)] label-mono text-neutral-500">
        <span>RF / COMPETITIVE-PROGRAMMING</span>
        <span className="hidden sm:inline">EST. 2026</span>
        <span className="hidden sm:inline">ISBN 0011—RF26</span>
      </div>

      {/* Hero */}
      <section className="px-6 lg:px-10 pt-12 lg:pt-16 pb-10 border-b border-[var(--c-fg)]">
        <div className="flex items-start justify-between gap-8">
          <div className="label-mono text-neutral-400 max-w-xs">
            [ Compete against the clock. Analyze every minute. Rise through the ranks. ]
          </div>
          <div className="hidden lg:block text-right label-mono text-neutral-500 leading-relaxed">
            <div>Online Judge</div>
            <div>10 Languages</div>
            <div className="mt-2">Per-test verdicts</div>
            <div>AC / WA / TLE / RE</div>
          </div>
        </div>

        <h1 className="font-display uppercase mt-8 leading-[0.82] tracking-tight text-[19vw] lg:text-[13.5rem]">
          <span className="block">Compete</span>
          <span
            className="block text-transparent"
            style={{ WebkitTextStroke: "1.5px var(--c-fg)" }}
          >
            Analyze
          </span>
          <span className="block">Rise</span>
        </h1>

        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center bg-[var(--c-fg)] text-[var(--c-bg)] px-8 py-4 label-mono hover:opacity-80 transition-colors"
          >
            Start Coding →
          </Link>
          <Link
            href="/problems"
            className="inline-flex items-center justify-center border border-[var(--c-fg)] px-8 py-4 label-mono hover:bg-[var(--c-fg)] hover:text-[var(--c-fg)] transition-colors"
          >
            Browse Problems
          </Link>
        </div>
      </section>

      {/* Marquee strip */}
      <div className="overflow-hidden border-b border-[var(--c-fg)] whitespace-nowrap py-2.5 label-mono">
        {Array.from({ length: 2 }).map((_, i) => (
          <span key={i} className="mx-3 text-neutral-400">
            RANKFORGE · COMPETE · ANALYZE · RISE · TEMPORAL LEADERBOARD · REAL-TIME JUDGE · SEGMENT TREE ·
          </span>
        ))}
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 border-b border-[var(--c-fg)]">
        {STATS.map(([val, label], i) => (
          <div
            key={label}
            className={`px-6 lg:px-10 py-8 ${i < STATS.length - 1 ? "border-r border-[var(--c-fg)]" : ""} ${
              i < 2 ? "border-b md:border-b-0 border-[var(--c-fg)]" : ""
            }`}
          >
            <div className="font-display text-4xl lg:text-5xl">{val}</div>
            <div className="label-mono text-neutral-500 mt-2">{label}</div>
          </div>
        ))}
      </section>

      {/* Features — numbered editorial sections */}
      <section>
        {FEATURES.map((f) => (
          <div
            key={f.n}
            className="group grid grid-cols-1 md:grid-cols-[8rem_1fr_minmax(0,28rem)] gap-4 md:gap-8 px-6 lg:px-10 py-10 border-b border-[var(--c-fg)] hover:bg-[var(--c-fg)] hover:text-[var(--c-fg)] transition-colors"
          >
            <div className="font-display text-5xl lg:text-7xl text-neutral-300 group-hover:text-neutral-600">
              {f.n}
            </div>
            <h3 className="font-display uppercase text-2xl lg:text-4xl leading-none self-center">
              {f.title}
            </h3>
            <p className="text-sm leading-relaxed text-neutral-600 group-hover:text-neutral-300 self-center">
              {f.desc}
            </p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-10 py-20 lg:py-28 text-center border-b border-[var(--c-fg)]">
        <div className="label-mono text-neutral-400 mb-6">[ 003 — Rise ]</div>
        <h2 className="font-display uppercase text-[13vw] lg:text-[9rem] leading-[0.82] tracking-tight">
          Ship Your
          <br />
          Rating
        </h2>
        <Link
          href="/register"
          className="inline-flex items-center justify-center mt-10 bg-[var(--c-fg)] text-[var(--c-bg)] px-10 py-4 label-mono hover:opacity-80 transition-colors"
        >
          Create Account →
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 label-mono text-neutral-500">
        <div>
          <div className="text-[var(--c-fg)]">RANKFORGE / SOLO BUILD</div>
          <div>NEXT.JS · NESTJS · POSTGRES · REDIS</div>
        </div>
        <div className="flex gap-6">
          <Link href="/login" className="hover:text-[var(--c-fg)] transition-colors">Login</Link>
          <Link href="/register" className="hover:text-[var(--c-fg)] transition-colors">Register</Link>
          <Link href="/problems" className="hover:text-[var(--c-fg)] transition-colors">Problems</Link>
        </div>
        <div className="sm:text-right">© 2026</div>
      </footer>
    </div>
  );
}
