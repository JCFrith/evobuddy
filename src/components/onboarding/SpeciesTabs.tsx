"use client";

import { SPECIES_REGISTRY } from "@/species/registry";

export function SpeciesTabs({
  selectedSlug,
  onSelect,
}: {
  selectedSlug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div role="tablist" aria-label="Choose a species" className="flex gap-2 overflow-x-auto pb-2">
      {SPECIES_REGISTRY.map((species) => (
        <button
          key={species.slug}
          role="tab"
          aria-selected={selectedSlug === species.slug}
          onClick={() => onSelect(species.slug)}
          className={`shrink-0 rounded-2xl border-2 px-4 py-3 text-left transition ${
            selectedSlug === species.slug
              ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10"
              : "border-[var(--color-card-border)] bg-white"
          }`}
        >
          <div className="font-display font-bold">{species.displayName}</div>
          <div className="text-xs opacity-70 max-w-[14rem]">{species.tagline}</div>
        </button>
      ))}
    </div>
  );
}
