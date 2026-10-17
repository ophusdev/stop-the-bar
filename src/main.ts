import "./style.css";
import { needleAt, type Outcome, PERFECT_CORE, press, startRound } from "./game";

const RESULT_PAUSE_MS = 700;

const LABELS: Record<Outcome, string> = {
  perfect: "Perfect!",
  hit: "Hit!",
  miss: "Miss",
};

function element(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
}

const ui = {
  play: element("play"),
  streak: element("streak"),
  zone: element("zone"),
  needle: element("needle"),
  result: element("result"),
};

let round = startRound(0, 0, performance.now(), Math.random);

function showRound() {
  ui.streak.textContent = String(round.streak);
  ui.zone.style.left = `${round.zone.start * 100}%`;
  ui.zone.style.width = `${round.zone.width * 100}%`;
  ui.result.textContent = round.outcome ? LABELS[round.outcome] : "";
  ui.play.dataset.outcome = round.outcome ?? "";
  document.title = `Streak ${round.streak} · Stop The Bar`;
}

function onPress(t: number) {
  const next = press(round, t);
  if (next === round) return;
  round = next;
  showRound();
  setTimeout(() => {
    round = startRound(round.streak, round.sweep.phase0, performance.now(), Math.random);
    showRound();
  }, RESULT_PAUSE_MS);
}

ui.play.addEventListener("pointerdown", (e) => {
  if (e.button === 0) onPress(e.timeStamp);
});

window.addEventListener("keydown", (e) => {
  if (e.code !== "Space" && e.code !== "Enter") return;
  e.preventDefault();
  if (!e.repeat) onPress(e.timeStamp);
});

function frame(now: number) {
  ui.needle.style.transform = `translateX(${needleAt(round.sweep, now) * 100}%)`;
  requestAnimationFrame(frame);
}

document.documentElement.style.setProperty("--perfect-core", String(PERFECT_CORE));
showRound();
requestAnimationFrame(frame);
