import { NextResponse } from "next/server";
import { z } from "zod";
import {
  normalizeNickname,
  isValidNickname,
  isValidPin,
  deriveAuthAlias,
  aliasEmail,
} from "@/lib/auth/alias";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateRecoveryCode, hashRecoveryCode } from "@/lib/auth/recoveryCode";

const bodySchema = z.object({
  nickname: z.string().min(1).max(40),
  pin: z.string().min(4).max(6),
  parentEmail: z.string().email().optional().or(z.literal("")),
});

/**
 * Parent-created nickname + PIN registration. This route is the ONLY place
 * a Supabase Auth user and matching `profiles` row get created for the
 * nickname/PIN login system — Supabase itself remains the authoritative
 * identity provider, this endpoint just adapts a kid-friendly nickname/PIN
 * form onto it.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { nickname, pin } = parsed.data;
  const parentEmail = parsed.data.parentEmail || undefined;

  if (!isValidNickname(nickname)) {
    return NextResponse.json(
      { error: "Nickname must be 3-24 characters: letters, numbers, spaces, - or _." },
      { status: 400 }
    );
  }
  if (!isValidPin(pin)) {
    return NextResponse.json(
      { error: "PIN must be 4-6 digits." },
      { status: 400 }
    );
  }

  const normalized = normalizeNickname(nickname);
  const alias = deriveAuthAlias(normalized);
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("nickname_normalized", normalized)
    .maybeSingle();

  if (existing) {
    // Deliberately generic — never confirm/deny in a way that helps an
    // attacker enumerate nicknames beyond "registration didn't happen."
    return NextResponse.json(
      { error: "That nickname isn't available. Try another one." },
      { status: 409 }
    );
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: aliasEmail(alias),
    password: pin,
    email_confirm: true,
    app_metadata: { provider: "nickname_pin" },
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: "Could not create account. Please try again." },
      { status: 500 }
    );
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    nickname,
    nickname_normalized: normalized,
    auth_alias: alias,
    parent_email: parentEmail ?? null,
  });

  if (profileError) {
    // Roll back the orphaned auth user so retrying isn't blocked forever.
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: "Could not create account. Please try again." },
      { status: 500 }
    );
  }

  // Parent-facing PIN recovery code — shown exactly once in this response,
  // never logged, never retrievable again after this point.
  const recoveryCode = generateRecoveryCode();
  await admin.from("recovery_codes").insert({
    user_id: created.user.id,
    code_hash: hashRecoveryCode(recoveryCode),
  });

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: aliasEmail(alias),
    password: pin,
  });

  if (signInError) {
    return NextResponse.json(
      { error: "Account created. Please sign in.", recoveryCode },
      { status: 201 }
    );
  }

  return NextResponse.json({ nickname, recoveryCode }, { status: 201 });
}
