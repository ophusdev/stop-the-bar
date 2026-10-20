import type { Outcome } from "./game";

interface Note {
  freq: number;
  duration: number; // seconds
  type?: OscillatorType;
  delay?: number; // seconds
}

const NOTES: Record<Outcome, Note[]> = {
  perfect: [
    { freq: 880, duration: 0.1 },
    { freq: 1320, duration: 0.15, delay: 0.08 },
  ],
  hit: [{ freq: 880, duration: 0.12 }],
  miss: [{ freq: 160, duration: 0.25, type: "triangle" }],
};

// Created on the first press: browsers only allow audio after a user gesture.
let audio: AudioContext | null = null;

export function playSound(outcome: Outcome) {
  audio ??= new AudioContext();
  if (audio.state === "suspended") void audio.resume();
  for (const note of NOTES[outcome]) beep(audio, note);
}

function beep(ctx: AudioContext, { freq, duration, type = "sine", delay = 0 }: Note) {
  const start = ctx.currentTime + delay;
  const osc = new OscillatorNode(ctx, { type, frequency: freq });
  const gain = new GainNode(ctx);
  // the ramp starts from the previous scheduled value, so pin it to the note's start
  gain.gain.setValueAtTime(0.25, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration);
}
