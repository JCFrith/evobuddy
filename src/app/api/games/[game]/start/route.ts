import { NextResponse } from "next/server";
import { GAMES, type GameSlug, createGameSession } from "@/lib/games";
import { getAuthenticatedUserId } from "@/lib/avatarService";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ game: string }> }
) {
  const { game } = await params;
  if (!(game in GAMES)) {
    return NextResponse.json({ error: "Unknown game." }, { status: 400 });
  }
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: avatar } = await admin
    .from("avatars")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!avatar) {
    return NextResponse.json({ error: "No avatar found." }, { status: 400 });
  }

  const sessionToken = createGameSession(avatar.id, game as GameSlug);
  return NextResponse.json({ sessionToken, game: GAMES[game as GameSlug] });
}
