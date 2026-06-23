import type { HistoryEntry, Provider, SavedReflection } from "./types";

// localStorage-backed persistence, mirroring the original app's keys so existing
// data carries over. All access is guarded for SSR (window may be undefined).

const ENTRIES_KEY = "reflect_entries";
const SAVED_KEY = "reflect_saved";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or privacy mode — fail silently, same as the original */
  }
}

export function loadEntries(): HistoryEntry[] {
  return read<HistoryEntry[]>(ENTRIES_KEY, []);
}

export function saveEntries(entries: HistoryEntry[]): void {
  write(ENTRIES_KEY, entries);
}

export function loadSaved(): SavedReflection[] {
  return read<SavedReflection[]>(SAVED_KEY, []);
}

export function saveSaved(saved: SavedReflection[]): void {
  write(SAVED_KEY, saved);
}

function todayStorageKey(): string {
  return "reflect_today_" + new Date().toDateString();
}

export function loadTodayAnswered(): string[] {
  return read<string[]>(todayStorageKey(), []);
}

export function saveTodayAnswered(answered: string[]): void {
  write(todayStorageKey(), answered);
}

const PROVIDER_KEY = "reflect_provider";

export function loadProvider(): Provider {
  const p = read<Provider>(PROVIDER_KEY, "groq");
  // Claude isn't live yet — never start on it.
  return p === "groq" || p === "gemini" ? p : "groq";
}

export function saveProvider(provider: Provider): void {
  write(PROVIDER_KEY, provider);
}
