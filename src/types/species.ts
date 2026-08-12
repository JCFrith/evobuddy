/**
 * Core five-species architecture.
 *
 * Every avatar species — no matter how different its silhouette — implements
 * this same contract. The pet simulation, onboarding flow, evolution engine,
 * and animation controller are all written against `AvatarSpecies` and never
 * against a specific creature. Adding a 6th species means adding one more
 * entry to `src/species/registry.ts`; nothing else in the app has to change.
 */

export type EvolutionStageId =
  | "egg"
  | "hatchling"
  | "sprout"
  | "adventurer"
  | "guardian"
  | "radiant";

/**
 * Positive evolution branches. Selected server-side once a pet reaches the
 * "adventurer" stage, based on accumulated care-interaction history (see
 * src/lib/evolution.ts). Never selectable directly by the client.
 */
export type EvolutionBranch =
  | "scholar"
  | "explorer"
  | "guardian"
  | "dreamer"
  | "performer"
  | "balanced";

export interface EvolutionStage {
  id: EvolutionStageId;
  /** Minimum level required to be in this stage. */
  minLevel: number;
  displayName: string;
  /** Short flavor description shown in the UI. */
  description: string;
  /**
   * Procedural detail knobs applied at this stage. Every level within a
   * stage also nudges these continuously (see lib/evolution.ts
   * `getVisualDetailForLevel`) so growth reads as gradual, not stepped.
   */
  detail: {
    /** 0-1, overall silhouette complexity / secondary-shape count. */
    silhouetteComplexity: number;
    /** 0-1, surface material sophistication (roughness variance, sheen). */
    materialSophistication: number;
    /** 0-1, intensity of the ambient glow/emissive accents. */
    glow: number;
    /** 0-1, size/prominence of stage-appropriate accessories (horns, fins, crests, tufts). */
    accessoryProminence: number;
    /** Uniform scale multiplier vs. base hatchling size. */
    scale: number;
  };
}

export interface AnimationMap {
  idle: string;
  sleep: string;
  eat: string;
  clean: string;
  play: string;
  illness: string;
  recovery: string;
  celebration: string;
  comfort: string;
  walk: string;
  /** Per-personality idle variant, keyed by personality id. */
  personalityIdle: Record<string, string>;
}

export interface MaterialSlots {
  body: { metalness: number; roughness: number; clearcoat?: number };
  secondary: { metalness: number; roughness: number };
  face: { metalness: number; roughness: number; emissiveIntensity: number };
  pattern: { blendMode: "overlay" | "multiply" | "screen" };
}

export interface AvatarSpecies {
  id: string;
  slug: string;
  displayName: string;
  tagline: string;
  /** Reference image this species was designed from (documentation only). */
  referenceAsset?: string;
  /** Reserved for a future production GLB — unused while procedural. */
  modelAsset?: string;

  defaultBodyColor: string;
  defaultSecondaryColor: string;
  defaultFaceColor: string;
  allowedBodyColors: string[];
  allowedSecondaryColors: string[];
  allowedFaceColors: string[];

  eyeVariants: string[];
  mouthVariants: string[];
  earVariants: string[];
  patternVariants: string[];
  personalities: string[];
  personalityWeights?: Record<string, number>;

  evolutionStages: EvolutionStage[];
  animationMap: AnimationMap;
  materialSlots: MaterialSlots;

  /** Body-proportion DNA used by the procedural geometry builder. */
  proportions: {
    headToBodyRatio: number;
    limbThickness: number;
    torsoWidth: number;
    legLength: number;
    neckLength: number;
    build: "stocky" | "compact" | "athletic" | "elegant" | "slender";
  };
}

export interface ResolvedTraits {
  eyeVariant: string;
  mouthVariant: string;
  earVariant: string;
  patternVariant: string;
  personality: string;
}
