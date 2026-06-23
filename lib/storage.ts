import type { Provider } from "./types";

// Local UI preferences only. Entries and saved reflections now live in Supabase
// (see lib/db.ts); the only thing kept in localStorage is the chosen reflection
// engine, which is a per-device preference rather than user data.

const PROVIDER_KEY = "reflect_provider";

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
    /* quota or privacy mode — ignore */
  }
}

export function loadProvider(): Provider {
  const p = read<Provider>(PROVIDER_KEY, "groq");
  // Claude isn't live yet — never start on it.
  return p === "groq" || p === "gemini" ? p : "groq";
}

export function saveProvider(provider: Provider): void {
  write(PROVIDER_KEY, provider);
}
