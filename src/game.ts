export const START_WIDTH = 0.3; // fraction of the bar
export const MIN_WIDTH = 0.03;
export const SHRINK = 0.87; // zone width multiplier per streak step
export const BASE_SPEED = 0.6; // bar widths per second
export const SPEED_STEP = 0.06; // +6% speed per streak step
export const MAX_SPEED = 2.5;
export const PERFECT_CORE = 0.15; // perfect = within ±15% of the zone width from its center

export type Outcome = "perfect" | "hit" | "miss";

export interface Zone {
  start: number;
  width: number;
}

// The needle's position is derived from time instead of being advanced every
// frame, so a press is judged at the exact moment it happened.
// The phase runs from 0 to 2: 0→1 is the sweep to the right, 1→2 the way back.
export interface Sweep {
  phase0: number;
  t0: number; // ms, same clock as performance.now() and Event.timeStamp
  speed: number; // 0 while the needle is stopped
}

export interface Round {
  streak: number;
  zone: Zone;
  sweep: Sweep;
  outcome: Outcome | null; // null until the player presses
}

export const zoneWidthFor = (streak: number) => Math.max(MIN_WIDTH, START_WIDTH * SHRINK ** streak);

export const speedFor = (streak: number) =>
  Math.min(MAX_SPEED, BASE_SPEED * (1 + SPEED_STEP * streak));

export function phaseAt(sweep: Sweep, t: number): number {
  return (sweep.phase0 + (sweep.speed * (t - sweep.t0)) / 1000) % 2;
}

export function needleAt(sweep: Sweep, t: number): number {
  const phase = phaseAt(sweep, t);
  return phase <= 1 ? phase : 2 - phase;
}

export function judge(needle: number, zone: Zone): Outcome {
  const center = zone.start + zone.width / 2;
  if (Math.abs(needle - center) <= zone.width * PERFECT_CORE) return "perfect";
  if (needle >= zone.start && needle <= zone.start + zone.width) return "hit";
  return "miss";
}

export function startRound(streak: number, phase0: number, t: number, random: () => number): Round {
  const width = zoneWidthFor(streak);
  return {
    streak,
    zone: { start: random() * (1 - width), width },
    sweep: { phase0, t0: t, speed: speedFor(streak) },
    outcome: null,
  };
}

export type JudgedRound = Round & { outcome: Outcome };

// Returns null when the press doesn't count: the result is already showing,
// or the event was queued before this round started.
export function press(round: Round, t: number): JudgedRound | null {
  if (round.outcome !== null || t < round.sweep.t0) return null;
  const outcome = judge(needleAt(round.sweep, t), round.zone);
  return {
    ...round,
    streak: outcome === "miss" ? 0 : round.streak + 1,
    sweep: { phase0: phaseAt(round.sweep, t), t0: t, speed: 0 },
    outcome,
  };
}
