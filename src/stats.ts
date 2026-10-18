import type { Outcome } from "./game";

export interface Stats {
  best: number;
  streak: number;
  attempts: number;
  hits: number; // perfects included
  perfects: number;
}

export const freshStats = (): Stats => ({ best: 0, streak: 0, attempts: 0, hits: 0, perfects: 0 });

export function record(stats: Stats, outcome: Outcome, streak: number): Stats {
  return {
    best: Math.max(stats.best, streak),
    streak,
    attempts: stats.attempts + 1,
    hits: stats.hits + (outcome === "miss" ? 0 : 1),
    perfects: stats.perfects + (outcome === "perfect" ? 1 : 0),
  };
}

export const accuracy = (stats: Stats) =>
  stats.attempts === 0 ? null : stats.hits / stats.attempts;
