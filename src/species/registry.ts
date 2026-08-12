import type { AvatarSpecies } from "@/types/species";
import { roundling } from "./definitions/roundling";
import { pixel } from "./definitions/pixel";
import { sprint } from "./definitions/sprint";
import { aurum } from "./definitions/aurum";
import { wisp } from "./definitions/wisp";

/**
 * The single source of truth for every species in the game. Nothing else
 * in the app should import a species definition directly — always go
 * through this registry so a 6th (7th, 8th...) species can be added here
 * without touching onboarding, the pet dashboard, evolution logic, or the
 * database layer.
 */
export const SPECIES_REGISTRY: readonly AvatarSpecies[] = [
  roundling,
  pixel,
  sprint,
  aurum,
  wisp,
];

export const SPECIES_BY_SLUG: Record<string, AvatarSpecies> =
  Object.fromEntries(SPECIES_REGISTRY.map((s) => [s.slug, s]));

export function getSpecies(slug: string): AvatarSpecies | undefined {
  return SPECIES_BY_SLUG[slug];
}

export function isValidSpeciesSlug(slug: string): boolean {
  return slug in SPECIES_BY_SLUG;
}
