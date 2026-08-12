import type { ResolvedTraits, EvolutionStageId } from "@/types/species";
import type { Mood } from "@/lib/care";

export interface AvatarSummary {
  id: string;
  speciesSlug: string;
  name: string;
  seed: string;
  bodyColor: string;
  secondaryColor: string;
  faceColor: string;
  traits: ResolvedTraits;
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  stage: EvolutionStageId;
  stageDisplayName: string;
  evolutionBranch: string | null;
  visualDetail: {
    stageId: EvolutionStageId;
    silhouetteComplexity: number;
    materialSophistication: number;
    glow: number;
    accessoryProminence: number;
    scale: number;
  };
  stats: {
    hunger: number;
    clean: number;
    energy: number;
    happiness: number;
    health: number;
  };
  isAsleep: boolean;
  isSick: boolean;
  mood: Mood;
  hatchedAt: string;
}
