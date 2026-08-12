import { NextResponse } from "next/server";
import { getAndTickOwnAvatar } from "@/lib/avatarService";
import { getSpecies } from "@/species/registry";
import { stageForLevel, getVisualDetailForLevel, xpProgressWithinLevel } from "@/lib/evolution";
import { deriveMood } from "@/lib/care";

export async function GET() {
  const avatar = await getAndTickOwnAvatar();
  if (!avatar) {
    return NextResponse.json({ avatar: null });
  }

  const species = getSpecies(avatar.species_slug);
  if (!species) {
    return NextResponse.json({ error: "Unknown species." }, { status: 500 });
  }

  const progress = xpProgressWithinLevel(avatar.total_xp);
  const stage = stageForLevel(species, progress.level);
  const detail = getVisualDetailForLevel(species, progress.level);
  const mood = deriveMood({
    statHunger: Number(avatar.stat_hunger),
    statClean: Number(avatar.stat_clean),
    statEnergy: Number(avatar.stat_energy),
    statHappiness: Number(avatar.stat_happiness),
    statHealth: Number(avatar.stat_health),
    isAsleep: avatar.is_asleep,
    isSick: avatar.is_sick,
    sickSince: avatar.sick_since,
    lastTickAt: avatar.last_tick_at,
  });

  return NextResponse.json({
    avatar: {
      id: avatar.id,
      speciesSlug: avatar.species_slug,
      name: avatar.name,
      seed: avatar.seed,
      bodyColor: avatar.body_color,
      secondaryColor: avatar.secondary_color,
      faceColor: avatar.face_color,
      traits: {
        eyeVariant: avatar.eye_variant,
        mouthVariant: avatar.mouth_variant,
        earVariant: avatar.ear_variant,
        patternVariant: avatar.pattern_variant,
        personality: avatar.personality,
      },
      totalXp: avatar.total_xp,
      level: progress.level,
      xpIntoLevel: progress.xpIntoLevel,
      xpForNextLevel: progress.xpForNextLevel,
      stage: stage.id,
      stageDisplayName: stage.displayName,
      evolutionBranch: avatar.evolution_branch,
      visualDetail: detail,
      stats: {
        hunger: Number(avatar.stat_hunger),
        clean: Number(avatar.stat_clean),
        energy: Number(avatar.stat_energy),
        happiness: Number(avatar.stat_happiness),
        health: Number(avatar.stat_health),
      },
      isAsleep: avatar.is_asleep,
      isSick: avatar.is_sick,
      mood,
      hatchedAt: avatar.hatched_at,
    },
  });
}
