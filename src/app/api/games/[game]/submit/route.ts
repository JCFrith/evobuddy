import { NextResponse } from "next/server";
import { z } from "zod";
import { GAMES, type GameSlug, verifyGameSession, validateScore, xpForScore } from "@/lib/games";
import { getAuthenticatedUserId } from "@/lib/avatarService";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { tickStats, type AvatarStats } from "@/lib/care";
import { levelFromTotalXp, stageForLevel, deriveEvolutionBranch } from "@/lib/evolution";
import { getSpecies } from "@/species/registry";

const bodySchema = z.object({
  sessionToken: z.string().min(10),
  score: z.number().int().min(0),
  durationMs: z.number().int().min(0),
});

const STAGE_ORDER = ["egg", "hatchling", "sprout", "adventurer", "guardian", "radiant"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ game: string }> }
) {
  const { game } = await params;
  if (!(game in GAMES)) {
    return NextResponse.json({ error: "Unknown game." }, { status: 400 });
  }
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { sessionToken, score, durationMs } = parsed.data;

  const admin = createSupabaseAdminClient();
  const { data: avatar } = await admin
    .from("avatars")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!avatar) {
    return NextResponse.json({ error: "No avatar found." }, { status: 400 });
  }

  const session = verifyGameSession(sessionToken, avatar.id, game as GameSlug);
  if (!session.ok) {
    return NextResponse.json({ error: session.reason }, { status: 400 });
  }
  const scoreCheck = validateScore(game as GameSlug, score, durationMs);
  if (!scoreCheck.valid) {
    return NextResponse.json({ error: scoreCheck.reason }, { status: 400 });
  }

  // One-time use: the unique constraint on session_token rejects replay.
  const xpAwarded = xpForScore(game as GameSlug, score);
  const { error: insertError } = await admin.from("game_history").insert({
    avatar_id: avatar.id,
    user_id: userId,
    game_slug: game,
    score,
    xp_awarded: xpAwarded,
    session_token: sessionToken,
  });
  if (insertError) {
    return NextResponse.json({ error: "This game session was already submitted." }, { status: 409 });
  }

  // Tick stats up to now, apply a small happiness bump for playing, then XP.
  const now = new Date();
  const stats: AvatarStats = {
    statHunger: Number(avatar.stat_hunger),
    statClean: Number(avatar.stat_clean),
    statEnergy: Number(avatar.stat_energy),
    statHappiness: Number(avatar.stat_happiness),
    statHealth: Number(avatar.stat_health),
    isAsleep: avatar.is_asleep,
    isSick: avatar.is_sick,
    sickSince: avatar.sick_since,
    lastTickAt: avatar.last_tick_at,
  };
  const ticked = tickStats(stats, now);
  const newHappiness = Math.min(100, ticked.stats.statHappiness + 6);

  const species = getSpecies(avatar.species_slug);
  const prevLevel = levelFromTotalXp(avatar.total_xp);
  const newTotalXp = avatar.total_xp + xpAwarded;
  const newLevel = levelFromTotalXp(newTotalXp);
  let branchAssigned: string | null = avatar.evolution_branch;
  let newStageId: string | null = null;

  if (species) {
    const prevStage = stageForLevel(species, prevLevel).id;
    const nextStage = stageForLevel(species, newLevel).id;
    if (
      !avatar.evolution_branch &&
      STAGE_ORDER.indexOf(nextStage) >= STAGE_ORDER.indexOf("adventurer")
    ) {
      const { data: interactions } = await admin
        .from("care_interactions")
        .select("action")
        .eq("avatar_id", avatar.id);
      const { count: gamesCount } = await admin
        .from("game_history")
        .select("id", { count: "exact", head: true })
        .eq("avatar_id", avatar.id);
      const counts = { feed: 0, clean: 0, play: 0, sleep: 0, pet: 0, heal: 0, celebrations: 0, games: gamesCount ?? 0 };
      for (const row of interactions ?? []) {
        if (row.action in counts) (counts as Record<string, number>)[row.action] += 1;
      }
      branchAssigned = deriveEvolutionBranch(counts);
    }
    if (nextStage !== prevStage) {
      newStageId = nextStage;
      await admin.from("evolution_history").insert({
        avatar_id: avatar.id,
        user_id: userId,
        from_stage: prevStage,
        to_stage: nextStage,
        branch: branchAssigned,
        level: newLevel,
      });
    }
  }

  await admin
    .from("avatars")
    .update({
      stat_hunger: ticked.stats.statHunger,
      stat_clean: ticked.stats.statClean,
      stat_energy: ticked.stats.statEnergy,
      stat_happiness: newHappiness,
      stat_health: ticked.stats.statHealth,
      is_sick: ticked.stats.isSick,
      sick_since: ticked.stats.sickSince,
      last_tick_at: now.toISOString(),
      total_xp: newTotalXp,
      evolution_branch: branchAssigned,
    })
    .eq("id", avatar.id);

  await admin.from("xp_history").insert({
    avatar_id: avatar.id,
    user_id: userId,
    delta: xpAwarded,
    reason: `game:${game}`,
  });

  return NextResponse.json({
    xpAwarded,
    leveledUp: newLevel > prevLevel,
    newStage: newStageId,
    branchAssigned: branchAssigned !== avatar.evolution_branch ? branchAssigned : null,
  });
}
