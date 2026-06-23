"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { promptIndex } from "@/lib/categories";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { loadProvider, saveProvider } from "@/lib/storage";
import {
  fetchEntries,
  fetchSaved,
  insertEntry,
  updateEntryFlags,
  insertSaved,
  deleteSaved,
} from "@/lib/db";
import type {
  CatKey,
  GroundingContext,
  HistoryEntry,
  JournalEntry,
  Provider,
  SavedReflection,
  Screen,
} from "@/lib/types";

import Login from "./screens/Login";
import Welcome from "./screens/Welcome";
import Grounding from "./screens/Grounding";
import TopicSelect from "./screens/TopicSelect";
import Journal from "./screens/Journal";
import Reflection from "./screens/Reflection";
import Saved from "./screens/Saved";
import History from "./screens/History";

export default function ReflectApp() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<Screen>("welcome");

  const [promptIdx, setPromptIdx] = useState(0);
  const [dateStr, setDateStr] = useState("");

  const [currentCat, setCurrentCat] = useState<CatKey>("emotions");
  const [groundingContext, setGroundingContext] =
    useState<GroundingContext>("entry");

  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [currentReflection, setCurrentReflection] = useState<string | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [saved, setSaved] = useState<SavedReflection[]>([]);
  const [provider, setProviderState] = useState<Provider>("groq");

  // Device-local prefs + auth bootstrapping (client only).
  useEffect(() => {
    setProviderState(loadProvider());
    setPromptIdx(promptIndex());
    setDateStr(
      new Date().toLocaleDateString("en-CA", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    );

    if (!supabaseConfigured) {
      setAuthChecked(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthChecked(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setScreen("welcome");
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Load the signed-in user's data; clear it on sign-out.
  const userId = user?.id ?? null;
  useEffect(() => {
    if (!userId) {
      setEntries([]);
      setSaved([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const [e, s] = await Promise.all([fetchEntries(), fetchSaved()]);
        if (active) {
          setEntries(e);
          setSaved(s);
        }
      } catch (err) {
        console.error("Failed to load your data:", err);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  // Topics answered today, derived from entries (no separate store needed).
  const todayAnswered = useMemo(() => {
    const today = new Date().toDateString();
    const set = new Set<string>();
    for (const e of entries) {
      if (new Date(e.date).toDateString() === today) set.add(e.category);
    }
    return [...set];
  }, [entries]);

  const navigate = useCallback((s: Screen) => setScreen(s), []);

  const setProvider = useCallback((p: Provider) => {
    setProviderState(p);
    saveProvider(p);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setScreen("welcome");
  }, []);

  const startGrounding = useCallback((ctx: GroundingContext) => {
    setGroundingContext(ctx);
    setScreen("grounding");
  }, []);

  const openJournal = useCallback((cat: CatKey) => {
    setCurrentCat(cat);
    setScreen("journal");
  }, []);

  const submitEntry = useCallback((entry: JournalEntry) => {
    setCurrentEntry(entry);
    setCurrentReflection(null);
    setCurrentHistoryId(null);
    setScreen("reflection");
  }, []);

  const persistReflection = useCallback(
    async (reflection: string) => {
      if (!currentEntry) return;
      setCurrentReflection(reflection);
      try {
        const row = await insertEntry(currentEntry, reflection);
        setCurrentHistoryId(row.id);
        setEntries((prev) => [row, ...prev]);
      } catch (err) {
        console.error("Failed to save entry:", err);
      }
    },
    [currentEntry],
  );

  const toggleLike = useCallback(
    (liked: boolean) => {
      if (!currentHistoryId) return;
      setEntries((prev) =>
        prev.map((e) => (e.id === currentHistoryId ? { ...e, liked } : e)),
      );
      updateEntryFlags(currentHistoryId, { liked }).catch((err) =>
        console.error("Failed to update like:", err),
      );
    },
    [currentHistoryId],
  );

  const toggleSave = useCallback(
    async (isSaved: boolean) => {
      if (!currentEntry || !currentReflection) return;

      if (isSaved) {
        try {
          const row = await insertSaved(currentReflection, currentEntry);
          setSaved((prev) => [row, ...prev]);
        } catch (err) {
          console.error("Failed to save reflection:", err);
        }
      } else {
        const existing = saved.find((r) => r.reflection === currentReflection);
        if (existing) {
          setSaved((prev) => prev.filter((r) => r.id !== existing.id));
          deleteSaved(existing.id).catch((err) =>
            console.error("Failed to remove saved reflection:", err),
          );
        }
      }

      if (currentHistoryId) {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === currentHistoryId ? { ...e, saved: isSaved } : e,
          ),
        );
        updateEntryFlags(currentHistoryId, { saved: isSaved }).catch((err) =>
          console.error("Failed to update saved flag:", err),
        );
      }
    },
    [currentEntry, currentReflection, currentHistoryId, saved],
  );

  const unsave = useCallback((id: string) => {
    setSaved((prev) => prev.filter((r) => r.id !== id));
    deleteSaved(id).catch((err) =>
      console.error("Failed to remove saved reflection:", err),
    );
  }, []);

  const groundingComplete = useCallback(() => setScreen("today"), []);
  const groundingSkip = useCallback(() => setScreen("today"), []);
  const groundingExit = useCallback(() => {
    setScreen(groundingContext === "closing" ? "reflection" : "welcome");
  }, [groundingContext]);

  // ── Render ──
  if (!authChecked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
          fontFamily: "'Lora',serif",
          fontStyle: "italic",
        }}
      >
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  switch (screen) {
    case "welcome":
      return (
        <Welcome
          onStartGrounding={() => startGrounding("entry")}
          onSkipToTopics={() => navigate("today")}
          onSignOut={signOut}
        />
      );
    case "grounding":
      return (
        <Grounding
          context={groundingContext}
          onComplete={groundingComplete}
          onSkip={groundingSkip}
          onExit={groundingExit}
        />
      );
    case "today":
      return (
        <TopicSelect
          promptIdx={promptIdx}
          todayAnswered={todayAnswered}
          dateStr={dateStr}
          onOpenJournal={openJournal}
          onGround={() => startGrounding("entry")}
          onSignOut={signOut}
          navigate={navigate}
        />
      );
    case "journal":
      return (
        <Journal
          cat={currentCat}
          promptIdx={promptIdx}
          provider={provider}
          onProviderChange={setProvider}
          onBack={() => navigate("today")}
          onSubmit={submitEntry}
        />
      );
    case "reflection":
      if (!currentEntry) {
        return (
          <TopicSelect
            promptIdx={promptIdx}
            todayAnswered={todayAnswered}
            dateStr={dateStr}
            onOpenJournal={openJournal}
            onGround={() => startGrounding("entry")}
            onSignOut={signOut}
            navigate={navigate}
          />
        );
      }
      return (
        <Reflection
          entry={currentEntry}
          provider={provider}
          initialReflection={currentReflection}
          onBackTopics={() => navigate("today")}
          onKeepWriting={() => navigate("journal")}
          onGroundClose={() => startGrounding("closing")}
          onPersist={persistReflection}
          onToggleLike={toggleLike}
          onToggleSave={toggleSave}
        />
      );
    case "saved":
      return <Saved saved={saved} navigate={navigate} onUnsave={unsave} />;
    case "history":
      return <History entries={entries} navigate={navigate} />;
    default:
      return null;
  }
}
