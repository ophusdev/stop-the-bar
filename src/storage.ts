import { freshStats, type Stats } from "./stats";

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export interface Settings {
  muted: boolean;
  theme: Theme;
}

export interface SaveData {
  stats: Stats;
  settings: Settings;
}

export type Store = Pick<Storage, "getItem" | "setItem">;

// public/theme.js reads this key too, before the page is first painted
const KEY = "stop-the-bar/v1";

// Reading window.localStorage throws when the browser blocks site data.
// The game still works then, it just forgets everything on reload.
export function openStore(): Store {
  try {
    return window.localStorage;
  } catch {
    return { getItem: () => null, setItem: () => {} };
  }
}

export function load(store: Store): SaveData {
  let raw: unknown = null;
  try {
    raw = JSON.parse(store.getItem(KEY) ?? "null");
  } catch {
    // unreadable or corrupted: start fresh
  }
  const saved = isRecord(raw) ? raw : {};
  return { stats: readStats(saved.stats), settings: readSettings(saved.settings) };
}

export function save(store: Store, data: SaveData): void {
  try {
    store.setItem(KEY, JSON.stringify(data));
  } catch {
    // full or blocked storage: keep playing without saving
  }
}

function readStats(raw: unknown): Stats {
  const stats = freshStats();
  if (!isRecord(raw)) return stats;
  for (const key of Object.keys(stats) as (keyof Stats)[]) {
    const value = raw[key];
    if (isCount(value)) stats[key] = value;
  }
  return stats;
}

function readSettings(raw: unknown): Settings {
  const settings: Settings = { muted: false, theme: "system" };
  if (!isRecord(raw)) return settings;
  if (typeof raw.muted === "boolean") settings.muted = raw.muted;
  settings.theme = THEMES.find((theme) => theme === raw.theme) ?? settings.theme;
  return settings;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isCount = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;
