import { describe, expect, it } from "vitest";
import {
  BASE_SPEED,
  judge,
  MAX_SPEED,
  MIN_WIDTH,
  needleAt,
  press,
  type Round,
  START_WIDTH,
  speedFor,
  startRound,
  zoneWidthFor,
} from "./game";

const always = (value: number) => () => value;

describe("difficulty", () => {
  it("starts wide and slow", () => {
    expect(zoneWidthFor(0)).toBe(START_WIDTH);
    expect(speedFor(0)).toBe(BASE_SPEED);
  });

  it("gets harder with every step of the streak", () => {
    for (let streak = 0; streak < 10; streak++) {
      expect(zoneWidthFor(streak + 1)).toBeLessThan(zoneWidthFor(streak));
      expect(speedFor(streak + 1)).toBeGreaterThan(speedFor(streak));
    }
  });

  it("stops at the floor and the ceiling", () => {
    expect(zoneWidthFor(1000)).toBe(MIN_WIDTH);
    expect(speedFor(1000)).toBe(MAX_SPEED);
  });
});

describe("needleAt", () => {
  const sweep = { phase0: 0, t0: 1000, speed: 1 };

  it("sweeps right, then back left", () => {
    expect(needleAt(sweep, 1000)).toBe(0);
    expect(needleAt(sweep, 1500)).toBe(0.5);
    expect(needleAt(sweep, 2000)).toBe(1);
    expect(needleAt(sweep, 2500)).toBe(0.5);
    expect(needleAt(sweep, 3000)).toBe(0);
    expect(needleAt(sweep, 3250)).toBe(0.25);
  });

  it("picks up from the starting phase", () => {
    const goingBack = { phase0: 1.5, t0: 0, speed: 1 };
    expect(needleAt(goingBack, 0)).toBe(0.5);
    expect(needleAt(goingBack, 250)).toBe(0.25);
  });

  it("stays put when stopped", () => {
    const stopped = { phase0: 0.4, t0: 0, speed: 0 };
    expect(needleAt(stopped, 0)).toBe(0.4);
    expect(needleAt(stopped, 60_000)).toBe(0.4);
  });
});

describe("judge", () => {
  const zone = { start: 0.25, width: 0.5 }; // perfect core: 0.5 ± 0.075

  it("calls the center perfect", () => {
    expect(judge(0.5, zone)).toBe("perfect");
    expect(judge(0.43, zone)).toBe("perfect");
    expect(judge(0.57, zone)).toBe("perfect");
  });

  it("counts the rest of the zone as a hit, edges included", () => {
    expect(judge(0.25, zone)).toBe("hit");
    expect(judge(0.42, zone)).toBe("hit");
    expect(judge(0.58, zone)).toBe("hit");
    expect(judge(0.75, zone)).toBe("hit");
  });

  it("misses outside the zone", () => {
    expect(judge(0.2499, zone)).toBe("miss");
    expect(judge(0.7501, zone)).toBe("miss");
  });
});

describe("startRound", () => {
  it("keeps the zone on the bar", () => {
    const left = startRound(0, 0, 0, always(0));
    const right = startRound(0, 0, 0, always(0.999_999));
    expect(left.zone.start).toBe(0);
    expect(right.zone.start + right.zone.width).toBeLessThanOrEqual(1);
  });

  it("sizes the zone and the speed from the streak", () => {
    const round = startRound(7, 0, 0, Math.random);
    expect(round.zone.width).toBe(zoneWidthFor(7));
    expect(round.sweep.speed).toBe(speedFor(7));
    expect(round.outcome).toBeNull();
  });
});

describe("press", () => {
  // the needle starts at 0 and covers half the bar every second
  const round: Round = {
    streak: 3,
    zone: { start: 0.4, width: 0.2 },
    sweep: { phase0: 0, t0: 0, speed: 0.5 },
    outcome: null,
  };

  function pressAt(t: number) {
    const judged = press(round, t);
    if (!judged) throw new Error(`press at ${t} was ignored`);
    return judged;
  }

  it("extends the streak on a hit", () => {
    expect(press(round, 900)).toMatchObject({ outcome: "hit", streak: 4 }); // needle at 0.45
  });

  it("extends the streak on a perfect", () => {
    expect(press(round, 1000)).toMatchObject({ outcome: "perfect", streak: 4 }); // needle at 0.5
  });

  it("resets the streak on a miss", () => {
    expect(press(round, 200)).toMatchObject({ outcome: "miss", streak: 0 }); // needle at 0.1
  });

  it("freezes the needle where it was pressed", () => {
    const { sweep } = pressAt(900);
    expect(needleAt(sweep, 900)).toBeCloseTo(0.45);
    expect(needleAt(sweep, 5000)).toBeCloseTo(0.45);
  });

  it("ignores a second press while the result is showing", () => {
    expect(press(pressAt(900), 950)).toBeNull();
  });

  it("ignores a press queued before the round started", () => {
    expect(press(round, -1)).toBeNull();
  });

  it("lets the next round continue from where the needle stopped", () => {
    const stopped = pressAt(900);
    const next = startRound(stopped.streak, stopped.sweep.phase0, 2000, Math.random);
    expect(needleAt(next.sweep, 2000)).toBeCloseTo(0.45);
  });
});
