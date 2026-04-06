# RankForge

A full-stack competitive programming platform with temporal leaderboards, real-time contests, and deep analytics — built as a portfolio project demonstrating system design, data structures, and modern web development.

## Highlights

- **99 problems** across 4 difficulty tiers (Easy, Medium, Hard, Expert) with real test cases
- **Temporal leaderboard** — scrub through time to see how rankings evolved during a contest, powered by segment trees
- **Real-time updates** — live verdict delivery, leaderboard changes, and timer sync via WebSockets
- **Contest replay mode** — watch a contest unfold like a movie with animated rank graphs
- **Codeforces-style rating system** — Elo-based algorithm with per-contest rating changes
- **10 language support** — C, C++, Python, Java, JavaScript, TypeScript, Go, Rust, Kotlin, Ruby
- **Code judge** — BullMQ queue with background worker, per-test-case verdicts (AC/WA/TLE/MLE/RE/CE)
- **Plagiarism detection** — token-based n-gram similarity analysis across contest submissions
- **LeetCode-style profiles** — solve donut, submission heatmap, language breakdown, skill radar

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Monaco Editor, Recharts |
| Backend | NestJS, TypeScript, Prisma ORM, REST API, WebSockets (ws) |
| Database | PostgreSQL |
| Queue | Redis, BullMQ |
| Auth | JWT (access + refresh tokens), bcrypt, Passport.js |
| Monorepo | Turborepo, pnpm workspaces |
| Deployment | Vercel (frontend), Render (backend), Neon (PostgreSQL), Upstash (Redis) |

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js    │────▶│   NestJS     │────▶│  PostgreSQL   │
│   Frontend   │     │   API        │     │  (Prisma)     │
│  (Vercel)    │◀────│  (Render)    │     │  (Neon)       │
└──────────────┘  WS └──────┬───────┘     └──────────────┘
                            │
                   ┌────────▼────────┐
                   │  Redis + BullMQ │
                   │   (Upstash)     │
                   └────────┬────────┘
                            │
                   ┌────────▼────────┐
                   │  Judge Worker   │
                   │  (Background)   │
                   └─────────────────┘
```

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

### Core Platform
- **Auth** — Register, login, logout, JWT refresh, role-based access (User, Problem Setter, Organizer, Admin)
- **Problems** — CRUD with Markdown statements, difficulty tags, sample/hidden test cases, Monaco code editor
- **Submissions** — Multi-language support, background judging, per-test-case verdicts, submission history
- **Contests** — Full lifecycle (Draft → Published → Registration → Live → Frozen → Ended → Results), ICPC-style scoring

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
| `/problems/[slug]` | Split-pane: problem statement + Monaco editor |
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

## Getting Started

### Prerequisites
- Node.js 22+
- pnpm (`npm install -g pnpm`)
- Docker (for local PostgreSQL + Redis)

### Local Development

```bash
# Clone the repo
git clone https://github.com/dobbydobap/RankForge.git
cd RankForge

# Install dependencies
pnpm install

# Start PostgreSQL + Redis
docker compose up -d

# Copy environment variables
cp .env.example .env

# Push database schema
pnpm db:push

# Seed database (99 problems, 6 users, demo contest)
pnpm db:seed

# Start development servers
pnpm dev
```

Then open:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **API docs**: http://localhost:4000/api

### Seed Accounts

| User | Email | Password | Role |
|------|-------|----------|------|
| admin | admin@rankforge.dev | Admin123 | Admin |
| alice | alice@rankforge.dev | Password1 | User (Rating: 1650) |
| bob | bob@rankforge.dev | Password1 | User (Rating: 1420) |
| charlie | charlie@rankforge.dev | Password1 | User (Rating: 1850) |
| diana | diana@rankforge.dev | Password1 | User (Rating: 1300) |
| eve | eve@rankforge.dev | Password1 | User (Rating: 1550) |

## Deployment

### Free Tier Stack
- **Frontend**: Vercel (free)
- **Backend**: Render (free)
- **PostgreSQL**: Neon (free, 0.5 GB)
- **Redis**: Upstash (free, 10K commands/day)

See [Deployment Guide](#deployment-guide) below.

### Deployment Guide

1. **Neon** — Create a project at [neon.tech](https://neon.tech), copy the connection string
2. **Upstash** — Create a Redis database at [upstash.com](https://upstash.com), copy the `REDIS_URL`
3. **Render** — Connect your GitHub repo, use `render.yaml` blueprint, set env vars:
   - `DATABASE_URL` = Neon connection string
   - `REDIS_URL` = Upstash Redis URL
   - `CORS_ORIGIN` = Your Vercel URL (e.g., `https://rankforge.vercel.app`)
4. **Vercel** — Import the repo, set root directory to `apps/web`, set env var:
   - `NEXT_PUBLIC_API_URL` = Your Render URL + `/api`
   - `NEXT_PUBLIC_WS_URL` = Your Render URL (replace `https` with `wss`)

## Database Schema

20 tables covering users, problems, contests, submissions, leaderboard snapshots, ratings, achievements, comments, and more. See [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma) for the full schema.

## Key Data Structures

### Segment Tree (Temporal Leaderboard)

The `@rankforge/segment-tree` package provides O(log n) queries over the contest timeline:

```typescript
const tree = new ContestSegmentTree(120); // 120-minute contest

// Record score events
tree.update(10, 100, true);  // +100 points at minute 10
tree.update(30, 200, true);  // +200 points at minute 30

// Query a time range
const data = tree.query(5, 35);
// → { totalScore: 300, submissionCount: 2, acceptedCount: 2, maxScoreGain: 200 }
```

This powers: leaderboard at any time T, score progression graphs, peak activity detection, and contest replay.

## Scripts

```bash
pnpm dev              # Start all services in development
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm db:push          # Push Prisma schema to database
pnpm db:seed          # Seed database with sample data
pnpm db:studio        # Open Prisma Studio (database GUI)
pnpm dev:web          # Start only the frontend
pnpm dev:api          # Start only the backend
```

## Testing

```bash
pnpm test:segment-tree    # Segment tree unit tests (9 tests)
pnpm test:shared          # Zod validation tests (8 tests)
```

## License

MIT
