# EvoBuddy

A virtual-pet app: hatch one of five original 3D creature species, care for
it, play mini-games, and watch it evolve through six major stages plus six
positive personality branches. Built with Next.js (App Router), React
Three Fiber, and Supabase.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) — UI + trusted
  server-side Route Handlers
- **React Three Fiber / Three.js / drei** — procedural 3D avatars (see
  `ART_PIPELINE.md`)
- **Supabase** — Auth, Postgres, Row Level Security
- **Vercel** — hosting, Preview deployments
- **Vitest** — unit tests · **Playwright** — end-to-end tests

## Getting started locally

```bash
npm install
cp .env.example .env.local   # fill in real Supabase project values
npm run dev
```

You need a Supabase project with the migrations in `supabase/migrations/`
applied (see "Database" below) before auth/avatar features work — the app
will build and the static pages will render without one, but every
`/api/*` route depends on Supabase.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Serve a production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end tests (builds + serves the app first; see `playwright.config.ts`) |

## Project structure

```
src/
  types/species.ts        # AvatarSpecies contract — the five-species architecture
  species/                # One manifest file per species + the registry
  lib/                    # Pure logic: evolution/XP math, care simulation,
                           # auth, rate limiting, games, Supabase clients
  components/avatar3d/    # Procedural 3D rig + parts (eyes/mouth/ears/pattern)
  components/onboarding/  # Species picker, color pickers
  components/dashboard/   # Stat bars, care action bar
  components/games/       # Memory Match, Reflex Tap
  app/                     # Routes: /, /login, /onboarding, /pet, /games/*,
                           # /api/auth/*, /api/avatar/*, /api/care/*, /api/games/*
supabase/
  migrations/              # Versioned schema + RLS (source of truth for the DB)
  seed.sql                 # Synthetic dev/Preview-only seed data
docs/AVATAR_SPECIES.md     # Design doc for all five species
ART_PIPELINE.md            # Procedural asset contract + GLB replacement path
SECURITY.md                # Security requirement -> implementation mapping
tests/unit/                # Vitest
tests/e2e/                 # Playwright
```

## Database

All schema changes live in `supabase/migrations/`, applied in order:

1. `0001_core_schema.sql` — tables, constraints, indexes
2. `0002_rls_and_privileges.sql` — Row Level Security policies +
   column-level privilege revokes (this is what stops a client from
   writing its own XP/level/evolution/timestamps — see `SECURITY.md`)

Apply with the Supabase CLI (`supabase db push`) or the Supabase MCP
`apply_migration` tool. `supabase/seed.sql` is synthetic data for local
dev / Preview environments only — never run it against Production.

## Authentication

Nickname + PIN, parent-created, backed by Supabase Auth via a synthetic
per-user alias (see `src/lib/auth/alias.ts` and `SECURITY.md`). Supabase
remains the authoritative identity provider; there is no GitHub/Vercel
login for players.

## Environment variables

See `.env.example`. Public (`NEXT_PUBLIC_*`) values are safe for the
browser bundle; everything else is server-only and must never be
committed.

## CI / CD

- `.github/workflows/ci.yml` — install, lint, typecheck, unit tests,
  build on every push/PR.
- `.github/workflows/e2e.yml` — Playwright, on a separate workflow so it
  doesn't block fast feedback from the main CI run.
- Vercel Preview deployments are created per pull request; `main` deploys
  to Production. See the "GitHub, Vercel, and Supabase Delivery
  Architecture" section of `CLAUDE.md` for the full environment-isolation
  policy this repo follows.

## Docs

- `docs/AVATAR_SPECIES.md` — the five species, their design rationale, and
  how to replace a procedural species with a production GLB.
- `ART_PIPELINE.md` — the exact asset contract (materials, animation clip
  names, morph targets) a production art pipeline should target.
- `SECURITY.md` — security requirements mapped to their implementation.
