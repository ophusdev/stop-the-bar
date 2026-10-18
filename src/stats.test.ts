import { describe, expect, it } from "vitest";
import { accuracy, freshStats, record } from "./stats";

describe("record", () => {
  it("counts a hit", () => {
    const stats = record(freshStats(), "hit", 1);
    expect(stats).toEqual({ best: 1, streak: 1, attempts: 1, hits: 1, perfects: 0 });
  });

  it("counts a perfect as a hit too", () => {
    const stats = record(freshStats(), "perfect", 1);
    expect(stats).toEqual({ best: 1, streak: 1, attempts: 1, hits: 1, perfects: 1 });
  });

  it("keeps the best streak after a miss", () => {
    const before = { best: 5, streak: 5, attempts: 9, hits: 7, perfects: 2 };
    expect(record(before, "miss", 0)).toEqual({ ...before, streak: 0, attempts: 10 });
  });
});

describe("accuracy", () => {
  it("is unknown before the first attempt", () => {
    expect(accuracy(freshStats())).toBeNull();
  });

  it("is hits over attempts", () => {
    expect(accuracy({ ...freshStats(), attempts: 4, hits: 3 })).toBe(0.75);
  });
});
