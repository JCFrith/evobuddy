import type {
  AvatarSpecies,
  EvolutionBranch,
  EvolutionStage,
  EvolutionStageId,
} from "@/types/species";

/**
 * XP / leveling curve. Server-authoritative — see
 * src/app/api/care/[action]/route.ts and src/lib/xp.ts. Deliberately shared
 * across all five species so no creature levels "faster" than another.
 */
export const MAX_LEVEL = 40;

export function xpRequiredForLevel(level: number): number {
  // Cumulative XP needed to REACH `level` from level 1.
  if (level <= 1) return 0;
  return Math.round(50 * Math.pow(level, 1.65));
}

export function levelFromTotalXp(totalXp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && totalXp >= xpRequiredForLevel(level + 1)) {
    level++;
  }
  return level;
}

export function xpProgressWithinLevel(totalXp: number) {
  const level = levelFromTotalXp(totalXp);
  const floor = xpRequiredForLevel(level);
  const ceil = level >= MAX_LEVEL ? floor : xpRequiredForLevel(level + 1);
  const span = Math.max(1, ceil - floor);
  return {
    level,
    xpIntoLevel: totalXp - floor,
    xpForNextLevel: span,
    ratio: Math.min(1, (totalXp - floor) / span),
  };
}

/** Level ranges that map onto the six required stages. Shared across species. */
export const STAGE_LEVEL_RANGES: Record<
  EvolutionStageId,
  { min: number; max: number }
> = {
  egg: { min: 0, max: 0 },
  hatchling: { min: 1, max: 5 },
  sprout: { min: 6, max: 12 },
  adventurer: { min: 13, max: 22 },
  guardian: { min: 23, max: 32 },
  radiant: { min: 33, max: MAX_LEVEL },
};

export function stageForLevel(
  species: AvatarSpecies,
  level: number
): EvolutionStage {
  const stage = species.evolutionStages
    .slice()
    .sort((a, b) => a.minLevel - b.minLevel)
    .filter((s) => level >= s.minLevel)
    .pop();
  return stage ?? species.evolutionStages[0];
}

/**
 * Continuous per-level visual detail interpolation so growth reads as
 * gradual rather than a hard jump at each of the 6 major stages — "every
 * level must cause some visible advancement."
 */
export function getVisualDetailForLevel(species: AvatarSpecies, level: number) {
  const sorted = species.evolutionStages
    .slice()
    .sort((a, b) => a.minLevel - b.minLevel);
  let lower = sorted[0];
  let upper = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].minLevel <= level) lower = sorted[i];
    if (sorted[i].minLevel > level) {
      upper = sorted[i];
      break;
    }
  }
  const span = Math.max(1, upper.minLevel - lower.minLevel);
  const t = upper === lower ? 1 : Math.min(1, (level - lower.minLevel) / span);
  const lerp = (a: number, b: number) => a + (b - a) * t;
  return {
    stageId: lower.id,
    silhouetteComplexity: lerp(
      lower.detail.silhouetteComplexity,
      upper.detail.silhouetteComplexity
    ),
    materialSophistication: lerp(
      lower.detail.materialSophistication,
      upper.detail.materialSophistication
    ),
    glow: lerp(lower.detail.glow, upper.detail.glow),
    accessoryProminence: lerp(
      lower.detail.accessoryProminence,
      upper.detail.accessoryProminence
    ),
    scale: lerp(lower.detail.scale, upper.detail.scale),
  };
}

/** Running counters of care interactions, used to determine the evolution branch. */
export interface CareInteractionCounts {
  feed: number;
  clean: number;
  play: number;
  sleep: number;
  pet: number;
  heal: number;
  games: number;
  celebrations: number;
}

/**
 * Deterministically derive the positive evolution branch from accumulated
 * care history once a pet reaches "adventurer" (level 13). This runs
 * server-side only — the client never selects or transmits a branch value.
 */
export function deriveEvolutionBranch(
  counts: CareInteractionCounts
): EvolutionBranch {
  // Each branch's formula is deliberately normalized to a comparable scale
  // (no branch structurally out-scores another under even interaction
  // counts) so "balanced" is reachable, not just theoretical.
  const scores: Record<EvolutionBranch, number> = {
    scholar: counts.games * 2.2,
    explorer: counts.play * 2.2,
    guardian: (counts.clean + counts.heal) * 1.1,
    dreamer: (counts.sleep + counts.pet) * 1.1,
    performer: counts.celebrations * 2.2,
    balanced: 0,
  };
  const realBranchScores = Object.entries(scores)
    .filter(([k]) => k !== "balanced")
    .map(([, v]) => v);
  const max = Math.max(...realBranchScores);
  const min = Math.min(...realBranchScores);
  const total = realBranchScores.reduce((s, v) => s + v, 0);

  // If interactions are too sparse or too evenly spread, the pet stays
  // "balanced" rather than committing to a branch prematurely.
  if (total < 10 || max - min < total * 0.12) {
    return "balanced";
  }
  const [topBranch] = (Object.entries(scores) as [EvolutionBranch, number][])
    .filter(([k]) => k !== "balanced")
    .sort((a, b) => b[1] - a[1])[0];
  return topBranch;
}
