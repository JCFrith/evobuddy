import type { AvatarSpecies } from "@/types/species";

/**
 * Pixel — inspired by reference "avatar 2" (flat, friendly cartoon bot with
 * a rounded-screen face showing simple glowing eyes and a smile, plus a
 * matching chest screen). Interpreted as a compact, blocky "expressive"
 * creature whose whole face is a soft-lit display panel — the most
 * literally emotive of the five species, well suited to visibly swapping
 * eye/mouth variants as its mood changes.
 */
export const pixel: AvatarSpecies = {
  id: "pixel",
  slug: "pixel",
  displayName: "Pixel",
  tagline: "Wears its feelings right on its face — literally.",
  referenceAsset: "avatar 2.jpeg",
  defaultBodyColor: "#eef2f7",
  defaultSecondaryColor: "#3d7bd9",
  defaultFaceColor: "#0d1b2a",
  allowedBodyColors: [
    "#eef2f7", "#3d7bd9", "#f2b84b", "#7bd9a5", "#d97bb8", "#8f8fe0", "#e0e0e0",
  ],
  allowedSecondaryColors: [
    "#3d7bd9", "#f2b84b", "#eef2f7", "#2a2f3a", "#7bd9a5",
  ],
  allowedFaceColors: ["#0d1b2a", "#101820", "#1a1030", "#0a1a12"],

  eyeVariants: ["dot-glow", "half-moon", "star-blink", "spiral", "wink"],
  mouthVariants: ["screen-smile", "screen-flat", "screen-open", "screen-giggle", "screen-surprised"],
  earVariants: ["side-disc", "side-ring", "antenna-bud", "none", "side-fin"],
  patternVariants: ["solid", "screen-scanline", "two-tone-split", "dot-grid", "gradient-fade"],
  personalities: ["cheerful", "chatty", "shy", "playful", "thoughtful"],
  personalityWeights: { cheerful: 3, chatty: 2, shy: 1.5, playful: 2.5, thoughtful: 1 },

  evolutionStages: [
    {
      id: "egg",
      minLevel: 0,
      displayName: "Egg",
      description: "A smooth capsule with a faint screen-glow inside.",
      detail: { silhouetteComplexity: 0.05, materialSophistication: 0.15, glow: 0.1, accessoryProminence: 0, scale: 0.5 },
    },
    {
      id: "hatchling",
      minLevel: 1,
      displayName: "Hatchling Pixel",
      description: "A small blocky bot whose screen-face lights up at everything.",
      detail: { silhouetteComplexity: 0.15, materialSophistication: 0.25, glow: 0.25, accessoryProminence: 0.05, scale: 0.65 },
    },
    {
      id: "sprout",
      minLevel: 6,
      displayName: "Sprout Pixel",
      description: "Its display gains richer color and its chest panel syncs to its mood.",
      detail: { silhouetteComplexity: 0.32, materialSophistication: 0.45, glow: 0.4, accessoryProminence: 0.2, scale: 0.8 },
    },
    {
      id: "adventurer",
      minLevel: 13,
      displayName: "Adventurer Pixel",
      description: "Sleeker plating, a brighter display, more confident posture.",
      detail: { silhouetteComplexity: 0.5, materialSophistication: 0.65, glow: 0.55, accessoryProminence: 0.4, scale: 0.95 },
    },
    {
      id: "guardian",
      minLevel: 23,
      displayName: "Guardian Pixel",
      description: "A crisp, high-contrast display and precise, confident motion.",
      detail: { silhouetteComplexity: 0.7, materialSophistication: 0.85, glow: 0.7, accessoryProminence: 0.65, scale: 1.05 },
    },
    {
      id: "radiant",
      minLevel: 33,
      displayName: "Radiant Pixel",
      description: "Its whole face shimmers with soft, animated light patterns.",
      detail: { silhouetteComplexity: 0.9, materialSophistication: 1, glow: 1, accessoryProminence: 0.9, scale: 1.15 },
    },
  ],

  animationMap: {
    idle: "screen-flicker-bob",
    sleep: "dim-screen",
    eat: "chomp-screen-pulse",
    clean: "polish-shimmer",
    play: "bounce-blink",
    illness: "static-glitch",
    recovery: "reboot-flash",
    celebration: "screen-fireworks",
    comfort: "soft-glow-pulse",
    walk: "roll-step",
    personalityIdle: {
      cheerful: "wiggle-wave",
      chatty: "screen-chatter",
      shy: "screen-dim-peek",
      playful: "bounce-loop",
      thoughtful: "slow-scan",
    },
  },

  materialSlots: {
    body: { metalness: 0.05, roughness: 0.35, clearcoat: 0.4 },
    secondary: { metalness: 0.1, roughness: 0.3 },
    face: { metalness: 0, roughness: 0.15, emissiveIntensity: 1.1 },
    pattern: { blendMode: "screen" },
  },

  proportions: {
    headToBodyRatio: 0.85,
    limbThickness: 0.9,
    torsoWidth: 0.95,
    legLength: 0.6,
    neckLength: 0.1,
    build: "compact",
  },
};
