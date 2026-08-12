import type { AvatarSpecies } from "@/types/species";

/**
 * Aurum — inspired by reference "avatar 4" (gold/silver metallic humanoid
 * bot with elegant, near-human proportions and calm oval eyes). Interpreted
 * as the most poised and dignified of the five species: a taller neck,
 * narrower shoulders, minimal head-to-body exaggeration compared to the
 * other four chibi-proportioned creatures, and a warm bimetal finish. Reads
 * as noble, composed, protective.
 */
export const aurum: AvatarSpecies = {
  id: "aurum",
  slug: "aurum",
  displayName: "Aurum",
  tagline: "Composed, dignified, and quietly protective.",
  referenceAsset: "avatar 4.png",
  defaultBodyColor: "#c9a24a",
  defaultSecondaryColor: "#9ea6b0",
  defaultFaceColor: "#173038",
  allowedBodyColors: [
    "#c9a24a", "#9ea6b0", "#7b6bd0", "#3aa08c", "#c25b7a", "#5a7bc9", "#b0b0b0",
  ],
  allowedSecondaryColors: [
    "#9ea6b0", "#c9a24a", "#4a4f58", "#e8e4d8", "#7b6bd0",
  ],
  allowedFaceColors: ["#173038", "#1c1c24", "#241830", "#0e2020"],

  eyeVariants: ["calm-oval", "gentle-arc", "bright-focus", "half-closed", "twin-ring"],
  mouthVariants: ["none", "thin-line", "soft-curve", "seam-line", "small-smile"],
  earVariants: ["flat-fin", "crest-fin", "twin-blade", "none", "ring-halo"],
  patternVariants: ["etched-seam", "solid", "dual-panel", "filigree", "banded"],
  personalities: ["dignified", "protective", "wise", "reserved", "generous"],
  personalityWeights: { dignified: 3, protective: 2.5, wise: 2, reserved: 1.5, generous: 1.5 },

  evolutionStages: [
    {
      id: "egg",
      minLevel: 0,
      displayName: "Egg",
      description: "A tall, polished ovoid shell that catches the light.",
      detail: { silhouetteComplexity: 0.05, materialSophistication: 0.2, glow: 0.05, accessoryProminence: 0, scale: 0.55 },
    },
    {
      id: "hatchling",
      minLevel: 1,
      displayName: "Hatchling Aurum",
      description: "Small, composed, and already standing very straight.",
      detail: { silhouetteComplexity: 0.15, materialSophistication: 0.3, glow: 0.15, accessoryProminence: 0.05, scale: 0.6 },
    },
    {
      id: "sprout",
      minLevel: 6,
      displayName: "Sprout Aurum",
      description: "Its plating gains a warm two-tone finish.",
      detail: { silhouetteComplexity: 0.3, materialSophistication: 0.5, glow: 0.25, accessoryProminence: 0.25, scale: 0.75 },
    },
    {
      id: "adventurer",
      minLevel: 13,
      displayName: "Adventurer Aurum",
      description: "Fine etched seams appear across its shoulders and chest.",
      detail: { silhouetteComplexity: 0.5, materialSophistication: 0.7, glow: 0.4, accessoryProminence: 0.5, scale: 0.92 },
    },
    {
      id: "guardian",
      minLevel: 23,
      displayName: "Guardian Aurum",
      description: "Fin-like crest plating and a taller, watchful stance.",
      detail: { silhouetteComplexity: 0.72, materialSophistication: 0.88, glow: 0.55, accessoryProminence: 0.75, scale: 1.05 },
    },
    {
      id: "radiant",
      minLevel: 33,
      displayName: "Radiant Aurum",
      description: "Its filigree seams glow like inlaid embers.",
      detail: { silhouetteComplexity: 0.95, materialSophistication: 1, glow: 0.9, accessoryProminence: 1, scale: 1.18 },
    },
  ],

  animationMap: {
    idle: "poised-sway",
    sleep: "seated-rest",
    eat: "measured-sip",
    clean: "polish-buff",
    play: "graceful-spin",
    illness: "slow-sag",
    recovery: "rise-steady",
    celebration: "bow-flourish",
    comfort: "hand-to-chest",
    walk: "measured-stride",
    personalityIdle: {
      dignified: "chin-lift",
      protective: "stance-widen",
      wise: "slow-nod",
      reserved: "still-watch",
      generous: "open-arm-gesture",
    },
  },

  materialSlots: {
    body: { metalness: 0.75, roughness: 0.28, clearcoat: 0.6 },
    secondary: { metalness: 0.65, roughness: 0.3 },
    face: { metalness: 0.2, roughness: 0.12, emissiveIntensity: 0.7 },
    pattern: { blendMode: "overlay" },
  },

  proportions: {
    headToBodyRatio: 0.45,
    limbThickness: 0.65,
    torsoWidth: 0.7,
    legLength: 1.15,
    neckLength: 0.55,
    build: "elegant",
  },
};
