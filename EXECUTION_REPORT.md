# EvoBuddy — Execution Report

## 1. What was built

A full virtual-pet web app (Next.js 16 + TypeScript + React Three Fiber + Supabase): five original 3D creature species, onboarding with live color/trait preview, server-authoritative care/XP/evolution simulation, two mini-games, nickname+PIN auth (no GitHub/Vercel login required for players), PWA shell, and full docs/security/CI infrastructure.

## 2. Reference image → species mapping

| Reference | Species | Interpretation |
|---|---|---|
| avatar 1 | **Roundling** | Stocky, heavy-set explorer — original creature design, not a trace of the source image |
| avatar 2 | **Pixel** | Compact body, large expressive screen-like face |
| avatar 3 | **Sprint** | Athletic, long-legged build |
| avatar 4 | **Aurum** | Elegant, tall-necked, metallic-finish build |
| avatar 5 | **Wisp** | Slender body, oversized head and eyes |

Full detail (silhouette, materials, personality, evolution stages, animation support, known limitations, GLB-replacement path) is in `docs/AVATAR_SPECIES.md`.

## 3. Avatar implementation status

Procedural 3D — not GLB. This sandbox had no path to convert the reference images into production GLB assets, so each species is a genuine 3D interpretation built from parameterized primitive geometry (head/neck/torso/limbs), a shared rig driven entirely by a per-species data manifest (`AvatarSpecies`), canvas-generated pattern textures, and `useFrame`-driven animation (idle/walk/eat/sleep/play/celebrate/sick, mood-driven expressions, personality-based animation speed). This is real, working 3D — not a stub or a static image — with a documented swap-in path for production GLBs later (`ART_PIPELINE.md`) that requires no changes to gameplay code.

## 4. What fully works

- Independent body/secondary/face color selection per avatar
- Randomized eyes/mouth/ears/pattern/personality, deterministic after hatch (same seed always reproduces the same avatar)
- Onboarding: rotate/zoom/idle preview, "Surprise Me Again" reroll, species selection, live trait preview, hatch
- Evolution: Egg → Hatchling → Sprout → Adventurer → Guardian → Radiant, with continuous visual detail scaling every level (not just at stage boundaries), and 6 positive branches (Scholar/Explorer/Guardian/Dreamer/Performer/Balanced) derived server-side from interaction history
- Care loop: feed/clean/play/pet/celebrate/sleep-toggle/heal, with time-based offline stat decay and illness trigger/recovery
- Two mini-games (memory-match, reflex-tap) with server-issued/verified session tokens and plausibility-checked scores
- Nickname+PIN auth, PIN recovery via one-time code, rate limiting on login and recovery
- PWA shell (manifest, service worker, install-ready, offline app shell)

## 5. Not fully verified / known gaps

- **Photo Mode**: `AvatarViewport.capturePhoto()` exists and can bump render resolution, but there's no dedicated Photo Mode button/UI wired into the pet dashboard yet. Scaffolded, not user-facing.
- **Playwright e2e** (`tests/e2e/five-avatar-flow.spec.ts`, covering onboarding→hatch→persistence for all 5 species): written but **not executed** — needs a live Supabase backend, which doesn't exist yet (see §7).
- No dedicated automated accessibility audit was run (manual ARIA labels / focus-visible / reduced-motion support are in place, but not machine-verified).

## 6. Test results

- Unit tests: **74/74 passing** (`vitest run`) — species-contract validation (12+ checks per species), evolution/XP math, care/stat-decay logic, game session/scoring logic.
- `npx eslint .`: 0 errors.
- `npx tsc --noEmit`: 0 errors.
- Custom secret-hygiene script (`scripts/check-secret-hygiene.mjs`): passes — no `NEXT_PUBLIC_`-prefixed secrets, no tracked `.env` file, no real keys in `.env.example`.

## 7. Build result

`npm run build`: succeeds. 16 routes (5 static, 9 dynamic API/app routes, 1 middleware/proxy, 1 not-found).

## 8. Supabase status

**Not provisioned** — per your explicit "hold off" decision on the $10/month cost. Everything is ready to apply the moment you say go: full schema (`supabase/migrations/0001_core_schema.sql`), RLS policies + column-level privilege revokes as defense-in-depth against client-side XP/level/timestamp tampering (`0002_rls_and_privileges.sql`), and a dev-only seed file. Until then, the live Vercel deployment runs on placeholder env vars — the UI renders but auth/data don't actually persist.

## 9. GitHub / CI status

Repo created and pushed: **github.com/JCFrith/evobuddy** (private), 6 commits, full history preserved.

Important operational note: this sandbox proxies all GitHub API traffic through an Anthropic-controlled gateway that only allows access to repos a session was pre-bound to at launch — which none was, since this session didn't originate from a GitHub Actions trigger. That blocked repo creation and push entirely from here, **regardless of which token was used**, including your own PAT. You ended up pushing the code yourself from your machine, and branch protection / required CI status checks on `main` need to be set up by you via the GitHub UI (github.com/JCFrith/evobuddy/settings/rules/new) for the same reason — I can't confirm from here whether that's been done, or whether the CI workflow run itself passed. Worth checking the Actions tab and letting me know.

CI config is in place either way: `.github/workflows/ci.yml` (lint/typecheck/test/build/secret-hygiene, with placeholder-fallback env vars so it runs green without real Supabase secrets), `.github/workflows/e2e.yml` (no-ops gracefully without live Supabase test credentials), Dependabot, CODEOWNERS.

## 10. Vercel status

**Live**: evobuddy-rho.vercel.app, connected via GitHub git integration, deploying from `main`. Confirmed rendering correctly (login screen) after placeholder Supabase env vars were added. Same API-access gap as GitHub applies here too — this session's Vercel MCP tools can't see this project, so build logs/deployment status need to come from you via the dashboard until that's resolved.

## 11. What real GLB art would add

The procedural rig is functionally complete but visually generic compared to hand-authored art: production GLBs (per the `ART_PIPELINE.md` asset contract — named material slots `body`/`secondary`/`face`, named animation clips, morph targets for expressions) would add per-species silhouette distinctiveness beyond parameterized primitives, hand-sculpted detail at higher evolution stages, and custom accessory geometry instead of the current primitive-based accessory bits (cone crests, headband torus, etc.).

## Still needs a decision from you

1. Provision real Supabase project (currently on hold)
2. Confirm branch protection + required CI checks are set up on `main`
3. Confirm the CI Actions run actually passed
4. Once Supabase exists: run the 5-avatar Playwright e2e suite against it, and swap real env vars into Vercel
