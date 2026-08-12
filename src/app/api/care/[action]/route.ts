import { NextResponse } from "next/server";
import { applyCareActionToOwnAvatar } from "@/lib/avatarService";
import type { CareAction } from "@/lib/care";

const VALID_ACTIONS: CareAction[] = [
  "feed", "clean", "play", "sleep_start", "sleep_end", "pet", "heal", "celebrate",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  if (!VALID_ACTIONS.includes(action as CareAction)) {
    return NextResponse.json({ error: "Unknown care action." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const idempotencyKey =
    typeof body?.idempotencyKey === "string" ? body.idempotencyKey.slice(0, 128) : undefined;

  const result = await applyCareActionToOwnAvatar(action as CareAction, idempotencyKey);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    xpAwarded: result.xpAwarded,
    leveledUp: result.leveledUp,
    newStage: result.newStage,
    branchAssigned: result.branchAssigned,
    stats: {
      hunger: Number(result.avatar.stat_hunger),
      clean: Number(result.avatar.stat_clean),
      energy: Number(result.avatar.stat_energy),
      happiness: Number(result.avatar.stat_happiness),
      health: Number(result.avatar.stat_health),
    },
    isAsleep: result.avatar.is_asleep,
    isSick: result.avatar.is_sick,
    totalXp: result.avatar.total_xp,
  });
}
