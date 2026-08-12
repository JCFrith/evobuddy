/**
 * Server-authoritative care simulation. Every function here is a pure
 * function of (current DB state, elapsed real time) — never of anything
 * the client supplies directly — which is what makes offline progression
 * both authoritative (client can't fast-forward or rewind its pet) and
 * idempotent (re-running the tick after `last_tick_at` has already caught
 * up to `now` produces zero additional change).
 */

export interface AvatarStats {
  statHunger: number;
  statClean: number;
  statEnergy: number;
  statHappiness: number;
  statHealth: number;
  isAsleep: boolean;
  isSick: boolean;
  sickSince: string | null;
  lastTickAt: string;
}

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

// Per-hour rates while awake.
const HUNGER_DECAY_PER_HOUR = 4;
const CLEAN_DECAY_PER_HOUR = 3;
const ENERGY_DECAY_PER_HOUR = 4.5;
const HAPPINESS_DECAY_PER_HOUR = 2;

// While asleep, energy recovers and other decay slows dramatically.
const ENERGY_RECOVER_PER_HOUR_ASLEEP = 9;
const AWAKE_STAT_SLOWDOWN_ASLEEP = 0.25;

const SICK_HEALTH_DECAY_PER_HOUR = 6;
const HEALTHY_HEALTH_REGEN_PER_HOUR = 1.5;
const SICK_TRIGGER_THRESHOLD = 12; // hunger/clean/energy below this risks illness
const SICK_TRIGGER_HOURS = 3; // ...sustained for this many hours

export interface TickResult {
  stats: AvatarStats;
  becameSick: boolean;
  recovered: boolean;
  hoursElapsed: number;
}

/**
 * Advance an avatar's stats from `stats.lastTickAt` to `now`. Safe to call
 * with any `now` >= lastTickAt, including repeatedly with the same or a
 * very close `now` (hoursElapsed will simply be ~0 and nothing changes).
 */
export function tickStats(stats: AvatarStats, now: Date): TickResult {
  const last = new Date(stats.lastTickAt);
  const hoursElapsed = Math.max(0, (now.getTime() - last.getTime()) / 3_600_000);

  if (hoursElapsed <= 0) {
    return { stats, becameSick: false, recovered: false, hoursElapsed: 0 };
  }

  const slow = stats.isAsleep ? AWAKE_STAT_SLOWDOWN_ASLEEP : 1;

  const hunger = clamp(stats.statHunger - HUNGER_DECAY_PER_HOUR * slow * hoursElapsed);
  const clean = clamp(stats.statClean - CLEAN_DECAY_PER_HOUR * slow * hoursElapsed);
  const energy = stats.isAsleep
    ? clamp(stats.statEnergy + ENERGY_RECOVER_PER_HOUR_ASLEEP * hoursElapsed)
    : clamp(stats.statEnergy - ENERGY_DECAY_PER_HOUR * hoursElapsed);
  const happiness = clamp(stats.statHappiness - HAPPINESS_DECAY_PER_HOUR * slow * hoursElapsed);

  const critical = hunger < SICK_TRIGGER_THRESHOLD || clean < SICK_TRIGGER_THRESHOLD;
  let isSick = stats.isSick;
  let sickSince = stats.sickSince;
  let becameSick = false;
  let recovered = false;
  let health = stats.statHealth;

  if (!isSick && critical) {
    const criticalSinceGuess = sickSince ?? now.toISOString();
    const sustainedHours =
      (now.getTime() - new Date(criticalSinceGuess).getTime()) / 3_600_000;
    if (!sickSince) {
      sickSince = now.toISOString();
    } else if (sustainedHours >= SICK_TRIGGER_HOURS) {
      isSick = true;
      becameSick = true;
    }
  } else if (!critical && !isSick) {
    sickSince = null;
  }

  if (isSick) {
    health = clamp(health - SICK_HEALTH_DECAY_PER_HOUR * hoursElapsed);
  } else {
    health = clamp(health + HEALTHY_HEALTH_REGEN_PER_HOUR * hoursElapsed);
    if (stats.isSick && health >= 60) {
      recovered = true;
    }
  }

  return {
    stats: {
      statHunger: hunger,
      statClean: clean,
      statEnergy: energy,
      statHappiness: happiness,
      statHealth: health,
      isAsleep: stats.isAsleep,
      isSick: recovered ? false : isSick,
      sickSince: recovered ? null : sickSince,
      lastTickAt: now.toISOString(),
    },
    becameSick,
    recovered,
    hoursElapsed,
  };
}

export type CareAction =
  | "feed"
  | "clean"
  | "play"
  | "sleep_start"
  | "sleep_end"
  | "pet"
  | "heal"
  | "celebrate";

export interface CareActionEffect {
  statDelta: Partial<Pick<AvatarStats, "statHunger" | "statClean" | "statEnergy" | "statHappiness" | "statHealth">>;
  setAsleep?: boolean;
  clearSickIfHealed?: boolean;
  xp: number;
}

const CARE_ACTION_EFFECTS: Record<CareAction, CareActionEffect> = {
  feed: { statDelta: { statHunger: 28, statHappiness: 4 }, xp: 8 },
  clean: { statDelta: { statClean: 32, statHappiness: 3 }, xp: 8 },
  play: { statDelta: { statHappiness: 18, statEnergy: -8 }, xp: 12 },
  sleep_start: { statDelta: {}, setAsleep: true, xp: 2 },
  sleep_end: { statDelta: {}, setAsleep: false, xp: 2 },
  pet: { statDelta: { statHappiness: 10 }, xp: 4 },
  heal: { statDelta: { statHealth: 35 }, clearSickIfHealed: true, xp: 10 },
  celebrate: { statDelta: { statHappiness: 22 }, xp: 15 },
};

export function getCareActionEffect(action: CareAction): CareActionEffect {
  return CARE_ACTION_EFFECTS[action];
}

export function applyCareAction(stats: AvatarStats, action: CareAction): AvatarStats {
  const effect = getCareActionEffect(action);
  const next: AvatarStats = { ...stats };
  for (const [key, delta] of Object.entries(effect.statDelta) as [
    keyof CareActionEffect["statDelta"],
    number,
  ][]) {
    next[key] = clamp((next[key] ?? 0) + delta);
  }
  if (effect.setAsleep !== undefined) next.isAsleep = effect.setAsleep;
  if (effect.clearSickIfHealed && next.statHealth >= 40) {
    next.isSick = false;
    next.sickSince = null;
  }
  return next;
}

/** Current mood, derived purely from stats — drives the avatar's face/animation. */
export type Mood = "great" | "content" | "grumpy" | "sad" | "sick" | "sleepy";

export function deriveMood(stats: AvatarStats): Mood {
  if (stats.isSick) return "sick";
  if (stats.isAsleep) return "sleepy";
  const avg = (stats.statHunger + stats.statClean + stats.statEnergy + stats.statHappiness) / 4;
  if (avg >= 75) return "great";
  if (avg >= 50) return "content";
  if (avg >= 28) return "grumpy";
  return "sad";
}
