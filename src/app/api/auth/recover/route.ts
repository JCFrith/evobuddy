import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeNickname, isValidPin } from "@/lib/auth/alias";
import { verifyRecoveryCode } from "@/lib/auth/recoveryCode";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  checkRecoveryRateLimit,
  recordRecoveryAttempt,
  getClientIp,
  hashIp,
} from "@/lib/auth/rateLimit";

const bodySchema = z.object({
  nickname: z.string().min(1).max(40),
  recoveryCode: z.string().min(8).max(20),
  newPin: z.string().min(4).max(6),
});

const GENERIC_ERROR = "That nickname and recovery code don't match.";

/**
 * Parent-driven PIN reset using the one-time recovery code issued at
 * registration. Same no-enumeration + rate-limit posture as login.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }
  const { nickname, recoveryCode, newPin } = parsed.data;
  if (!isValidPin(newPin)) {
    return NextResponse.json({ error: "PIN must be 4-6 digits." }, { status: 400 });
  }

  const normalized = normalizeNickname(nickname);
  const ipHash = hashIp(getClientIp(request.headers));

  const rateLimit = await checkRecoveryRateLimit(normalized, ipHash);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 3600) } }
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("nickname_normalized", normalized)
    .maybeSingle();

  if (!profile) {
    await recordRecoveryAttempt(normalized, ipHash, false);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const { data: codes } = await admin
    .from("recovery_codes")
    .select("id, code_hash")
    .eq("user_id", profile.id)
    .is("used_at", null);

  const match = (codes ?? []).find((c) => verifyRecoveryCode(recoveryCode, c.code_hash));
  if (!match) {
    await recordRecoveryAttempt(normalized, ipHash, false);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, {
    password: newPin,
  });
  if (updateError) {
    return NextResponse.json({ error: "Could not reset PIN. Please try again." }, { status: 500 });
  }

  await admin
    .from("recovery_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", match.id);

  await recordRecoveryAttempt(normalized, ipHash, true);
  return NextResponse.json({ ok: true });
}
