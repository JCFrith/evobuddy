import { describe, it, expect, beforeAll } from "vitest";
import {
  GAMES,
  createGameSession,
  verifyGameSession,
  validateScore,
  xpForScore,
} from "@/lib/games";

beforeAll(() => {
  process.env.RATE_LIMIT_SECRET = "test-only-secret-do-not-use-in-prod";
});

describe("game session tokens", () => {
  it("round-trips a valid session", () => {
    const token = createGameSession("avatar-1", "memory-match");
    const result = verifyGameSession(token, "avatar-1", "memory-match");
    expect(result.ok).toBe(true);
  });

  it("rejects a session for the wrong avatar", () => {
    const token = createGameSession("avatar-1", "memory-match");
    const result = verifyGameSession(token, "avatar-2", "memory-match");
    expect(result.ok).toBe(false);
  });

  it("rejects a session for the wrong game", () => {
    const token = createGameSession("avatar-1", "memory-match");
    const result = verifyGameSession(token, "avatar-1", "reflex-tap");
    expect(result.ok).toBe(false);
  });

  it("rejects a tampered token", () => {
    const token = createGameSession("avatar-1", "memory-match");
    const tampered = token.slice(0, -2) + "zz";
    const result = verifyGameSession(tampered, "avatar-1", "memory-match");
    expect(result.ok).toBe(false);
  });

  it("rejects a malformed token", () => {
    const result = verifyGameSession("not-a-real-token", "avatar-1", "memory-match");
    expect(result.ok).toBe(false);
  });
});

describe("validateScore", () => {
  it("rejects a score above the game's max", () => {
    const def = GAMES["memory-match"];
    const result = validateScore("memory-match", def.maxScore + 1, 10_000);
    expect(result.valid).toBe(false);
  });

  it("rejects a negative score", () => {
    expect(validateScore("reflex-tap", -1, 10_000).valid).toBe(false);
  });

  it("rejects a max score achieved implausibly fast", () => {
    const def = GAMES["reflex-tap"];
    const result = validateScore("reflex-tap", def.maxScore, 200); // 200ms for 25 taps
    expect(result.valid).toBe(false);
  });

  it("accepts a plausible score for the elapsed time", () => {
    const def = GAMES["reflex-tap"];
    const result = validateScore("reflex-tap", def.maxScore, def.minDurationMsForMaxScore + 1000);
    expect(result.valid).toBe(true);
  });

  it("accepts a low score even with very little elapsed time", () => {
    expect(validateScore("reflex-tap", 1, 500).valid).toBe(true);
  });
});

describe("xpForScore", () => {
  it("is monotonically non-decreasing in score", () => {
    let prev = -1;
    for (let s = 0; s <= GAMES["memory-match"].maxScore; s++) {
      const xp = xpForScore("memory-match", s);
      expect(xp).toBeGreaterThanOrEqual(prev);
      prev = xp;
    }
  });

  it("never exceeds the configured XP cap", () => {
    const def = GAMES["reflex-tap"];
    expect(xpForScore("reflex-tap", def.maxScore)).toBeLessThanOrEqual(def.xpCap);
  });
});
