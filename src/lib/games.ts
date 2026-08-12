import "server-only";
import { createHmac, timingSafeEqual, randomUUID } from "crypto";

export type GameSlug = "memory-match" | "reflex-tap";

export interface GameDefinition {
  slug: GameSlug;
  displayName: string;
  description: string;
  maxScore: number;
  /** Minimum plausible milliseconds to legitimately achieve `maxScore`. */
  minDurationMsForMaxScore: number;
  xpPerPoint: number;
  xpCap: number;
}

export const GAMES: Record<GameSlug, GameDefinition> = {
  "memory-match": {
    slug: "memory-match",
    displayName: "Memory Match",
    description: "Flip tiles and find every matching pair before you run out of tries.",
    maxScore: 8, // 8 matched pairs
    minDurationMsForMaxScore: 4_000, // can't legitimately clear 8 pairs faster than this
    xpPerPoint: 5,
    xpCap: 45,
  },
  "reflex-tap": {
    slug: "reflex-tap",
    displayName: "Reflex Tap",
    description: "Tap the glowing target the instant it lights up, as many times as you can.",
    maxScore: 25,
    minDurationMsForMaxScore: 12_000, // ~480ms/tap floor
    xpPerPoint: 2,
    xpCap: 45,
  },
};

interface SessionPayload {
  avatarId: string;
  game: GameSlug;
  nonce: string;
  startedAtMs: number;
}

const SESSION_TTL_MS = 5 * 60_000;

function secret(): string {
  const s = process.env.RATE_LIMIT_SECRET;
  if (!s) throw new Error("Missing required environment variable: RATE_LIMIT_SECRET");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Issue a signed, opaque session token for one game attempt. */
export function createGameSession(avatarId: string, game: GameSlug): string {
  const payload: SessionPayload = {
    avatarId,
    game,
    nonce: randomUUID(),
    startedAtMs: Date.now(),
  };
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json).toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export interface VerifiedSession {
  ok: true;
  payload: SessionPayload;
}
export interface RejectedSession {
  ok: false;
  reason: string;
}

export function verifyGameSession(
  token: string,
  avatarId: string,
  game: GameSlug
): VerifiedSession | RejectedSession {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return { ok: false, reason: "Malformed session token." };

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "Invalid session token." };
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "Malformed session token." };
  }

  if (payload.avatarId !== avatarId || payload.game !== game) {
    return { ok: false, reason: "Session token does not match this request." };
  }
  if (Date.now() - payload.startedAtMs > SESSION_TTL_MS) {
    return { ok: false, reason: "Session expired." };
  }
  return { ok: true, payload };
}

/**
 * Bounds-check a submitted score against how much real time elapsed.
 * This isn't a full anti-cheat system, but it stops the trivial case of
 * a client submitting a maximum score with zero elapsed time.
 */
export function validateScore(
  game: GameSlug,
  score: number,
  durationMs: number
): { valid: true } | { valid: false; reason: string } {
  const def = GAMES[game];
  if (!Number.isInteger(score) || score < 0 || score > def.maxScore) {
    return { valid: false, reason: "Score out of range." };
  }
  if (durationMs < 0 || durationMs > SESSION_TTL_MS) {
    return { valid: false, reason: "Duration out of range." };
  }
  const minPlausibleMs = (score / def.maxScore) * def.minDurationMsForMaxScore;
  if (durationMs < minPlausibleMs * 0.6) {
    return { valid: false, reason: "Score not plausible for elapsed time." };
  }
  return { valid: true };
}

export function xpForScore(game: GameSlug, score: number): number {
  const def = GAMES[game];
  return Math.min(def.xpCap, Math.round(score * def.xpPerPoint));
}
