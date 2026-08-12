import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeNickname, deriveAuthAlias, aliasEmail } from "@/lib/auth/alias";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  checkLoginRateLimit,
  recordLoginAttempt,
  getClientIp,
  hashIp,
} from "@/lib/auth/rateLimit";

const bodySchema = z.object({
  nickname: z.string().min(1).max(40),
  pin: z.string().min(4).max(8),
});

const GENERIC_ERROR = "Invalid nickname or PIN.";

/**
 * Trusted nickname + PIN login endpoint. Never logs the PIN, never
 * returns the internal auth alias, and never reveals whether a given
 * nickname exists — a wrong nickname and a wrong PIN return the exact
 * same response.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const { nickname, pin } = parsed.data;
  const normalized = normalizeNickname(nickname);
  const ipHash = hashIp(getClientIp(request.headers));

  const rateLimit = await checkLoginRateLimit(normalized, ipHash);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 900) } }
    );
  }

  const alias = deriveAuthAlias(normalized);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: aliasEmail(alias),
    password: pin,
  });

  await recordLoginAttempt(normalized, ipHash, !error);

  if (error) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  return NextResponse.json({ nickname });
}
