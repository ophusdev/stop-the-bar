import { needleAt, type Outcome, PERFECT_CORE, press, startRound } from "./game";
import { quip } from "./quips";
import { playSound } from "./sound";
import { accuracy, freshStats, record } from "./stats";
import { load, openStore, save } from "./storage";

const RESULT_PAUSE_MS = 700;
const FOCUS_GUARD_MS = 300;

const LABELS: Record<Outcome, string> = {
  perfect: "Perfect!",
  hit: "Hit!",
  miss: "Miss",
};

const percent = new Intl.NumberFormat("en", { style: "percent" });

function required<T>(value: T | null, what: string): T {
  if (value === null) throw new Error(`Missing ${what}`);
  return value;
}

const element = (id: string) => required(document.getElementById(id), `#${id}`);

const ui = {
  play: element("play"),
  streak: element("streak"),
  zone: element("zone"),
  needle: element("needle"),
  result: element("result"),
  quip: element("quip"),
  best: element("best"),
  hits: element("hits"),
  perfects: element("perfects"),
  accuracy: element("accuracy"),
  mute: element("mute"),
  muteLabel: element("mute-label"),
  reset: element("reset"),
  resetDialog: required(document.querySelector("dialog"), "dialog"),
  confirmReset: element("confirm-reset"),
};

const store = openStore();
let data = load(store);
let round = startRound(data.stats.streak, 0, performance.now(), Math.random);
let nextRound = 0;

function showRound() {
  ui.streak.textContent = String(round.streak);
  ui.zone.style.left = `${round.zone.start * 100}%`;
  ui.zone.style.width = `${round.zone.width * 100}%`;
  ui.result.textContent = round.outcome ? LABELS[round.outcome] : "";
  ui.quip.textContent = "";
  ui.play.dataset.outcome = round.outcome ?? "";
  document.title = `Streak ${round.streak} · Stop The Bar`;
}

function showStats() {
  const { stats } = data;
  const ratio = accuracy(stats);
  ui.best.textContent = String(stats.best);
  ui.hits.textContent = String(stats.hits);
  ui.perfects.textContent = String(stats.perfects);
  ui.accuracy.textContent = ratio === null ? "–" : percent.format(ratio);
}

function showSettings() {
  const { muted } = data.settings;
  ui.mute.dataset.muted = String(muted);
  ui.muteLabel.textContent = muted ? "Sound off" : "Sound on";
}

function onPress(t: number) {
  const judged = press(round, t);
  if (!judged) return;
  const previousBest = data.stats.best;
  round = judged;
  data = { ...data, stats: record(data.stats, judged.outcome, judged.streak) };
  save(store, data);
  if (!data.settings.muted) playSound(judged.outcome);
  showRound();
  showStats();
  if (data.stats.best > previousBest) ui.result.textContent += " New best!";
  ui.quip.textContent = quip(judged.outcome, Math.random);
  nextRound = window.setTimeout(() => {
    round = startRound(round.streak, round.sweep.phase0, performance.now(), Math.random);
    showRound();
  }, RESULT_PAUSE_MS);
}

function resetStats() {
  window.clearTimeout(nextRound);
  data = { ...data, stats: freshStats() };
  save(store, data);
  round = startRound(0, round.sweep.phase0, performance.now(), Math.random);
  showRound();
  showStats();
}

// Space always plays: closing the dialog puts focus back on the Reset button,
// and Space must not open it again. Enter is left to buttons, so they stay
// usable from the keyboard.
function isGameKey(e: KeyboardEvent) {
  if (ui.resetDialog.open) return false;
  if (e.code === "Space") return true;
  return e.code === "Enter" && !(e.target instanceof HTMLButtonElement);
}

window.addEventListener("keydown", (e) => {
  if (!isGameKey(e)) return;
  e.preventDefault();
  if (!e.repeat) onPress(e.timeStamp);
});

// buttons fire on keyup for Space
window.addEventListener("keyup", (e) => {
  if (isGameKey(e)) e.preventDefault();
});

// The click that brings the window back to the front is not a shot. Browsers
// disagree on whether "focus" fires before or after that pointerdown, so both
// orders are covered: no focus yet, or focus only just now.
let wasAway = false;
let focusedAt: number | null = null;
window.addEventListener("blur", () => {
  wasAway = true;
  focusedAt = null;
});
window.addEventListener("focus", (e) => {
  focusedAt = e.timeStamp;
});

function isFocusClick(t: number) {
  if (!wasAway) return false;
  wasAway = false;
  return focusedAt === null || t - focusedAt < FOCUS_GUARD_MS;
}

ui.play.addEventListener("pointerdown", (e) => {
  if (e.button === 0 && !isFocusClick(e.timeStamp)) onPress(e.timeStamp);
});

ui.mute.addEventListener("click", () => {
  data = { ...data, settings: { ...data.settings, muted: !data.settings.muted } };
  save(store, data);
  showSettings();
});

ui.reset.addEventListener("click", () => ui.resetDialog.showModal());

ui.resetDialog.addEventListener("submit", (e) => {
  if (e.submitter === ui.confirmReset) resetStats();
});

function frame(now: number) {
  ui.needle.style.transform = `translateX(${needleAt(round.sweep, now) * 100}%)`;
  requestAnimationFrame(frame);
}

document.documentElement.style.setProperty("--perfect-core", String(PERFECT_CORE));
showRound();
showStats();
showSettings();
document.documentElement.dataset.ready = "";
requestAnimationFrame(frame);
