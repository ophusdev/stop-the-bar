import type { Outcome } from "./game";

export const QUIPS: Record<Outcome, readonly string[]> = {
  perfect: [
    "Surgical.",
    "Show-off.",
    "Dead center. Rude.",
    "Okay, sniper.",
    "Textbook.",
    "Did time slow down for you?",
    "Chef's kiss.",
    "Frame it.",
  ],
  hit: [
    "Got it.",
    "Close enough.",
    "That counts.",
    "Clean-ish.",
    "Not bad.",
    "In. Barely stylish.",
    "Yep.",
    "The bar respects you. A bit.",
  ],
  miss: [
    "Nope.",
    "Close. Not really.",
    "Bold strategy.",
    "Were you aiming?",
    "The zone was over there.",
    "The bar wins this one.",
    "Oof.",
    "Warm-up round, surely.",
  ],
};

export function quip(outcome: Outcome, random: () => number): string {
  const lines = QUIPS[outcome];
  return lines[Math.floor(random() * lines.length)] ?? "";
}
