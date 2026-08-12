import type { AvatarSpecies } from "@/types/species";

/**
 * Roundling — inspired by reference "avatar 1" (chunky orange/white
 * astronaut-suit bot with huge round glowing eyes). Interpreted as a
 * stocky, big-headed "heavy explorer" creature: thick stubby limbs, a
 * near-spherical head roughly as large as its whole body, and a padded,
 * suit-like plated hide. Reads as sturdy, brave, unshakeable.
 */
export const roundling: AvatarSpecies = {
  id: "roundling",
  slug: "roundling",
  displayName: "Roundling",
  tagline: "A sturdy little explorer that's afraid of nothing.",
  referenceAsset: "avatar 1",
  defaultBodyColor: "#e8944a",
  defaultSecondaryColor: "#f4f1ea",
  defaultFaceColor: "#1c2430",
  allowedBodyColors: [
    "#e8944a", "#f4f1ea", "#5aa9e6", "#7cc78f", "#d15b6e", "#c9a15a", "#8a7ad1",
  ],
  allowedSecondaryColors: [
    "#f4f1ea", "#e8944a", "#2c3440", "#5aa9e6", "#f2d06b",
  ],
  allowedFaceColors: ["#1c2430", "#22303f", "#3a2a20", "#1a1a1a"],

  eyeVariants: ["wide-round", "sleepy-round", "sparkle-round", "focused-narrow", "starry"],
  mouthVariants: ["stub-smile", "flat-vent", "open-cheer", "chevron", "small-o"],
  earVariants: ["round-pod", "flat-plate", "twin-antenna", "none", "finned"],
  patternVariants: ["solid", "belt-stripe", "patch", "chevrons", "speckle"],
  personalities: ["brave", "gentle", "stubborn", "loyal", "curious"],
  personalityWeights: { brave: 3, gentle: 2, stubborn: 1.5, loyal: 2.5, curious: 1 },

  evolutionStages: [
    {
      id: "egg",
      minLevel: 0,
      displayName: "Egg",
      description: "A round, padded shell, warm to the touch.",
      detail: { silhouetteComplexity: 0.05, materialSophistication: 0.1, glow: 0.05, accessoryProminence: 0, scale: 0.55 },
    },
    {
      id: "hatchling",
      minLevel: 1,
      displayName: "Hatchling Roundling",
      description: "Round, soft, and endlessly curious about its own feet.",
      detail: { silhouetteComplexity: 0.15, materialSophistication: 0.2, glow: 0.15, accessoryProminence: 0.05, scale: 0.7 },
    },
    {
      id: "sprout",
      minLevel: 6,
      displayName: "Sprout Roundling",
      description: "Plating thickens; its stance widens into something braver.",
      detail: { silhouetteComplexity: 0.35, materialSophistication: 0.4, glow: 0.3, accessoryProminence: 0.25, scale: 0.85 },
    },
    {
      id: "adventurer",
      minLevel: 13,
      displayName: "Adventurer Roundling",
      description: "Trail-worn plating and a confident, rolling gait.",
      detail: { silhouetteComplexity: 0.55, materialSophistication: 0.6, glow: 0.45, accessoryProminence: 0.5, scale: 1.0 },
    },
    {
      id: "guardian",
      minLevel: 23,
      displayName: "Guardian Roundling",
      description: "Broad-shouldered and unshakeable, with reinforced boots.",
      detail: { silhouetteComplexity: 0.75, materialSophistication: 0.8, glow: 0.6, accessoryProminence: 0.75, scale: 1.15 },
    },
    {
      id: "radiant",
      minLevel: 33,
      displayName: "Radiant Roundling",
      description: "Its eyes and seams glow with a warm, steady light.",
      detail: { silhouetteComplexity: 1, materialSophistication: 1, glow: 1, accessoryProminence: 1, scale: 1.3 },
    },
  ],

  animationMap: {
    idle: "bob-sway",
    sleep: "curl-shell",
    eat: "munch-bounce",
    clean: "shake-scrub",
    play: "hop-spin",
    illness: "droop-wobble",
    recovery: "shiver-perk",
    celebration: "bounce-burst",
    comfort: "lean-in-hum",
    walk: "waddle",
    personalityIdle: {
      brave: "chest-puff",
      gentle: "slow-blink",
      stubborn: "arms-cross",
      loyal: "look-to-user",
      curious: "head-tilt-scan",
    },
  },

  materialSlots: {
    body: { metalness: 0.1, roughness: 0.55, clearcoat: 0.2 },
    secondary: { metalness: 0.15, roughness: 0.5 },
    face: { metalness: 0.05, roughness: 0.2, emissiveIntensity: 0.9 },
    pattern: { blendMode: "overlay" },
  },

  proportions: {
    headToBodyRatio: 0.95,
    limbThickness: 1.35,
    torsoWidth: 1.25,
    legLength: 0.7,
    neckLength: 0.15,
    build: "stocky",
  },
};
