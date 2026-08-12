import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Normalize a nickname for lookup/uniqueness: lowercase, trim, collapse
 * internal whitespace. This is what gets hashed into the internal alias
 * and what gets checked against `nickname_normalized`.
 */
export function normalizeNickname(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isValidNickname(raw: string): boolean {
  const n = normalizeNickname(raw);
  return n.length >= 3 && n.length <= 24 && /^[a-z0-9 _-]+$/.test(n);
}

export function isValidPin(raw: string): boolean {
  return /^\d{4,6}$/.test(raw);
}

/**
 * Derive the internal, non-reversible authentication alias for a nickname.
 * This alias (never the nickname itself) becomes the synthetic Supabase
 * Auth identity (`${alias}@auth.internal`), so a database leak of
 * `nickname_normalized` alone can't be used to sign in, and the alias
 * itself is never returned to any client.
 */
export function deriveAuthAlias(normalizedNickname: string): string {
  const secret = process.env.AUTH_ALIAS_SECRET;
  if (!secret) {
    throw new Error("Missing required environment variable: AUTH_ALIAS_SECRET");
  }
  return createHmac("sha256", secret).update(normalizedNickname).digest("hex");
}

export function aliasEmail(alias: string): string {
  return `${alias}@auth.internal`;
}

/** Constant-time comparison for anything alias/secret-derived. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
