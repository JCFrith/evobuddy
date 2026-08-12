import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/** Human-friendly recovery code, e.g. "7F3K-9QRT-2LXP". Shown once. */
export function generateRecoveryCode(): string {
  const bytes = randomBytes(9);
  const b32 = bytes.toString("base64url").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  return `${b32.slice(0, 4)}-${b32.slice(4, 8)}-${b32.slice(8, 12)}`;
}

function pepper(code: string): string {
  const secret = process.env.RECOVERY_CODE_SECRET;
  if (!secret) {
    throw new Error("Missing required environment variable: RECOVERY_CODE_SECRET");
  }
  return `${secret}:${code}`;
}

export function hashRecoveryCode(code: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(pepper(code), salt, 32);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyRecoveryCode(code: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(pepper(code), salt, 32);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
