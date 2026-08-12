import type { AvatarSpecies } from "@/types/species";

/**
 * Wisp — inspired by reference "avatar 5" (slender bot with an oversized
 * spherical head dominated by huge glossy lens-like eyes). Interpreted as
 * a tall, willowy "watchful" creature: the largest head-to-body ratio of
 * the five species, very thin limbs, a long neck, and enormous soft-glow
 * eyes with no visible mouth. Reads as quiet, curious, a little otherworldly.
 */
export const wisp: AvatarSpecies = {
  id: "wisp",
  slug: "wisp",
  displayName: "Wisp",
  tagline: "Quiet, curious, and always watching the sky.",
  referenceAsset: "avatar 5.WEBP",
  defaultBodyColor: "#eef0f2",
  defaultSecondaryColor: "#b9c6e0",
  defaultFaceColor: "#0a0f1a",
  allowedBodyColors: [
    "#eef0f2", "#b9c6e0", "#c9b8e0", "#9fd8d0", "#e0c9d8", "#d8d8c9", "#8fa0c0",
  ],
  allowedSecondaryColors: [
    "#b9c6e0", "#eef0f2", "#3a3f52", "#c9b8e0", "#9fd8d0",
  ],
  allowedFaceColors: ["#0a0f1a", "#10101c", "#180f20", "#0a1414"],

  eyeVariants: ["huge-lens", "twin-dot", "crescent-glow", "wide-scan", "soft-blink"],
  mouthVariants: ["none", "hairline", "faint-glow-line", "small-dot", "soft-curve"],
  earVariants: ["none", "feather-tuft", "twin-tuft", "trailing-wisp", "small-fin"],
  patternVariants: ["solid", "soft-gradient", "star-flecks", "misty-band", "twin-tone"],
  personalities: ["curious", "dreamy", "gentle", "watchful", "quiet"],
  personalityWeights: { curious: 2.5, dreamy: 3, gentle: 2, watchful: 1.5, quiet: 1.5 },

  evolutionStages: [
    {
      id: "egg",
      minLevel: 0,
      displayName: "Egg",
      description: "A pale, glassy shell with something faintly glowing inside.",
      detail: { silhouetteComplexity: 0.05, materialSophistication: 0.15, glow: 0.15, accessoryProminence: 0, scale: 0.5 },
    },
    {
      id: "hatchling",
      minLevel: 1,
      displayName: "Hatchling Wisp",
      description: "A tiny frame under an already-oversized, curious head.",
      detail: { silhouetteComplexity: 0.12, materialSophistication: 0.22, glow: 0.3, accessoryProminence: 0.05, scale: 0.6 },
    },
    {
      id: "sprout",
      minLevel: 6,
      displayName: "Sprout Wisp",
      description: "Its limbs lengthen and soft tufts appear near its ears.",
      detail: { silhouetteComplexity: 0.28, materialSophistication: 0.4, glow: 0.45, accessoryProminence: 0.25, scale: 0.78 },
    },
    {
      id: "adventurer",
      minLevel: 13,
      displayName: "Adventurer Wisp",
      description: "Taller and quieter still, with a faint trailing glow.",
      detail: { silhouetteComplexity: 0.45, materialSophistication: 0.6, glow: 0.6, accessoryProminence: 0.5, scale: 0.95 },
    },
    {
      id: "guardian",
      minLevel: 23,
      displayName: "Guardian Wisp",
      description: "Its eyes widen further, missing nothing around it.",
      detail: { silhouetteComplexity: 0.65, materialSophistication: 0.82, glow: 0.78, accessoryProminence: 0.72, scale: 1.08 },
    },
    {
      id: "radiant",
      minLevel: 33,
      displayName: "Radiant Wisp",
      description: "A soft, drifting glow follows it like starlight.",
      detail: { silhouetteComplexity: 0.85, materialSophistication: 1, glow: 1, accessoryProminence: 0.9, scale: 1.2 },
    },
  ],

  animationMap: {
    idle: "gentle-float-sway",
    sleep: "drift-dim",
    eat: "slow-absorb",
    clean: "shimmer-cleanse",
    play: "float-loop",
    illness: "flicker-dim",
    recovery: "glow-return",
    celebration: "sparkle-burst",
    comfort: "slow-drift-close",
    walk: "glide",
    personalityIdle: {
      curious: "head-tilt-wide-eyes",
      dreamy: "slow-drift",
      gentle: "soft-sway",
      watchful: "scan-surroundings",
      quiet: "minimal-drift",
    },
  },

  materialSlots: {
    body: { metalness: 0.05, roughness: 0.4, clearcoat: 0.3 },
    secondary: { metalness: 0.05, roughness: 0.45 },
    face: { metalness: 0, roughness: 0.05, emissiveIntensity: 1.2 },
    pattern: { blendMode: "screen" },
  },

  proportions: {
    headToBodyRatio: 1.15,
    limbThickness: 0.45,
    torsoWidth: 0.55,
    legLength: 1.0,
    neckLength: 0.45,
    build: "slender",
  },
};
