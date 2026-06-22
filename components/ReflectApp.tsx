"use client";

import { useCallback, useEffect, useState } from "react";
import { promptIndex } from "@/lib/categories";
import {
  loadEntries,
  saveEntries,
  loadSaved,
  saveSaved,
  loadTodayAnswered,
  saveTodayAnswered,
} from "@/lib/storage";
import type {
  CatKey,
  GroundingContext,
  HistoryEntry,
  JournalEntry,
  SavedReflection,
  Screen,
} from "@/lib/types";

import Welcome from "./screens/Welcome";
import Grounding from "./screens/Grounding";
import TopicSelect from "./screens/TopicSelect";
import Journal from "./screens/Journal";
import Reflection from "./screens/Reflection";
import Saved from "./screens/Saved";
import History from "./screens/History";

export default function ReflectApp() {
  const [mounted, setMounted] = useState(false);
  const [screen, setScreen] = useState<Screen>("welcome");

  const [promptIdx, setPromptIdx] = useState(0);
  const [dateStr, setDateStr] = useState("");

  const [currentCat, setCurrentCat] = useState<CatKey>("emotions");
  const [groundingContext, setGroundingContext] =
    useState<GroundingContext>("entry");

  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [currentReflection, setCurrentReflection] = useState<string | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<number | null>(null);

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [saved, setSaved] = useState<SavedReflection[]>([]);
  const [todayAnswered, setTodayAnswered] = useState<string[]>([]);

  // Load persisted data + date-dependent values on the client only (avoids
  // SSR/CSR hydration mismatches around localStorage and the current date).
  useEffect(() => {
    setEntries(loadEntries());
    setSaved(loadSaved());
    setTodayAnswered(loadTodayAnswered());
    setPromptIdx(promptIndex());
    setDateStr(
      new Date().toLocaleDateString("en-CA", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    );
    setMounted(true);
  }, []);

  const navigate = useCallback((s: Screen) => setScreen(s), []);

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
    (reflection: string) => {
      if (!currentEntry) return;
      setCurrentReflection(reflection);
      const id = Date.now();
      setCurrentHistoryId(id);
      setEntries((prev) => {
        const next: HistoryEntry[] = [
          { ...currentEntry, reflection, liked: false, saved: false, id },
          ...prev,
        ];
        saveEntries(next);
        return next;
      });
      setTodayAnswered((prev) => {
        if (prev.includes(currentEntry.category)) return prev;
        const next = [...prev, currentEntry.category];
        saveTodayAnswered(next);
        return next;
      });
    },
    [currentEntry],
  );

  const toggleLike = useCallback(
    (liked: boolean) => {
      setEntries((prev) => {
        const next = prev.map((e) =>
          e.id === currentHistoryId ? { ...e, liked } : e,
        );
        saveEntries(next);
        return next;
      });
    },
    [currentHistoryId],
  );

  const toggleSave = useCallback(
    (isSaved: boolean) => {
      if (!currentEntry || !currentReflection) return;

      if (isSaved) {
        setSaved((prev) => {
          if (prev.some((r) => r.reflection === currentReflection)) return prev;
          const snippet =
            currentEntry.text.length > 100
              ? currentEntry.text.slice(0, 100) + "…"
              : currentEntry.text;
          const next: SavedReflection[] = [
            {
              id: Date.now(),
              reflection: currentReflection,
              snippet,
              category: currentEntry.category,
              mood: currentEntry.mood,
              date: currentEntry.date,
            },
            ...prev,
          ];
          saveSaved(next);
          return next;
        });
      } else {
        setSaved((prev) => {
          const next = prev.filter((r) => r.reflection !== currentReflection);
          saveSaved(next);
          return next;
        });
      }

      setEntries((prev) => {
        const next = prev.map((e) =>
          e.id === currentHistoryId ? { ...e, saved: isSaved } : e,
        );
        saveEntries(next);
        return next;
      });
    },
    [currentEntry, currentReflection, currentHistoryId],
  );

  const unsave = useCallback((id: number) => {
    setSaved((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveSaved(next);
      return next;
    });
  }, []);

  // Grounding exit routing, mirroring the original back/skip/complete behavior.
  const groundingComplete = useCallback(() => setScreen("today"), []);
  const groundingSkip = useCallback(() => setScreen("today"), []);
  const groundingExit = useCallback(() => {
    setScreen(groundingContext === "closing" ? "reflection" : "welcome");
  }, [groundingContext]);

  // Avoid a hydration flash: render the static welcome shell until mounted.
  if (!mounted) {
    return (
      <Welcome
        onStartGrounding={() => {}}
        onSkipToTopics={() => {}}
      />
    );
  }

  switch (screen) {
    case "welcome":
      return (
        <Welcome
          onStartGrounding={() => startGrounding("entry")}
          onSkipToTopics={() => navigate("today")}
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
          navigate={navigate}
        />
      );
    case "journal":
      return (
        <Journal
          cat={currentCat}
          promptIdx={promptIdx}
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
            navigate={navigate}
          />
        );
      }
      return (
        <Reflection
          entry={currentEntry}
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
