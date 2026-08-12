import type { AvatarSpecies, ResolvedTraits } from "@/types/species";
import { pick, pickWeighted, seededRng } from "@/lib/rng";

/**
 * Resolve the full randomized trait set for a species + seed. Called both
 * client-side (live onboarding preview) and server-side (hatch endpoint,
 * to independently verify the client didn't tamper with the resolved
 * traits before submitting them).
 */
export function resolveTraits(
  species: AvatarSpecies,
  seed: string
): ResolvedTraits {
  const rng = seededRng(`${species.slug}:${seed}`);
  const eyeVariant = pick(rng, species.eyeVariants);
  const mouthVariant = pick(rng, species.mouthVariants);
  const earVariant = pick(rng, species.earVariants);
  const patternVariant = pick(rng, species.patternVariants);
  const personality = species.personalityWeights
    ? pickWeighted(rng, species.personalityWeights)
    : pick(rng, species.personalities);
  return { eyeVariant, mouthVariant, earVariant, patternVariant, personality };
}

export function traitsMatch(a: ResolvedTraits, b: ResolvedTraits): boolean {
  return (
    a.eyeVariant === b.eyeVariant &&
    a.mouthVariant === b.mouthVariant &&
    a.earVariant === b.earVariant &&
    a.patternVariant === b.patternVariant &&
    a.personality === b.personality
  );
}
