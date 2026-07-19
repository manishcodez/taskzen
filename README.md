# Taskzen v1.0

Taskzen is an academic productivity platform for students. It helps you organize subjects, manage tasks and deadlines, track progress on a dashboard, view work on a calendar, and review analytics — all in one workspace.

**Status:** Taskzen v1.0 is **complete** (Phases 0–6). The application is **production-ready** for deployment but is **not deployed yet** in this repository.

## Main Features

| Area | Capabilities |
|------|----------------|
| **Authentication** | Register, login, logout, JWT sessions (httpOnly cookies), protected routes |
| **Dashboard** | Task counts, due today/this week, overdue, completion rate, priority widgets |
| **Tasks** | Create, edit, complete, reopen, delete, search, filter, sort, overdue detection |
| **Subjects** | Create, edit, color-coded organization, subject detail with linked tasks |
| **Calendar** | Month view with tasks grouped by due date |
| **Analytics** | Completion rate, weekly trends, subject workload, productivity insights |
| **Profile & Settings** | Academic profile, profile photo upload with crop, password update |

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query, React Hook Form, Zod, Recharts
- **Backend:** Next.js API Routes, service layer, Zod validation
- **Database:** PostgreSQL with Prisma ORM (`@prisma/adapter-pg` + `pg` for Prisma 7)
- **Auth:** JWT (access + refresh tokens in httpOnly cookies), bcrypt password hashing
- **Target deployment:** Vercel + Neon PostgreSQL (not deployed in this step)

## Authentication & Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT access and refresh tokens stored in **httpOnly** cookies
- Production cookies use `secure: true` and `sameSite: strict`
- Middleware protects routes and API endpoints
- Client-side session guard handles bfcache/back-navigation edge cases
- Login rate limiting with `Retry-After` headers
- All queries scoped to the authenticated user's `userId` (cross-user access returns 404)
- Security headers configured in `next.config.ts`
- Secrets must live in `.env` only — never commit `.env` or put secrets in `NEXT_PUBLIC_*` variables

## Prerequisites

- Node.js 20+
- PostgreSQL (local Docker/Postgres or [Neon](https://neon.tech) for cloud)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and update values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon pooler recommended for serverless) |
| `JWT_SECRET` | Secret for access tokens (long random string) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (long random string) |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. `http://localhost:3000`) |

Generate strong random strings for JWT secrets before production use.

### 3. Set up the database

```bash
npm run db:generate
npm run db:migrate
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Important:** Run only one dev server at a time. Do not run `npm run build` while `npm run dev` is active — this can corrupt the local `.next` cache and cause 500 errors. If that happens, stop dev, delete `.next`, and restart `npm run dev`.

## Verification Scripts

Run service-layer verification after changes:

```bash
npx tsx scripts/verify-phase2.ts
npx tsx scripts/verify-phase3.ts
npx tsx scripts/verify-phase4.ts
npx tsx scripts/verify-phase5.ts
npx tsx scripts/verify-phase6.ts
```

HTTP smoke test (requires dev server running):

```bash
npx tsx scripts/e2e-smoke-http.ts
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations (dev) |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
src/
├── app/              # Next.js App Router (public, protected, API routes)
├── components/       # UI and feature components
├── hooks/            # Custom React hooks (TanStack Query)
├── lib/              # Auth, validators, utilities, db client
├── services/         # Business logic layer
└── types/            # Shared TypeScript types
prisma/
├── schema.prisma     # Database schema
└── migrations/       # Migration history
scripts/
├── verify-phase*.ts  # Phase verification scripts
└── e2e-smoke-http.ts # HTTP smoke tests against local dev server
public/
└── uploads/          # Local profile photo uploads (gitignored except .gitkeep)
```

## Production Deployment (Vercel + Neon)

**Not deployed yet.** When you are ready to deploy:

1. Create a Neon PostgreSQL database and copy the **pooler** connection string.
2. Deploy to Vercel and set environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `NEXT_PUBLIC_APP_URL` (your production URL)
3. Apply migrations to production:

```bash
npx prisma migrate deploy
```

4. Verify before deploy:

```bash
npm run lint
npm run build
npx prisma migrate status
```

## Development Phases (Complete)

| Phase | Scope |
|-------|--------|
| 0 | Project setup |
| 1 | Auth & foundation |
| 2 | Subjects & profile |
| 3 | Task management |
| 4 | Dashboard & calendar |
| 5 | Analytics & polish |
| 6 | Security, testing & production readiness |

## Known v1.0 Limitations

- Profile photos are stored locally in `public/uploads/profile-photos/` (not cloud object storage)
- Login rate limiting uses in-memory storage (resets on server restart; not suitable for multi-instance production without Redis)
- Analytics aggregates all user tasks in memory (fine for typical student workloads; may need optimization at very large scale)
- Email address cannot be changed in settings
- Browser automation E2E tests are not included in CI; use `scripts/e2e-smoke-http.ts` and phase verification scripts locally

## Developer

Taskzen is designed and developed by Manish Kumar.

## License

Private project — all rights reserved.
