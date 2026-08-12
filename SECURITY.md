# Security

This document maps each security requirement to its actual implementation
so it can be verified, not just asserted.

## Secrets never reach the browser

- `SUPABASE_SECRET_KEY`, `AUTH_ALIAS_SECRET`, `RECOVERY_CODE_SECRET`,
  `RATE_LIMIT_SECRET` are read only in files that start with
  `import "server-only"` (`src/lib/supabase/admin.ts`,
  `src/lib/auth/alias.ts`, `src/lib/auth/rateLimit.ts`,
  `src/lib/auth/recoveryCode.ts`). The `server-only` package makes any
  accidental import of these files from a Client Component a **build-time
  error**, not a runtime leak.
- Only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  and `NEXT_PUBLIC_APP_URL` are exposed to the browser bundle.

## PINs are never logged

- The login/register/recover route handlers (`src/app/api/auth/*/route.ts`)
  never `console.log` the request body or the PIN. Errors returned to the
  client are static, generic strings — never an echo of user input.
- Supabase Auth itself stores the PIN as a bcrypt-hashed password; the
  plaintext PIN exists only transiently in the request body and Supabase's
  own auth call.

## Internal auth alias never returned to the browser

- `deriveAuthAlias()` (`src/lib/auth/alias.ts`) computes an HMAC-SHA256 of
  the normalized nickname using a server-only secret. It's used to build a
  synthetic Supabase Auth identity (`${alias}@auth.internal`) but is never
  included in any JSON response — every route handler returns only
  `{ nickname }` or a generic error.
- `profiles.auth_alias` has no `SELECT` grant for the `authenticated` role
  (see `supabase/migrations/0002_rls_and_privileges.sql`) — even a
  hand-crafted REST call with a valid user JWT cannot read it.

## Every exposed user-data table has RLS

All nine application tables (`profiles`, `avatars`, `care_interactions`,
`xp_history`, `game_history`, `evolution_history`, `login_attempts`,
`recovery_attempts`, `recovery_codes`) have
`alter table ... enable row level security` plus explicit policies (or, for
the three tables the browser should never touch at all, no policies and a
blanket `revoke all`) in `supabase/migrations/0002_rls_and_privileges.sql`.

## Users cannot modify another user's avatar by changing IDs

- Every `avatars` RLS policy is scoped `using (user_id = auth.uid())`.
- Every server-side query in `src/lib/avatarService.ts` additionally
  filters `.eq("user_id", userId)` even when using the service-role client
  (which bypasses RLS) — defense in depth, not reliance on a single layer.

## Clients cannot directly award XP / change levels / select evolution results / manipulate timestamps

This is enforced at the **database column-privilege level**, not just in
application code:

```sql
grant update (name) on evobuddy.avatars to authenticated;
```

(`supabase/migrations/0002_rls_and_privileges.sql`) — the `authenticated`
Postgres role has `UPDATE` on exactly one column (`name`). `total_xp`,
`evolution_branch`, every `stat_*` column, `is_asleep`, `is_sick`,
`sick_since`, and `last_tick_at` all have `UPDATE` revoked from that role.
Even a valid, signed-in user's JWT sent directly to Supabase's REST API
(bypassing the Next.js app entirely) cannot change any of those columns.

All actual XP/level/evolution/stat writes happen exclusively inside
`src/lib/avatarService.ts`, `src/app/api/care/[action]/route.ts`, and
`src/app/api/games/[game]/submit/route.ts`, using the service-role client
— and even there, level/stage/branch are always **computed** from
`total_xp` via `src/lib/evolution.ts`, never accepted as input.

`last_tick_at` is always set from `new Date().toISOString()` computed
inside the trusted route handler (effectively the server clock at request
time) — the client never supplies a timestamp that's persisted.

## Offline actions are idempotent

- `tickStats()` (`src/lib/care.ts`) is a pure function of
  `(current stats, lastTickAt, now)`. Re-invoking it with the same or a
  very close `now` after `lastTickAt` has already caught up produces zero
  additional change (`hoursElapsed <= 0` short-circuits).
- Care actions accept an optional client-generated `idempotencyKey`;
  `care_interactions.idempotency_key` is a unique column, so a retried
  request with the same key is detected and skipped rather than
  double-applied (`src/lib/avatarService.ts`).
- Game submissions are idempotent by construction: `game_history.session_token`
  is unique, and a session token is single-use (verified, then consumed by
  the insert; a second submission attempt fails the unique constraint).

## Recovery attempts are rate-limited

- `src/lib/auth/rateLimit.ts` implements a sliding-window check backed by
  the `login_attempts` and `recovery_attempts` tables (15-minute window,
  max 8 failed attempts per nickname / 20 per IP for login; 60-minute
  window, max 5 attempts per nickname-or-IP for recovery).
- IPs are never stored raw — `hashIp()` HMACs them with a server-only
  secret before any database write.

## Authentication failures don't expose whether a nickname exists

- `POST /api/auth/login` returns the exact same `401 { error: "Invalid
  nickname or PIN." }` whether the nickname doesn't exist or the PIN is
  wrong — Supabase's `signInWithPassword` itself already returns a
  generic "Invalid login credentials" error for both cases against a
  synthetic alias-based identity, so there's no code path that could leak
  the distinction.
- `POST /api/auth/recover` uses the same generic-error pattern.
- `POST /api/auth/register` returns a generic "that nickname isn't
  available" message on collision rather than confirming an account
  exists.

## Supabase advisors

Run `mcp__Supabase__get_advisors` (security and performance) against the
provisioned project after every migration and before shipping; see the
execution report for the results from this build's provisioning run.
