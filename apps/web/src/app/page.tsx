import Link from "next/link";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Reveal } from "@/components/layout/Reveal";
import { CursorBubble } from "@/components/layout/CursorBubble";
import { MagneticLink } from "@/components/layout/MagneticLink";
import { ScrambleText } from "@/components/layout/ScrambleText";

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

const MARQUEE =
  "RANKFORGE · COMPETE · ANALYZE · RISE · TEMPORAL LEADERBOARD · REAL-TIME JUDGE · SEGMENT TREE · ";

export default function Home() {
  return (
    <div className="h-full overflow-y-auto bg-[var(--c-bg)] text-[var(--c-fg)] selection:bg-[var(--c-fg)] selection:text-[var(--c-bg)]">
      <CursorBubble />

      {/* Top bar (auth-aware) */}
      <LandingHeader />

      {/* Meta strip */}
      <div className="flex items-center justify-between px-6 lg:px-10 py-2 border-b border-[var(--c-fg)] label-mono text-neutral-500">
        <span className="rf-enter" style={{ animationDelay: "60ms" }}>RF / COMPETITIVE-PROGRAMMING</span>
        <span className="rf-enter hidden sm:inline" style={{ animationDelay: "120ms" }}>EST. 2026</span>
        <span className="rf-enter hidden sm:inline" style={{ animationDelay: "180ms" }}>ISBN 0011—RF26</span>
      </div>

      {/* Hero */}
      <section className="px-6 lg:px-10 pt-12 lg:pt-16 pb-10 border-b border-[var(--c-fg)]">
        <div className="flex items-start justify-between gap-8">
          <div className="rf-enter label-mono text-neutral-400 max-w-xs" style={{ animationDelay: "120ms" }}>
            [ Compete against the clock. Analyze every minute. Rise through the ranks. ]
          </div>
          <div className="rf-enter hidden lg:block text-right label-mono text-neutral-500 leading-relaxed" style={{ animationDelay: "200ms" }}>
            <div>Online Judge</div>
            <div>10 Languages</div>
            <div className="mt-2">Per-test verdicts</div>
            <div>AC / WA / TLE / RE</div>
          </div>
        </div>

        <h1 className="font-display uppercase mt-8 leading-[0.82] tracking-tight text-[19vw] lg:text-[13.5rem]">
          <span className="rf-enter block" style={{ animationDelay: "120ms" }}><ScrambleText text="Compete" /></span>
          <span
            className="rf-enter block text-transparent"
            style={{ WebkitTextStroke: "1.5px var(--c-fg)", animationDelay: "240ms" }}
          >
            <ScrambleText text="Analyze" />
          </span>
          <span className="rf-enter block" style={{ animationDelay: "360ms" }}><ScrambleText text="Rise" /></span>
        </h1>

        <div className="rf-enter mt-10 flex flex-col sm:flex-row sm:items-center gap-4" style={{ animationDelay: "480ms" }}>
          <MagneticLink
            href="/register"
            className="group items-center justify-center gap-2 bg-[var(--c-fg)] text-[var(--c-bg)] px-8 py-4 label-mono hover:opacity-80"
          >
            Start Coding <span className="transition-transform group-hover:translate-x-1">→</span>
          </MagneticLink>
          <Link
            href="/problems"
            className="inline-flex items-center justify-center border border-[var(--c-fg)] px-8 py-4 label-mono hover:bg-[var(--c-fg)] hover:text-[var(--c-bg)] transition-colors"
          >
            Browse Problems
          </Link>
        </div>
      </section>

      {/* Marquee strip — continuous scroll */}
      <div className="overflow-hidden border-b border-[var(--c-fg)] py-2.5 label-mono">
        <div className="rf-marquee text-neutral-400">
          <span className="px-2">{MARQUEE.repeat(4)}</span>
          <span className="px-2">{MARQUEE.repeat(4)}</span>
        </div>
      </div>

      {/* Stats */}
      <Reveal>
        <section className="grid grid-cols-2 md:grid-cols-4 border-b border-[var(--c-fg)]">
          {STATS.map(([val, label], i) => (
            <div
              key={label}
              className={`group px-6 lg:px-10 py-8 transition-colors hover:bg-[var(--c-fg)] hover:text-[var(--c-bg)] ${
                i < STATS.length - 1 ? "border-r border-[var(--c-fg)]" : ""
              } ${i < 2 ? "border-b md:border-b-0 border-[var(--c-fg)]" : ""}`}
            >
              <div className="font-display text-4xl lg:text-5xl">{val}</div>
              <div className="label-mono text-neutral-500 group-hover:text-neutral-700 mt-2">{label}</div>
            </div>
          ))}
        </section>
      </Reveal>

      {/* Features — numbered editorial sections */}
      <section>
        {FEATURES.map((f, i) => (
          <Reveal key={f.n} delay={i * 90}>
            <div className="group grid grid-cols-1 md:grid-cols-[8rem_1fr_minmax(0,28rem)] gap-4 md:gap-8 px-6 lg:px-10 py-10 border-b border-[var(--c-fg)] hover:bg-[var(--c-fg)] hover:text-[var(--c-bg)] transition-colors">
              <div className="font-display text-5xl lg:text-7xl text-neutral-300 group-hover:text-neutral-600">
                {f.n}
              </div>
              <h3 className="font-display uppercase text-2xl lg:text-4xl leading-none self-center transition-transform duration-300 group-hover:translate-x-2">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-600 group-hover:text-neutral-300 self-center">
                {f.desc}
              </p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* CTA */}
      <Reveal>
        <section className="px-6 lg:px-10 py-20 lg:py-28 text-center border-b border-[var(--c-fg)]">
          <div className="label-mono text-neutral-400 mb-6">[ 003 — Rise ]</div>
          <h2 className="font-display uppercase text-[13vw] lg:text-[9rem] leading-[0.82] tracking-tight">
            Ship Your
            <br />
            Rating
          </h2>
          <MagneticLink
            href="/register"
            className="group items-center justify-center gap-2 mt-10 bg-[var(--c-fg)] text-[var(--c-bg)] px-10 py-4 label-mono hover:opacity-80"
          >
            Create Account <span className="transition-transform group-hover:translate-x-1">→</span>
          </MagneticLink>
        </section>
      </Reveal>

      {/* Footer */}
      <footer className="px-6 lg:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 label-mono text-neutral-500">
        <div>
          <div className="text-[var(--c-fg)]">RANKFORGE / SOLO BUILD</div>
          <div>NEXT.JS · NESTJS · POSTGRES · REDIS</div>
        </div>
        <div className="flex gap-6">
          <Link href="/login" className="rf-underline hover:text-[var(--c-fg)]">Login</Link>
          <Link href="/register" className="rf-underline hover:text-[var(--c-fg)]">Register</Link>
          <Link href="/problems" className="rf-underline hover:text-[var(--c-fg)]">Problems</Link>
        </div>
        <div className="sm:text-right">© 2026</div>
      </footer>
    </div>
  );
}
