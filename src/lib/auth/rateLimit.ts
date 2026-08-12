import "server-only";
import { createHmac } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Hash an IP with a server-only secret instead of storing it raw. */
export function hashIp(ip: string): string {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret) {
    throw new Error("Missing required environment variable: RATE_LIMIT_SECRET");
  }
  return createHmac("sha256", secret).update(ip).digest("hex");
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS_PER_NICKNAME = 8;
const MAX_ATTEMPTS_PER_IP = 20;

/**
 * Sliding-window rate limit backed by the `login_attempts` table.
 * Checked BEFORE attempting authentication so a flood of guesses against
 * one nickname (or fanned out across nicknames from one IP) gets a 429
 * before it ever reaches Supabase Auth.
 */
export async function checkLoginRateLimit(
  nicknameNormalized: string,
  ipHash: string
): Promise<RateLimitResult> {
  const admin = createSupabaseAdminClient();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

  const [byNickname, byIp] = await Promise.all([
    admin
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("nickname_normalized", nicknameNormalized)
      .eq("success", false)
      .gte("attempted_at", since),
    admin
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .eq("success", false)
      .gte("attempted_at", since),
  ]);

  const nicknameCount = byNickname.count ?? 0;
  const ipCount = byIp.count ?? 0;

  if (nicknameCount >= MAX_ATTEMPTS_PER_NICKNAME || ipCount >= MAX_ATTEMPTS_PER_IP) {
    return { allowed: false, retryAfterSeconds: WINDOW_MINUTES * 60 };
  }
  return { allowed: true };
}

export async function recordLoginAttempt(
  nicknameNormalized: string,
  ipHash: string,
  success: boolean
) {
  const admin = createSupabaseAdminClient();
  await admin.from("login_attempts").insert({
    nickname_normalized: nicknameNormalized,
    ip_hash: ipHash,
    success,
  });
}

const RECOVERY_WINDOW_MINUTES = 60;
const MAX_RECOVERY_ATTEMPTS = 5;

export async function checkRecoveryRateLimit(
  nicknameNormalized: string,
  ipHash: string
): Promise<RateLimitResult> {
  const admin = createSupabaseAdminClient();
  const since = new Date(Date.now() - RECOVERY_WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await admin
    .from("recovery_attempts")
    .select("id", { count: "exact", head: true })
    .or(`nickname_normalized.eq.${nicknameNormalized},ip_hash.eq.${ipHash}`)
    .gte("attempted_at", since);

  if ((count ?? 0) >= MAX_RECOVERY_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: RECOVERY_WINDOW_MINUTES * 60 };
  }
  return { allowed: true };
}

export async function recordRecoveryAttempt(
  nicknameNormalized: string,
  ipHash: string,
  success: boolean
) {
  const admin = createSupabaseAdminClient();
  await admin.from("recovery_attempts").insert({
    nickname_normalized: nicknameNormalized,
    ip_hash: ipHash,
    success,
  });
}
