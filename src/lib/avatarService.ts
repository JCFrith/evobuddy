import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tickStats, applyCareAction, type AvatarStats, type CareAction } from "@/lib/care";
import {
  levelFromTotalXp,
  stageForLevel,
  deriveEvolutionBranch,
  type CareInteractionCounts,
} from "@/lib/evolution";
import { getSpecies } from "@/species/registry";
import type { EvolutionStageId } from "@/types/species";

export interface AvatarRow {
  id: string;
  user_id: string;
  species_slug: string;
  name: string;
  seed: string;
  body_color: string;
  secondary_color: string;
  face_color: string;
  eye_variant: string;
  mouth_variant: string;
  ear_variant: string;
  pattern_variant: string;
  personality: string;
  total_xp: number;
  evolution_branch: string | null;
  stat_hunger: number;
  stat_clean: number;
  stat_energy: number;
  stat_happiness: number;
  stat_health: number;
  is_asleep: boolean;
  is_sick: boolean;
  sick_since: string | null;
  last_tick_at: string;
  hatched_at: string;
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function rowToStats(row: AvatarRow): AvatarStats {
  return {
    statHunger: Number(row.stat_hunger),
    statClean: Number(row.stat_clean),
    statEnergy: Number(row.stat_energy),
    statHappiness: Number(row.stat_happiness),
    statHealth: Number(row.stat_health),
    isAsleep: row.is_asleep,
    isSick: row.is_sick,
    sickSince: row.sick_since,
    lastTickAt: row.last_tick_at,
  };
}

/**
 * Fetch the caller's avatar, apply time-based stat decay/regen up to
 * `now`, and persist the result -- the single authoritative place stat
 * decay and offline progression happen. Safe to call on every page load;
 * re-invoking immediately after is a no-op because `last_tick_at` has
 * already caught up.
 */
export async function getAndTickOwnAvatar(): Promise<AvatarRow | null> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  const admin = createSupabaseAdminClient();
  const { data: row } = await admin
    .from("avatars")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<AvatarRow>();
  if (!row) return null;

  const result = tickStats(rowToStats(row), new Date());
  if (result.hoursElapsed <= 0) return row;

  const { data: updated } = await admin
    .from("avatars")
    .update({
      stat_hunger: result.stats.statHunger,
      stat_clean: result.stats.statClean,
      stat_energy: result.stats.statEnergy,
      stat_happiness: result.stats.statHappiness,
      stat_health: result.stats.statHealth,
      is_sick: result.stats.isSick,
      sick_since: result.stats.sickSince,
      last_tick_at: result.stats.lastTickAt,
    })
    .eq("id", row.id)
    .select("*")
    .single<AvatarRow>();

  return updated ?? row;
}

export interface CareActionOutcome {
  avatar: AvatarRow;
  xpAwarded: number;
  leveledUp: boolean;
  newStage: EvolutionStageId | null;
  branchAssigned: string | null;
}

const STAGE_ORDER: EvolutionStageId[] = [
  "egg", "hatchling", "sprout", "adventurer", "guardian", "radiant",
];

/**
 * Apply one care interaction to the caller's own avatar. Ticks stat decay
 * first (so the action lands on up-to-date stats), then applies the
 * action's effect, then awards XP and re-evaluates level/stage/branch --
 * all server-side, all in one trusted call.
 */
export async function applyCareActionToOwnAvatar(
  action: CareAction,
  idempotencyKey?: string
): Promise<CareActionOutcome | { error: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not authenticated." };

  const admin = createSupabaseAdminClient();
  const { data: row } = await admin
    .from("avatars")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<AvatarRow>();
  if (!row) return { error: "No avatar found." };

  if (idempotencyKey) {
    const { data: existing } = await admin
      .from("care_interactions")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existing) {
      return { avatar: row, xpAwarded: 0, leveledUp: false, newStage: null, branchAssigned: null };
    }
  }

  const now = new Date();
  const ticked = tickStats(rowToStats(row), now);
  const afterAction = applyCareAction(ticked.stats, action);

  const species = getSpecies(row.species_slug);
  if (!species) return { error: "Unknown species." };

  const prevLevel = levelFromTotalXp(row.total_xp);
  const prevStage = stageForLevel(species, prevLevel).id;

  const { getCareActionEffect } = await import("@/lib/care");
  const xpAwarded = getCareActionEffect(action).xp;
  const newTotalXp = row.total_xp + xpAwarded;
  const newLevel = levelFromTotalXp(newTotalXp);
  const newStageId = stageForLevel(species, newLevel).id;
  const leveledUp = newLevel > prevLevel;
  const stageChanged = newStageId !== prevStage;

  let branchAssigned: string | null = row.evolution_branch;
  if (
    !row.evolution_branch &&
    STAGE_ORDER.indexOf(newStageId) >= STAGE_ORDER.indexOf("adventurer")
  ) {
    const counts = await getCareInteractionCounts(admin, row.id);
    branchAssigned = deriveEvolutionBranch(counts);
  }

  const { data: updated } = await admin
    .from("avatars")
    .update({
      stat_hunger: afterAction.statHunger,
      stat_clean: afterAction.statClean,
      stat_energy: afterAction.statEnergy,
      stat_happiness: afterAction.statHappiness,
      stat_health: afterAction.statHealth,
      is_asleep: afterAction.isAsleep,
      is_sick: afterAction.isSick,
      sick_since: afterAction.sickSince,
      last_tick_at: now.toISOString(),
      total_xp: newTotalXp,
      evolution_branch: branchAssigned,
    })
    .eq("id", row.id)
    .select("*")
    .single<AvatarRow>();

  await admin.from("care_interactions").insert({
    avatar_id: row.id,
    user_id: userId,
    action,
    xp_awarded: xpAwarded,
    idempotency_key: idempotencyKey ?? null,
  });

  await admin.from("xp_history").insert({
    avatar_id: row.id,
    user_id: userId,
    delta: xpAwarded,
    reason: `care:${action}`,
  });

  if (stageChanged) {
    await admin.from("evolution_history").insert({
      avatar_id: row.id,
      user_id: userId,
      from_stage: prevStage,
      to_stage: newStageId,
      branch: branchAssigned,
      level: newLevel,
    });
  }

  return {
    avatar: updated ?? row,
    xpAwarded,
    leveledUp,
    newStage: stageChanged ? newStageId : null,
    branchAssigned: branchAssigned !== row.evolution_branch ? branchAssigned : null,
  };
}

async function getCareInteractionCounts(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  avatarId: string
): Promise<CareInteractionCounts> {
  const { data } = await admin
    .from("care_interactions")
    .select("action")
    .eq("avatar_id", avatarId);

  const counts: CareInteractionCounts = {
    feed: 0, clean: 0, play: 0, sleep: 0, pet: 0, heal: 0, games: 0, celebrations: 0,
  };
  for (const row of data ?? []) {
    switch (row.action) {
      case "feed": counts.feed++; break;
      case "clean": counts.clean++; break;
      case "play": counts.play++; break;
      case "sleep_start": counts.sleep++; break;
      case "pet": counts.pet++; break;
      case "heal": counts.heal++; break;
      case "celebrate": counts.celebrations++; break;
    }
  }
  const { count: gamesCount } = await admin
    .from("game_history")
    .select("id", { count: "exact", head: true })
    .eq("avatar_id", avatarId);
  counts.games = gamesCount ?? 0;

  return counts;
}
