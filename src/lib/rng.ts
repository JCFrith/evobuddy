/**
 * Deterministic seeded PRNG. Every "random" avatar trait in this app is
 * derived from a stored string seed, so the exact same seed always produces
 * the exact same eyes/mouth/ears/pattern/personality — this is what makes
 * randomized traits "remain deterministic after the user finishes
 * onboarding": we never re-roll after hatch, we just re-derive from the
 * persisted seed.
 */

function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Create a deterministic RNG function from any string seed. */
export function seededRng(seed: string): () => number {
  const seedFn = xmur3(seed);
  return mulberry32(seedFn());
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

export function pickWeighted<T extends string>(
  rng: () => number,
  weights: Record<T, number>
): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

export function randomSeed(): string {
  // Only used client-side for onboarding "Surprise Me Again" previews,
  // never persisted as-is without going through the hatch endpoint.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
