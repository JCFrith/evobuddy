"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { SPECIES_REGISTRY, getSpecies } from "@/species/registry";
import { resolveTraits } from "@/lib/traits";
import { randomSeed } from "@/lib/rng";
import { SpeciesTabs } from "@/components/onboarding/SpeciesTabs";
import { ColorSwatchPicker } from "@/components/onboarding/ColorSwatchPicker";

const AvatarViewport = dynamic(
  () => import("@/components/avatar3d/AvatarViewport").then((m) => m.AvatarViewport),
  { ssr: false, loading: () => <ViewportSkeleton /> }
);

function ViewportSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center text-sm opacity-60">
      Loading 3D preview…
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [speciesSlug, setSpeciesSlug] = useState(SPECIES_REGISTRY[0].slug);
  const species = getSpecies(speciesSlug)!;

  const [seed, setSeed] = useState(() => randomSeed());
  const [bodyColor, setBodyColor] = useState(species.defaultBodyColor);
  const [secondaryColor, setSecondaryColor] = useState(species.defaultSecondaryColor);
  const [faceColor, setFaceColor] = useState(species.defaultFaceColor);
  const [name, setName] = useState("");
  const [hatching, setHatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const traits = useMemo(() => resolveTraits(species, seed), [species, seed]);

  function selectSpecies(slug: string) {
    const next = getSpecies(slug)!;
    setSpeciesSlug(slug);
    setBodyColor(next.defaultBodyColor);
    setSecondaryColor(next.defaultSecondaryColor);
    setFaceColor(next.defaultFaceColor);
    setSeed(randomSeed());
  }

  function surpriseMeAgain() {
    setSeed(randomSeed());
  }

  async function hatch() {
    if (!name.trim()) {
      setError("Give your buddy a name first.");
      return;
    }
    setHatching(true);
    setError(null);
    try {
      const res = await fetch("/api/avatar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speciesSlug,
          name: name.trim(),
          seed,
          bodyColor,
          secondaryColor,
          faceColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not hatch your avatar.");
        return;
      }
      router.push("/pet");
      router.refresh();
    } finally {
      setHatching(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <header className="text-center">
        <h1 className="font-display text-3xl font-bold">Choose your companion</h1>
        <p className="opacity-70 text-sm mt-1">
          Rotate to look around, pick your colors, then hatch when you&apos;re ready.
        </p>
      </header>

      <SpeciesTabs selectedSlug={speciesSlug} onSelect={selectSpecies} />

      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border border-[var(--color-card-border)] bg-gradient-to-b from-white to-[var(--color-app-bg)] aspect-square md:aspect-auto md:h-[26rem] overflow-hidden">
          <AvatarViewport
            species={species}
            traits={traits}
            seed={seed}
            bodyColor={bodyColor}
            secondaryColor={secondaryColor}
            faceColor={faceColor}
            level={1}
            state="idle"
            interactive
            autoRotate
            minZoom={1.4}
            maxZoom={4}
          />
        </div>

        <div className="rounded-3xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-5">
          <label className="block text-sm font-semibold mb-4">
            Name your buddy
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder="e.g. Blip"
              className="mt-1 w-full rounded-xl border border-[var(--color-card-border)] px-3 py-2 text-base font-normal outline-none focus:border-[var(--color-brand)]"
            />
          </label>

          <ColorSwatchPicker label="Body color" colors={species.allowedBodyColors} value={bodyColor} onChange={setBodyColor} />
          <ColorSwatchPicker label="Secondary color" colors={species.allowedSecondaryColors} value={secondaryColor} onChange={setSecondaryColor} />
          <ColorSwatchPicker label="Face color" colors={species.allowedFaceColors} value={faceColor} onChange={setFaceColor} />

          <div className="rounded-2xl bg-black/5 p-3 text-sm mb-4">
            <p className="font-semibold mb-1">Randomized this roll:</p>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1 opacity-80">
              <li>Eyes: {traits.eyeVariant}</li>
              <li>Mouth: {traits.mouthVariant}</li>
              <li>Ears: {traits.earVariant}</li>
              <li>Pattern: {traits.patternVariant}</li>
              <li className="col-span-2">Personality: {traits.personality}</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={surpriseMeAgain}
            className="w-full rounded-xl border-2 border-[var(--color-brand)] py-2.5 font-bold text-[var(--color-brand)] mb-3"
          >
            🎲 Surprise Me Again
          </button>

          {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}

          <button
            type="button"
            onClick={hatch}
            disabled={hatching}
            className="w-full rounded-xl bg-[var(--color-brand)] py-3 font-bold text-white disabled:opacity-60"
          >
            {hatching ? "Hatching…" : `Hatch ${species.displayName}`}
          </button>
        </div>
      </div>
    </main>
  );
}
