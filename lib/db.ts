import { supabase } from "./supabase";
import type {
  CatKey,
  HistoryEntry,
  JournalEntry,
  SavedReflection,
} from "./types";

// Row shapes as stored in Postgres.
interface EntryRow {
  id: string;
  text: string;
  mood: string | null;
  category: CatKey;
  prompt: string | null;
  reflection: string | null;
  liked: boolean;
  saved: boolean;
  created_at: string;
}

interface SavedRow {
  id: string;
  reflection: string;
  snippet: string;
  category: CatKey;
  mood: string | null;
  entry_date: string;
}

function mapEntry(r: EntryRow): HistoryEntry {
  return {
    id: r.id,
    text: r.text,
    mood: r.mood,
    category: r.category,
    prompt: r.prompt ?? "",
    date: r.created_at,
    reflection: r.reflection,
    liked: r.liked,
    saved: r.saved,
  };
}

function mapSaved(r: SavedRow): SavedReflection {
  return {
    id: r.id,
    reflection: r.reflection,
    snippet: r.snippet,
    category: r.category,
    mood: r.mood,
    date: r.entry_date,
  };
}

export async function fetchEntries(): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as EntryRow[]).map(mapEntry);
}

export async function insertEntry(
  entry: JournalEntry,
  reflection: string,
): Promise<HistoryEntry> {
  // user_id defaults to auth.uid() in the DB; RLS enforces ownership.
  const { data, error } = await supabase
    .from("entries")
    .insert({
      text: entry.text,
      mood: entry.mood,
      category: entry.category,
      prompt: entry.prompt,
      reflection,
    })
    .select()
    .single();
  if (error) throw error;
  return mapEntry(data as EntryRow);
}

export async function updateEntryFlags(
  id: string,
  flags: { liked?: boolean; saved?: boolean },
): Promise<void> {
  const { error } = await supabase.from("entries").update(flags).eq("id", id);
  if (error) throw error;
}

export async function fetchSaved(): Promise<SavedReflection[]> {
  const { data, error } = await supabase
    .from("saved_reflections")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as SavedRow[]).map(mapSaved);
}

export async function insertSaved(
  reflection: string,
  entry: JournalEntry,
): Promise<SavedReflection> {
  const snippet =
    entry.text.length > 100 ? entry.text.slice(0, 100) + "…" : entry.text;
  const { data, error } = await supabase
    .from("saved_reflections")
    .insert({
      reflection,
      snippet,
      category: entry.category,
      mood: entry.mood,
      entry_date: entry.date,
    })
    .select()
    .single();
  if (error) throw error;
  return mapSaved(data as SavedRow);
}

export async function deleteSaved(id: string): Promise<void> {
  const { error } = await supabase
    .from("saved_reflections")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
