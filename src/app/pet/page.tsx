"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSpecies } from "@/species/registry";
import type { AvatarSummary } from "@/types/api";
import type { CareAction } from "@/lib/care";
import type { AnimationState } from "@/components/avatar3d/parts/types";
import { StatBars } from "@/components/dashboard/StatBars";
import { ActionBar } from "@/components/dashboard/ActionBar";

const AvatarViewport = dynamic(
  () => import("@/components/avatar3d/AvatarViewport").then((m) => m.AvatarViewport),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm opacity-60">Loading…</div> }
);

const ACTION_STATE: Record<CareAction, AnimationState> = {
  feed: "eat",
  clean: "clean",
  play: "play",
  pet: "comfort",
  celebrate: "celebration",
  sleep_start: "sleep",
  sleep_end: "idle",
  heal: "recovery",
};

const MOOD_EMOJI: Record<string, string> = {
  great: "😄", content: "🙂", grumpy: "😕", sad: "😢", sick: "🤒", sleepy: "😴",
};

export default function PetPage() {
  const router = useRouter();
  const [avatar, setAvatar] = useState<AvatarSummary | null | undefined>(undefined);
  const [activeState, setActiveState] = useState<AnimationState | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/avatar");
    const data = await res.json();
    setAvatar(data.avatar ?? null);
  }, []);

  useEffect(() => {
    // Fetch-on-mount: `refresh` awaits a network request before calling
    // setAvatar, so this does not set state synchronously during the
    // effect/render phase. Suppressed because the experimental
    // react-hooks purity rule traces the call into `refresh` and can't
    // tell the setState is behind an await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (avatar === null) router.replace("/onboarding");
  }, [avatar, router]);

  const species = avatar ? getSpecies(avatar.speciesSlug) : undefined;

  const baseState: AnimationState = useMemo(() => {
    if (!avatar) return "idle";
    if (avatar.isSick) return "illness";
    if (avatar.isAsleep) return "sleep";
    return "idle";
  }, [avatar]);

  async function handleAction(action: CareAction) {
    if (!avatar || busy) return;
    setBusy(true);
    setActiveState(ACTION_STATE[action]);
    try {
      const res = await fetch(`/api/care/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAvatar((prev) =>
          prev
            ? {
                ...prev,
                stats: data.stats,
                isAsleep: data.isAsleep,
                isSick: data.isSick,
                totalXp: data.totalXp,
              }
            : prev
        );
        if (data.leveledUp) setToast(`Level up! ✨`);
        if (data.newStage) setToast(`Evolved into a new stage! 🌟`);
        if (data.branchAssigned) setToast(`${avatar.name} found its path: ${data.branchAssigned}!`);
        // Re-fetch shortly after to pick up the recomputed level/stage/mood.
        setTimeout(refresh, 400);
      }
    } finally {
      setBusy(false);
      setTimeout(() => setActiveState(null), 2200);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  if (avatar === undefined) {
    return <main className="flex flex-1 items-center justify-center">Loading your buddy…</main>;
  }
  if (!avatar || !species) {
    return <main className="flex flex-1 items-center justify-center">Redirecting…</main>;
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{avatar.name}</h1>
          <p className="text-xs opacity-70">
            {avatar.stageDisplayName}
            {avatar.evolutionBranch && avatar.evolutionBranch !== "balanced" ? ` · ${avatar.evolutionBranch}` : ""}
            {" · "}Level {avatar.level}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/games" className="rounded-xl bg-[var(--color-brand-warm)] px-3 py-2 text-sm font-bold text-white">
            🎮 Games
          </Link>
          <span className="text-2xl" aria-label={`Mood: ${avatar.mood}`} title={avatar.mood}>
            {MOOD_EMOJI[avatar.mood] ?? "🙂"}
          </span>
        </div>
      </header>

      <div className="rounded-full h-2 w-full bg-black/10 overflow-hidden" aria-label="XP progress">
        <div
          className="h-full bg-[var(--color-brand)] transition-all duration-500"
          style={{ width: `${Math.min(100, (avatar.xpIntoLevel / avatar.xpForNextLevel) * 100)}%` }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border border-[var(--color-card-border)] bg-gradient-to-b from-white to-[var(--color-app-bg)] aspect-square md:aspect-auto md:h-[24rem] overflow-hidden relative">
          {toast && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-4 py-1.5 text-xs font-semibold text-white z-10">
              {toast}
            </div>
          )}
          <AvatarViewport
            species={species}
            traits={avatar.traits}
            seed={avatar.seed}
            bodyColor={avatar.bodyColor}
            secondaryColor={avatar.secondaryColor}
            faceColor={avatar.faceColor}
            level={avatar.level}
            state={activeState ?? baseState}
            interactive
            minZoom={1.6}
            maxZoom={4.5}
          />
        </div>

        <div className="rounded-3xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-5 flex flex-col gap-4">
          <StatBars stats={avatar.stats} />
          <ActionBar
            isAsleep={avatar.isAsleep}
            isSick={avatar.isSick}
            disabled={busy}
            onAction={handleAction}
          />
        </div>
      </div>
    </main>
  );
}
