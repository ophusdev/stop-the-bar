import { describe, expect, it } from "vitest";
import { freshStats } from "./stats";
import { load, type SaveData, type Store, save } from "./storage";

const defaults: SaveData = { stats: freshStats(), settings: { muted: false } };

function memoryStore(): Store {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
  };
}

const storeHolding = (value: string): Store => ({ getItem: () => value, setItem: () => {} });

const broken: Store = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

describe("load", () => {
  it("starts fresh when nothing is saved", () => {
    expect(load(memoryStore())).toEqual(defaults);
  });

  it("reads back what was saved", () => {
    const store = memoryStore();
    const data: SaveData = {
      stats: { best: 12, streak: 3, attempts: 40, hits: 30, perfects: 4 },
      settings: { muted: true },
    };
    save(store, data);
    expect(load(store)).toEqual(data);
  });

  it("starts fresh from corrupted JSON", () => {
    expect(load(storeHolding("{not json"))).toEqual(defaults);
  });

  it("starts fresh when the save is not an object", () => {
    expect(load(storeHolding("[1, 2, 3]"))).toEqual(defaults);
    expect(load(storeHolding("42"))).toEqual(defaults);
  });

  it("keeps the valid fields and drops the rest", () => {
    const raw = JSON.stringify({
      stats: { best: 7, streak: -1, attempts: 2.5, hits: "3", perfects: 1 },
      settings: { muted: "yes" },
    });
    expect(load(storeHolding(raw))).toEqual({
      stats: { ...freshStats(), best: 7, perfects: 1 },
      settings: { muted: false },
    });
  });

  it("starts fresh when storage can't be read", () => {
    expect(load(broken)).toEqual(defaults);
  });
});

describe("save", () => {
  it("doesn't throw when storage is full or blocked", () => {
    expect(() => save(broken, defaults)).not.toThrow();
  });
});
