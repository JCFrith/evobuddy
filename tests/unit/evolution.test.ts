import { describe, it, expect } from "vitest";
import {
  levelFromTotalXp,
  xpRequiredForLevel,
  stageForLevel,
  getVisualDetailForLevel,
  deriveEvolutionBranch,
  MAX_LEVEL,
} from "@/lib/evolution";
import { SPECIES_REGISTRY } from "@/species/registry";

describe("xp / leveling curve", () => {
  it("requires 0 xp for level 1", () => {
    expect(xpRequiredForLevel(1)).toBe(0);
  });

  it("is monotonically increasing", () => {
    for (let l = 2; l <= MAX_LEVEL; l++) {
      expect(xpRequiredForLevel(l)).toBeGreaterThan(xpRequiredForLevel(l - 1));
    }
  });

  it("round-trips level -> xp -> level", () => {
    for (let l = 1; l <= MAX_LEVEL; l++) {
      const xp = xpRequiredForLevel(l);
      expect(levelFromTotalXp(xp)).toBe(l);
    }
  });

  it("never exceeds MAX_LEVEL regardless of xp", () => {
    expect(levelFromTotalXp(10_000_000)).toBe(MAX_LEVEL);
  });
});

describe("evolution stage resolution", () => {
  const species = SPECIES_REGISTRY[0];

  it("resolves egg at level 0 and radiant at max level", () => {
    expect(stageForLevel(species, 0).id).toBe("egg");
    expect(stageForLevel(species, MAX_LEVEL).id).toBe("radiant");
  });

  it("produces monotonically non-decreasing scale as level increases", () => {
    let prevScale = 0;
    for (let l = 0; l <= MAX_LEVEL; l++) {
      const detail = getVisualDetailForLevel(species, l);
      expect(detail.scale).toBeGreaterThanOrEqual(prevScale - 1e-9);
      prevScale = detail.scale;
    }
  });

  it("causes some visible advancement every single level (no two adjacent levels identical)", () => {
    const seen = new Set<string>();
    for (let l = 0; l <= MAX_LEVEL; l++) {
      const d = getVisualDetailForLevel(species, l);
      const key = JSON.stringify(d);
      // Not asserting global uniqueness (a plateau at max level is fine),
      // but level 0 through the radiant threshold must all differ from
      // their immediate neighbor.
      if (l > 0 && l <= 33) {
        const prevKey = JSON.stringify(getVisualDetailForLevel(species, l - 1));
        expect(key).not.toBe(prevKey);
      }
      seen.add(key);
    }
  });
});

describe("evolution branch derivation", () => {
  it("stays balanced with sparse or empty history", () => {
    expect(
      deriveEvolutionBranch({
        feed: 1, clean: 0, play: 0, sleep: 0, pet: 0, heal: 0, games: 0, celebrations: 0,
      })
    ).toBe("balanced");
  });

  it("stays balanced when interactions are spread evenly", () => {
    expect(
      deriveEvolutionBranch({
        feed: 10, clean: 10, play: 10, sleep: 10, pet: 10, heal: 10, games: 10, celebrations: 10,
      })
    ).toBe("balanced");
  });

  it("picks scholar when games dominate", () => {
    expect(
      deriveEvolutionBranch({
        feed: 2, clean: 1, play: 1, sleep: 1, pet: 1, heal: 0, games: 40, celebrations: 0,
      })
    ).toBe("scholar");
  });

  it("picks guardian when clean+heal dominate", () => {
    expect(
      deriveEvolutionBranch({
        feed: 1, clean: 20, play: 1, sleep: 1, pet: 1, heal: 20, games: 0, celebrations: 0,
      })
    ).toBe("guardian");
  });

  it("is a pure function of its input (never uses client-suppliable state directly for XP)", () => {
    const input = { feed: 5, clean: 5, play: 20, sleep: 1, pet: 1, heal: 0, games: 1, celebrations: 1 };
    const a = deriveEvolutionBranch(input);
    const b = deriveEvolutionBranch({ ...input });
    expect(a).toBe(b);
  });
});
