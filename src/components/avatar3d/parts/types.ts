export type AnimationState =
  | "idle"
  | "sleep"
  | "eat"
  | "clean"
  | "play"
  | "illness"
  | "recovery"
  | "celebration"
  | "comfort"
  | "walk";

export interface CreaturePartProps {
  variant: string;
  accentColor: string;
  faceColor: string;
  state: AnimationState;
  /** 0-1 emissive glow driven by evolution stage detail. */
  glow: number;
  scale?: number;
}
