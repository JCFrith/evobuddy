import { describe, it, expect } from "vitest";
import { tickStats, applyCareAction, deriveMood, type AvatarStats } from "@/lib/care";

function freshStats(overrides: Partial<AvatarStats> = {}): AvatarStats {
  return {
    statHunger: 100,
    statClean: 100,
    statEnergy: 100,
    statHappiness: 100,
    statHealth: 100,
    isAsleep: false,
    isSick: false,
    sickSince: null,
    lastTickAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    ...overrides,
  };
}

describe("tickStats", () => {
  it("is idempotent: re-ticking at the same `now` changes nothing further", () => {
    const stats = freshStats();
    const now = new Date("2026-01-01T05:00:00.000Z");
    const first = tickStats(stats, now);
    const second = tickStats(first.stats, now);
    expect(second.hoursElapsed).toBe(0);
    expect(second.stats).toEqual(first.stats);
  });

  it("decays hunger/clean/energy/happiness over elapsed real time", () => {
    const stats = freshStats();
    const now = new Date("2026-01-01T05:00:00.000Z"); // 5 hours later
    const result = tickStats(stats, now);
    expect(result.stats.statHunger).toBeLessThan(100);
    expect(result.stats.statClean).toBeLessThan(100);
    expect(result.stats.statEnergy).toBeLessThan(100);
    expect(result.stats.statHappiness).toBeLessThan(100);
  });

  it("never produces negative or >100 stats regardless of elapsed time", () => {
    const stats = freshStats();
    const now = new Date("2027-01-01T00:00:00.000Z"); // ~1 year later
    const result = tickStats(stats, now);
    for (const key of ["statHunger", "statClean", "statEnergy", "statHappiness", "statHealth"] as const) {
      expect(result.stats[key]).toBeGreaterThanOrEqual(0);
      expect(result.stats[key]).toBeLessThanOrEqual(100);
    }
  });

  it("recovers energy while asleep instead of decaying it", () => {
    const stats = freshStats({ statEnergy: 30, isAsleep: true });
    const now = new Date("2026-01-01T02:00:00.000Z");
    const result = tickStats(stats, now);
    expect(result.stats.statEnergy).toBeGreaterThan(30);
  });

  it("does not go backwards in time (never call with `now` before lastTickAt in practice, but guards anyway)", () => {
    const stats = freshStats();
    const earlier = new Date("2025-12-31T00:00:00.000Z");
    const result = tickStats(stats, earlier);
    expect(result.hoursElapsed).toBe(0);
    expect(result.stats).toEqual(stats);
  });

  it("triggers illness only after sustained critical stats, not instantly", () => {
    // hunger starts already low; illness should not trigger on the very
    // first tick that crosses the threshold.
    const stats = freshStats({ statHunger: 11 });
    const now = new Date("2026-01-01T00:05:00.000Z"); // 5 minutes later
    const result = tickStats(stats, now);
    expect(result.becameSick).toBe(false);
  });
});

describe("applyCareAction", () => {
  it("feed increases hunger and happiness, clamped to 100", () => {
    const stats = freshStats({ statHunger: 90, statHappiness: 90 });
    const next = applyCareAction(stats, "feed");
    expect(next.statHunger).toBe(100);
    expect(next.statHappiness).toBeLessThanOrEqual(100);
  });

  it("sleep_start / sleep_end toggle isAsleep", () => {
    const awake = freshStats({ isAsleep: false });
    expect(applyCareAction(awake, "sleep_start").isAsleep).toBe(true);
    const asleep = freshStats({ isAsleep: true });
    expect(applyCareAction(asleep, "sleep_end").isAsleep).toBe(false);
  });

  it("heal clears sickness once health crosses the recovery threshold", () => {
    const sick = freshStats({ isSick: true, sickSince: new Date().toISOString(), statHealth: 10 });
    const healed = applyCareAction(sick, "heal");
    expect(healed.statHealth).toBeGreaterThan(10);
    expect(healed.isSick).toBe(false);
  });
});

describe("deriveMood", () => {
  it("is sick when isSick regardless of other stats", () => {
    expect(deriveMood(freshStats({ isSick: true, statHappiness: 100 }))).toBe("sick");
  });
  it("is sleepy when asleep and not sick", () => {
    expect(deriveMood(freshStats({ isAsleep: true }))).toBe("sleepy");
  });
  it("is great with high averaged stats", () => {
    expect(deriveMood(freshStats())).toBe("great");
  });
  it("is sad with very low averaged stats", () => {
    expect(
      deriveMood(freshStats({ statHunger: 5, statClean: 5, statEnergy: 5, statHappiness: 5 }))
    ).toBe("sad");
  });
});
