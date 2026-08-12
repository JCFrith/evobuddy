-- Synthetic seed data for LOCAL DEVELOPMENT and PREVIEW environments only.
--
-- Per CLAUDE.md: "Preview environments must use fake seed users and
-- synthetic avatar data" and "Never copy children's production data into a
-- Preview environment." This file must never be run against the
-- Production Supabase project.
--
-- Nickname: "seed-explorer"  PIN: "482913"  (dev/preview credential only)

do $$
declare
  seed_user_id uuid := '00000000-0000-0000-0000-000000000001';
  seed_alias text := 'seed-explorer-alias-fixture';
begin
  if not exists (select 1 from auth.users where id = seed_user_id) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) values (
      '00000000-0000-0000-0000-000000000000',
      seed_user_id,
      'authenticated',
      'authenticated',
      seed_alias || '@auth.internal',
      crypt('482913', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"nickname_pin","providers":["nickname_pin"]}',
      '{}'
    );
  end if;

  insert into evobuddy.profiles (id, nickname, nickname_normalized, auth_alias)
  values (seed_user_id, 'seed-explorer', 'seed-explorer', seed_alias)
  on conflict (id) do nothing;

  insert into evobuddy.avatars (
    user_id, species_slug, name, seed,
    body_color, secondary_color, face_color,
    eye_variant, mouth_variant, ear_variant, pattern_variant, personality,
    total_xp, stat_hunger, stat_clean, stat_energy, stat_happiness, stat_health
  ) values (
    seed_user_id, 'sprint', 'Dash', 'seed-fixture-001',
    '#f5f3ee', '#e8722c', '#0f2230',
    'almond-glow', 'grin', 'wire-antenna', 'racing-stripe', 'energetic',
    950, 82, 90, 75, 88, 100
  )
  on conflict (user_id) do nothing;
end $$;
