import type { AvatarSpecies } from "@/types/species";

/**
 * Sprint — inspired by reference "avatar 3" (sleek white/orange bot with
 * wire antennae, glowing almond eyes, and lit sneaker-style boots).
 * Interpreted as a lean, athletic "runner" creature: longer legs than the
 * other four species, a streamlined torso, thin wire-tuft ears, and
 * light-up feet. Reads as energetic, quick, competitive.
 */
export const sprint: AvatarSpecies = {
  id: "sprint",
  slug: "sprint",
  displayName: "Sprint",
  tagline: "Built to run, race, and never sit still.",
  referenceAsset: "avatar 3.jpg",
  defaultBodyColor: "#f5f3ee",
  defaultSecondaryColor: "#e8722c",
  defaultFaceColor: "#0f2230",
  allowedBodyColors: [
    "#f5f3ee", "#e8722c", "#2fb6c9", "#e0e0e0", "#c94f6e", "#5ecb6b", "#3a3f4a",
  ],
  allowedSecondaryColors: [
    "#e8722c", "#2fb6c9", "#f5f3ee", "#1c1c1c", "#f2d34b",
  ],
  allowedFaceColors: ["#0f2230", "#132a1f", "#241030", "#101010"],

  eyeVariants: ["almond-glow", "narrow-focus", "bright-round", "half-lid", "chevron-sharp"],
  mouthVariants: ["confident-line", "grin", "open-shout", "smirk", "none"],
  earVariants: ["wire-antenna", "twin-wire", "fin-swept", "none", "clipped-bud"],
  patternVariants: ["racing-stripe", "solid", "split-panel", "chevron-accent", "speckle-fade"],
  personalities: ["energetic", "competitive", "confident", "restless", "friendly"],
  personalityWeights: { energetic: 3, competitive: 2, confident: 2, restless: 1.5, friendly: 1.5 },

  evolutionStages: [
    {
      id: "egg",
      minLevel: 0,
      displayName: "Egg",
      description: "A streamlined, teardrop-shaped shell that seems eager to move.",
      detail: { silhouetteComplexity: 0.05, materialSophistication: 0.12, glow: 0.08, accessoryProminence: 0, scale: 0.5 },
    },
    {
      id: "hatchling",
      minLevel: 1,
      displayName: "Hatchling Sprint",
      description: "Small and springy, already bouncing on its toes.",
      detail: { silhouetteComplexity: 0.15, materialSophistication: 0.22, glow: 0.2, accessoryProminence: 0.08, scale: 0.62 },
    },
    {
      id: "sprout",
      minLevel: 6,
      displayName: "Sprout Sprint",
      description: "Longer legs, a leaner torso, quicker reflexes.",
      detail: { silhouetteComplexity: 0.35, materialSophistication: 0.42, glow: 0.32, accessoryProminence: 0.3, scale: 0.8 },
    },
    {
      id: "adventurer",
      minLevel: 13,
      displayName: "Adventurer Sprint",
      description: "Racing stripes sharpen and its stance turns competitive.",
      detail: { silhouetteComplexity: 0.55, materialSophistication: 0.6, glow: 0.45, accessoryProminence: 0.55, scale: 0.98 },
    },
    {
      id: "guardian",
      minLevel: 23,
      displayName: "Guardian Sprint",
      description: "A powerful, coiled stance built for split-second reactions.",
      detail: { silhouetteComplexity: 0.75, materialSophistication: 0.82, glow: 0.6, accessoryProminence: 0.78, scale: 1.1 },
    },
    {
      id: "radiant",
      minLevel: 33,
      displayName: "Radiant Sprint",
      description: "Trailing light streaks follow every quick movement.",
      detail: { silhouetteComplexity: 1, materialSophistication: 1, glow: 1, accessoryProminence: 1, scale: 1.22 },
    },
  ],

  animationMap: {
    idle: "toe-bounce",
    sleep: "curl-tight",
    eat: "quick-nibble",
    clean: "brisk-wipe",
    play: "sprint-loop",
    illness: "limp-favor",
    recovery: "stretch-shake",
    celebration: "victory-lap",
    comfort: "settle-lean",
    walk: "jog",
    personalityIdle: {
      energetic: "jog-in-place",
      competitive: "stare-down",
      confident: "shoulder-roll",
      restless: "foot-tap",
      friendly: "wave-bounce",
    },
  },

  materialSlots: {
    body: { metalness: 0.15, roughness: 0.3, clearcoat: 0.5 },
    secondary: { metalness: 0.2, roughness: 0.25 },
    face: { metalness: 0.05, roughness: 0.15, emissiveIntensity: 1 },
    pattern: { blendMode: "overlay" },
  },

  proportions: {
    headToBodyRatio: 0.6,
    limbThickness: 0.75,
    torsoWidth: 0.8,
    legLength: 1.25,
    neckLength: 0.25,
    build: "athletic",
  },
};
