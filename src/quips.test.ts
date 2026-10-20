import { describe, expect, it } from "vitest";
import { QUIPS, quip } from "./quips";

describe("quip", () => {
  it("can pick every line, first to last", () => {
    expect(quip("miss", () => 0)).toBe(QUIPS.miss[0]);
    expect(quip("miss", () => 0.999_999)).toBe(QUIPS.miss.at(-1));
  });

  it("has something to say for every outcome", () => {
    for (const lines of Object.values(QUIPS)) expect(lines.length).toBeGreaterThan(0);
  });
});
