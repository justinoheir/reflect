export type CatKey = "emotions" | "relationships" | "self" | "stress" | "growth";

export type Provider = "groq" | "gemini" | "claude";

export type Screen =
  | "welcome"
  | "grounding"
  | "today"
  | "journal"
  | "reflection"
  | "saved"
  | "history";

export type GroundingContext = "entry" | "closing";

export interface Category {
  key: CatKey;
  label: string;
  icon: string;
  sub: string;
  bg: string;
  fg: string;
  modeLabel: string;
  system: string;
}

export interface JournalEntry {
  text: string;
  mood: string | null;
  category: CatKey;
  prompt: string;
  date: string;
}

export interface HistoryEntry extends JournalEntry {
  id: string;
  reflection: string | null;
  liked: boolean;
  saved: boolean;
}

export interface SavedReflection {
  id: string;
  reflection: string;
  snippet: string;
  category: CatKey;
  mood: string | null;
  date: string;
}
