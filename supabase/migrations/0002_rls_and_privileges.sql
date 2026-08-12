-- Row Level Security + column-level privileges.
--
-- Threat model this file defends against:
--   * A user reading or modifying another user's row by guessing/changing
--     an id in a client request.
--   * A user calling the Supabase REST API directly (bypassing our route
--     handlers) to set their own XP, level, evolution branch, stats, or
--     timestamps.
--   * A user inserting fabricated rows into append-only history tables.
--
-- All XP/stat/evolution/timestamp mutations happen exclusively through
-- trusted Next.js Route Handlers using the service-role key, which bypasses
-- RLS by design (Supabase's documented trusted-server pattern). Everything
-- in this file governs what the `authenticated` (browser, user JWT) role
-- may do directly.

alter table public.profiles enable row level security;
alter table public.avatars enable row level security;
alter table public.care_interactions enable row level security;
alter table public.xp_history enable row level security;
alter table public.game_history enable row level security;
alter table public.evolution_history enable row level security;
alter table public.login_attempts enable row level security;
alter table public.recovery_attempts enable row level security;
alter table public.recovery_codes enable row level security;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- No client insert/update/delete policy exists for profiles: rows are
-- created exclusively by the registration route handler using the
-- service-role key, so no policy is needed for that path and none is
-- granted here for the browser role.

revoke all on public.profiles from authenticated, anon;
grant select on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- avatars
-- ---------------------------------------------------------------------
create policy "avatars_select_own" on public.avatars
  for select to authenticated
  using (user_id = auth.uid());

-- Hatching is the one client-initiated insert in this schema. The route
-- handler still re-validates species/trait/color legality server-side
-- before performing it (defense in depth beyond the CHECK constraints).
create policy "avatars_insert_own" on public.avatars
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "avatars_update_own" on public.avatars
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.avatars from authenticated, anon;
grant select, insert on public.avatars to authenticated;

-- Column-level privileges: the browser may only ever rename its own pet.
-- Every progression/stat/timestamp column is revoked from `authenticated`
-- so even a hand-crafted REST call against Supabase directly cannot set
-- XP, evolution branch, stats, or the offline-progression clock anchor.
grant update (name) on public.avatars to authenticated;

-- ---------------------------------------------------------------------
-- Append-only history tables: browser may read its own rows; all writes
-- happen server-side with the service role.
-- ---------------------------------------------------------------------
create policy "care_interactions_select_own" on public.care_interactions
  for select to authenticated using (user_id = auth.uid());
revoke all on public.care_interactions from authenticated, anon;
grant select on public.care_interactions to authenticated;

create policy "xp_history_select_own" on public.xp_history
  for select to authenticated using (user_id = auth.uid());
revoke all on public.xp_history from authenticated, anon;
grant select on public.xp_history to authenticated;

create policy "game_history_select_own" on public.game_history
  for select to authenticated using (user_id = auth.uid());
revoke all on public.game_history from authenticated, anon;
grant select on public.game_history to authenticated;

create policy "evolution_history_select_own" on public.evolution_history
  for select to authenticated using (user_id = auth.uid());
revoke all on public.evolution_history from authenticated, anon;
grant select on public.evolution_history to authenticated;

-- login_attempts / recovery_attempts / recovery_codes: never readable or
-- writable by the browser at all. Rate limiting and recovery are entirely
-- server-side (service role) concerns.
revoke all on public.login_attempts from authenticated, anon;
revoke all on public.recovery_attempts from authenticated, anon;
revoke all on public.recovery_codes from authenticated, anon;
-- (No policies are created for these three tables, so with RLS enabled
-- and all privileges revoked, the browser role has zero access under any
-- circumstance -- default-deny.)
