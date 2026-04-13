# RankForge

A full-stack competitive programming platform with temporal leaderboards, real-time code judging, and deep analytics.

## Live Demo

- **Frontend**: [rank-forge-web.vercel.app](https://rank-forge-web.vercel.app)
- **API**: [rankforge-717i.onrender.com](https://rankforge-717i.onrender.com)

> Backend is on Render free tier — first request may take ~30s to wake up.

## Highlights

- **95+ problems** across 4 difficulty tiers (Easy, Medium, Hard, Expert) with real test cases
- **Online judge** — compile and run code in 10 languages via [Piston API](https://github.com/engineer-man/piston), with per-test-case verdicts (AC/WA/TLE/RE/CE)
- **LeetCode-style editor** — Run code against custom input, see compilation errors and output instantly, then submit to judge all test cases
- **Temporal leaderboard** — scrub through time to see how rankings evolved, powered by segment trees
- **Contest replay mode** — watch a contest unfold like a movie with animated rank graphs
- **Codeforces-style rating system** — Elo-based algorithm with per-contest rating changes
- **10 language support** — C, C++, Python, Java, JavaScript, TypeScript, Go, Rust, Kotlin, Ruby
- **Plagiarism detection** — token-based n-gram similarity analysis across contest submissions
- **LeetCode-style profiles** — solve donut, submission heatmap, language breakdown, skill radar
- **Real-time updates** — live verdict delivery, leaderboard changes, and timer sync via WebSockets

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, Monaco Editor, Recharts |
| Backend | NestJS 11, TypeScript, Prisma ORM, REST API, WebSockets (ws) |
| Database | PostgreSQL (Neon) |
| Queue | Redis (Upstash), BullMQ |
| Code Execution | [Piston API](https://github.com/engineer-man/piston) (10 languages, free, open-source) |
| Auth | JWT (access + refresh tokens), bcrypt, Passport.js |
| Monorepo | Turborepo, pnpm workspaces |
| Deployment | Vercel (frontend), Render (backend) |

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js    │────>│   NestJS     │────>│  PostgreSQL   │
│   Frontend   │     │   API        │     │  (Prisma)     │
│  (Vercel)    │<────│  (Render)    │     │  (Neon)       │
└──────────────┘  WS └──────┬───────┘     └──────────────┘
                            │
                   ┌────────┴────────┐
                   │  Redis + BullMQ │
                   │   (Upstash)     │
                   └────────┬────────┘
                            │
              ┌─────────────┴─────────────┐
              │  Judge Worker (BullMQ)     │
              │  Code execution via Piston │
              │  10 languages supported    │
              └───────────────────────────┘
```

## How Judging Works

```
1. User writes code in Monaco Editor
2. "Run" → executes against custom input via Piston API, shows output instantly
3. "Submit" → enqueues to BullMQ judge queue
4. Judge worker runs code against ALL test cases via Piston API
5. Per-test-case verdict (AC/WA/TLE/RE/CE) saved to DB
6. Real-time verdict delivered via WebSocket
7. Leaderboard updates if contest submission
```

Supported verdicts: Accepted, Wrong Answer, Time Limit Exceeded, Memory Limit Exceeded, Runtime Error, Compilation Error

## Project Structure

```
rankforge/
├── apps/
│   ├── web/                  # Next.js frontend (20 pages)
│   ├── api/                  # NestJS backend (15 modules, ~50 endpoints)
│   └── judge-worker/         # Standalone judge service
├── packages/
│   ├── shared/               # Types, constants, Zod validation schemas
│   └── segment-tree/         # Temporal leaderboard data structure
├── docker-compose.yml        # Local PostgreSQL + Redis
├── render.yaml               # Render deployment blueprint
└── turbo.json                # Monorepo task runner
```

## Features

### Code Editor & Judge
- **Monaco Editor** — VS Code-powered editor with syntax highlighting for all 10 languages
- **Run** — test your code against custom input, see output or errors instantly
- **Submit** — judge against all test cases, see per-test verdicts in real-time
- **Compilation errors** — shown inline with error messages from the compiler
- **Runtime errors** — stack traces and error output displayed
- **Custom test run** — edit input, run, compare output with expected

### Core Platform
- **Auth** — Register, login, logout, JWT refresh, role-based access (User, Problem Setter, Organizer, Admin)
- **Problems** — CRUD with Markdown statements, difficulty tags, sample/hidden test cases
- **Contests** — Full lifecycle (Draft -> Published -> Registration -> Live -> Frozen -> Ended -> Results), ICPC-style scoring
- **Contest creation** — organizers can create contests, add problems, manage lifecycle

### Differentiating Features
- **Temporal Leaderboard** — Segment tree queries over contest timeline: standings at any minute T, score progressions, peak activity intervals
- **Contest Replay** — Animated playback of the entire contest showing rank movements over time
- **Rating System** — Codeforces-style algorithm: expected rank vs actual rank, performance rating, inflation control
- **Post-Contest Analytics** — Per-problem breakdown, solve time vs average comparison, rating impact
- **Growth Analytics** — Topic mastery radar chart, 365-day submission heatmap, rating over time, solve streaks

### Profile & Social
- **LeetCode-style Profile** — Solved donut chart, difficulty breakdown, submission heatmap, language stats, skill tags, badges
- **Achievements** — 10 badges (First Blood, Centurion, Expert, Streak 30, etc.)
- **Discussions** — Threaded comments on problems
- **Editorials** — Post-solve explanations by problem setters

### Admin & Security
- **Admin Dashboard** — System stats, user management, verdict distribution charts
- **Plagiarism Detection** — Token-based code similarity (trigram Jaccard), flags pairs >80% similar
- **Virtual Contests** — Take past contests with personal timer
- **Rejudge** — Re-evaluate submissions when test cases change

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login`, `/register` | Authentication |
| `/dashboard` | Personal dashboard with stats, streak, upcoming contests |
| `/problems` | Problem list with difficulty/tag filters |
| `/problems/[slug]` | Split-pane editor: problem + Monaco + run/submit + test output |
| `/submissions` | All submissions with verdict badges |
| `/submissions/[id]` | Submission detail with per-test results |
| `/contests` | Contest list with status badges |
| `/contests/create` | Contest creation form |
| `/contests/[slug]` | Contest room: timer, problems, registration, announcements |
| `/contests/[slug]/leaderboard` | ICPC-style live leaderboard with first blood |
| `/contests/[slug]/leaderboard/temporal` | Time-scrubber leaderboard (segment tree) |
| `/contests/[slug]/leaderboard/replay` | Animated contest replay |
| `/contests/[slug]/ratings` | Post-contest rating changes |
| `/contests/[slug]/analytics` | Personal performance breakdown |
| `/users/[username]` | LeetCode-style public profile |
| `/analytics` | Personal growth: topic radar, heatmap, rating graph |
| `/admin` | Admin dashboard with system stats |

## Design

Charcoal dark theme with balanced grays:

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#121212` | Page backgrounds |
| Dark | `#1a1a1a` | Panels |
| Card | `#1e1e1e` | Cards |
| Border | `#444444` | Borders, dividers |
| Iron | `#666666` | Muted elements |
| Gray | `#B0B0B0` | Secondary text |
| Accent | `#888888` | Soft gray accents |
| Light | `#E0E0E0` | Primary text, headings |

## Getting Started

### Prerequisites
- Node.js 22+
- pnpm (`npm install -g pnpm`)
- Docker (for local PostgreSQL + Redis)

### Local Development

```bash
git clone https://github.com/dobbydobap/RankForge.git
cd RankForge

pnpm install

# Start PostgreSQL + Redis
docker compose up -d

# Copy environment variables
cp .env.example .env

# Push database schema and seed
pnpm db:push
pnpm db:seed

# Start development servers
pnpm dev
```

Open:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000

### Demo Accounts

Available after seeding (`pnpm db:seed` locally, or `POST /api/seed?key=...&force=true` in production):

| User | Email | Password | Role | Rating |
|------|-------|----------|------|--------|
| admin | admin@rankforge.dev | Admin123 | Admin | 2100 |
| alice | alice@rankforge.dev | Password1 | User | 1650 |
| bob | bob@rankforge.dev | Password1 | User | 1420 |
| charlie | charlie@rankforge.dev | Password1 | User | 1850 |
| diana | diana@rankforge.dev | Password1 | User | 1300 |
| eve | eve@rankforge.dev | Password1 | User | 1550 |

> **Note:** On the live demo, you can register a new account to try the platform. Demo accounts are available if the database has been seeded.

## Deployment

Deployed on the free tier:

| Service | Platform | Cost |
|---------|----------|------|
| Frontend | Vercel | Free |
| Backend | Render | Free |
| PostgreSQL | Neon | Free (0.5 GB) |
| Redis | Upstash | Free (10K cmd/day) |

### Deploy Your Own

1. **Neon** — Create project at [neon.tech](https://neon.tech), copy connection string
2. **Upstash** — Create Redis at [upstash.com](https://upstash.com), copy `REDIS_URL` (use `rediss://`)
3. **Render** — Connect GitHub repo, set:
   - Build: `chmod +x apps/api/render-build.sh && bash apps/api/render-build.sh`
   - Start: `cd apps/api && node dist/main.js`
   - Env: `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`
4. **Vercel** — Import repo, root directory `apps/web`, set:
   - `NEXT_PUBLIC_API_URL` = Render URL + `/api`
   - `NEXT_PUBLIC_WS_URL` = Render URL with `wss://`
5. **Seed production DB**: `POST /api/seed?key=YOUR_JWT_ACCESS_SECRET&force=true`

## Key Data Structures

### Segment Tree (Temporal Leaderboard)

The `@rankforge/segment-tree` package provides O(log n) queries over the contest timeline:

```typescript
const tree = new ContestSegmentTree(120); // 120-minute contest

tree.update(10, 100, true);  // +100 points at minute 10
tree.update(30, 200, true);  // +200 points at minute 30

const data = tree.query(5, 35);
// { totalScore: 300, submissionCount: 2, acceptedCount: 2, maxScoreGain: 200 }
```

Powers: leaderboard at any time T, score progression graphs, peak activity detection, and contest replay.

## Scripts

```bash
pnpm dev              # Start all services
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm db:push          # Push Prisma schema
pnpm db:seed          # Seed database (95+ problems, 6 users, demo contest)
pnpm db:studio        # Open Prisma Studio
pnpm dev:web          # Frontend only
pnpm dev:api          # Backend only
```

## Testing

```bash
pnpm test:segment-tree    # Segment tree unit tests (9 tests)
pnpm test:shared          # Zod validation tests (8 tests)
```

## License

MIT
