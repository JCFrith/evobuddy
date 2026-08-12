-- EvoBuddy core schema.
-- Species/evolution/trait *definitions* live in application code
-- (src/species/registry.ts) as the single source of truth; the database
-- only stores which values a given avatar resolved to, plus constraints
-- that keep those values inside the known-valid set.
--
-- Everything lives in a dedicated `evobuddy` schema rather than `public`
-- because this Supabase project is shared with an unrelated app that
-- already owns `public` (including its own `profiles` table) -- keeping
-- EvoBuddy fully namespaced avoids any collision with that app's tables
-- and makes the two applications' data trivially separable.

create schema if not exists evobuddy;
grant usage on schema evobuddy to anon, authenticated, service_role;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- profiles: one row per application user, 1:1 with auth.users.
-- `auth_alias` is the internal HMAC-derived identifier used only by the
-- trusted login route handler to authenticate against Supabase Auth. It
-- is never selected by any client-facing query path in this app.
-- ---------------------------------------------------------------------
create table if not exists evobuddy.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null unique,
  nickname_normalized text not null unique,
  auth_alias text not null unique,
  parent_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column evobuddy.profiles.auth_alias is
  'Server-only internal auth identifier (HMAC of normalized nickname). Never expose to the browser.';

-- ---------------------------------------------------------------------
-- avatars: one pet per user for this release.
-- ---------------------------------------------------------------------
create table if not exists evobuddy.avatars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,

  species_slug text not null check (
    species_slug in ('roundling', 'pixel', 'sprint', 'aurum', 'wisp')
  ),
  name text not null check (char_length(name) between 1 and 20),
  seed text not null,

  body_color text not null check (body_color ~ '^#[0-9a-fA-F]{6}$'),
  secondary_color text not null check (secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  face_color text not null check (face_color ~ '^#[0-9a-fA-F]{6}$'),

  eye_variant text not null,
  mouth_variant text not null,
  ear_variant text not null,
  pattern_variant text not null,
  personality text not null,

  -- Authoritative progression state. Column-level privileges in
  -- 0002_rls_and_privileges.sql prevent the `authenticated` role from
  -- writing any of these directly; only the service role (trusted route
  -- handlers) may.
  total_xp bigint not null default 0 check (total_xp >= 0),
  evolution_branch text check (
    evolution_branch in ('scholar', 'explorer', 'guardian', 'dreamer', 'performer', 'balanced')
  ),

  stat_hunger numeric(5,2) not null default 100 check (stat_hunger between 0 and 100),
  stat_clean numeric(5,2) not null default 100 check (stat_clean between 0 and 100),
  stat_energy numeric(5,2) not null default 100 check (stat_energy between 0 and 100),
  stat_happiness numeric(5,2) not null default 100 check (stat_happiness between 0 and 100),
  stat_health numeric(5,2) not null default 100 check (stat_health between 0 and 100),
  is_asleep boolean not null default false,
  is_sick boolean not null default false,
  sick_since timestamptz,

  -- Authoritative clock anchor for stat decay / offline progression.
  -- Always set from the DB server clock (`now()`), never from a
  -- client-supplied timestamp.
  last_tick_at timestamptz not null default now(),

  hatched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists avatars_user_id_idx on evobuddy.avatars (user_id);

-- ---------------------------------------------------------------------
-- care_interactions: append-only audit log of every care action, and the
-- source data for deriving the positive evolution branch.
-- ---------------------------------------------------------------------
create table if not exists evobuddy.care_interactions (
  id uuid primary key default gen_random_uuid(),
  avatar_id uuid not null references evobuddy.avatars (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (
    action in ('feed', 'clean', 'play', 'sleep_start', 'sleep_end', 'pet', 'heal', 'celebrate')
  ),
  xp_awarded int not null default 0,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);

create index if not exists care_interactions_avatar_idx on evobuddy.care_interactions (avatar_id, created_at desc);

-- ---------------------------------------------------------------------
-- xp_history: append-only ledger. total_xp on `avatars` is a
-- server-maintained cache of the sum of this ledger.
-- ---------------------------------------------------------------------
create table if not exists evobuddy.xp_history (
  id uuid primary key default gen_random_uuid(),
  avatar_id uuid not null references evobuddy.avatars (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  delta int not null,
  reason text not null,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);

create index if not exists xp_history_avatar_idx on evobuddy.xp_history (avatar_id, created_at desc);

-- ---------------------------------------------------------------------
-- game_history: mini-game results. `session_token` makes submission
-- idempotent/anti-replay -- the same play session can only ever be
-- scored once.
-- ---------------------------------------------------------------------
create table if not exists evobuddy.game_history (
  id uuid primary key default gen_random_uuid(),
  avatar_id uuid not null references evobuddy.avatars (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  game_slug text not null check (game_slug in ('memory-match', 'reflex-tap')),
  score int not null check (score >= 0),
  xp_awarded int not null default 0,
  session_token text not null unique,
  played_at timestamptz not null default now()
);

create index if not exists game_history_avatar_idx on evobuddy.game_history (avatar_id, played_at desc);

-- ---------------------------------------------------------------------
-- evolution_history: append-only record of every stage/branch change.
-- ---------------------------------------------------------------------
create table if not exists evobuddy.evolution_history (
  id uuid primary key default gen_random_uuid(),
  avatar_id uuid not null references evobuddy.avatars (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  from_stage text not null,
  to_stage text not null,
  branch text,
  level int not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- login_attempts / recovery_attempts: rate limiting + no user-enumeration.
-- ---------------------------------------------------------------------
create table if not exists evobuddy.login_attempts (
  id uuid primary key default gen_random_uuid(),
  nickname_normalized text not null,
  ip_hash text not null,
  success boolean not null,
  attempted_at timestamptz not null default now()
);

create index if not exists login_attempts_lookup_idx
  on evobuddy.login_attempts (nickname_normalized, attempted_at desc);
create index if not exists login_attempts_ip_idx
  on evobuddy.login_attempts (ip_hash, attempted_at desc);

create table if not exists evobuddy.recovery_attempts (
  id uuid primary key default gen_random_uuid(),
  nickname_normalized text not null,
  ip_hash text not null,
  success boolean not null,
  attempted_at timestamptz not null default now()
);

create index if not exists recovery_attempts_lookup_idx
  on evobuddy.recovery_attempts (nickname_normalized, attempted_at desc);

create table if not exists evobuddy.recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  code_hash text not null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index if not exists recovery_codes_user_idx on evobuddy.recovery_codes (user_id);

-- updated_at maintenance
create or replace function evobuddy.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on evobuddy.profiles;
create trigger profiles_set_updated_at
  before update on evobuddy.profiles
  for each row execute function evobuddy.set_updated_at();

drop trigger if exists avatars_set_updated_at on evobuddy.avatars;
create trigger avatars_set_updated_at
  before update on evobuddy.avatars
  for each row execute function evobuddy.set_updated_at();
