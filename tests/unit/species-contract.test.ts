import { describe, it, expect } from "vitest";
import { SPECIES_REGISTRY } from "@/species/registry";
import { resolveTraits } from "@/lib/traits";
import type { EvolutionStageId } from "@/types/species";

const REQUIRED_STAGE_ORDER: EvolutionStageId[] = [
  "egg",
  "hatchling",
  "sprout",
  "adventurer",
  "guardian",
  "radiant",
];

describe("five-species architecture contract", () => {
  it("registers exactly five species", () => {
    expect(SPECIES_REGISTRY).toHaveLength(5);
  });

  it("gives every species a unique slug/id", () => {
    const slugs = SPECIES_REGISTRY.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  for (const species of SPECIES_REGISTRY) {
    describe(species.displayName, () => {
      it("implements all six required evolution stages in order", () => {
        const ids = species.evolutionStages.map((s) => s.id);
        expect(ids).toEqual(REQUIRED_STAGE_ORDER);
      });

      it("has strictly increasing minLevel across stages", () => {
        const levels = species.evolutionStages.map((s) => s.minLevel);
        for (let i = 1; i < levels.length; i++) {
          expect(levels[i]).toBeGreaterThan(levels[i - 1]);
        }
      });

      it("declares non-empty randomizable trait pools", () => {
        expect(species.eyeVariants.length).toBeGreaterThan(0);
        expect(species.mouthVariants.length).toBeGreaterThan(0);
        expect(species.earVariants.length).toBeGreaterThan(0);
        expect(species.patternVariants.length).toBeGreaterThan(0);
        expect(species.personalities.length).toBeGreaterThan(0);
      });

      it("declares default colors inside its own allowed palettes", () => {
        expect(species.allowedBodyColors).toContain(species.defaultBodyColor);
        expect(species.allowedSecondaryColors).toContain(
          species.defaultSecondaryColor
        );
        expect(species.allowedFaceColors).toContain(species.defaultFaceColor);
      });

      it("implements the full required animation map", () => {
        const required: (keyof typeof species.animationMap)[] = [
          "idle", "sleep", "eat", "clean", "play", "illness",
          "recovery", "celebration", "comfort", "walk",
        ];
        for (const key of required) {
          expect(species.animationMap[key]).toBeTruthy();
        }
      });

      it("resolves deterministic traits for a fixed seed", () => {
        const a = resolveTraits(species, "seed-123");
        const b = resolveTraits(species, "seed-123");
        expect(a).toEqual(b);
      });

      it("resolves traits that are members of its own declared variant pools", () => {
        const traits = resolveTraits(species, "another-seed");
        expect(species.eyeVariants).toContain(traits.eyeVariant);
        expect(species.mouthVariants).toContain(traits.mouthVariant);
        expect(species.earVariants).toContain(traits.earVariant);
        expect(species.patternVariants).toContain(traits.patternVariant);
        expect(species.personalities).toContain(traits.personality);
      });
    });
  }
});
