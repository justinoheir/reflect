"use client";

import { useEffect, useRef, useState } from "react";
import { CATS } from "@/lib/categories";
import type { JournalEntry, Provider } from "@/lib/types";
import {
  ArrowLeft,
  HeartIcon,
  BookmarkIcon,
  GroundingGlyphSimple,
} from "../icons";

type Status = "loading" | "crisis" | "typing" | "done" | "error";

export default function Reflection({
  entry,
  provider,
  initialReflection,
  onBackTopics,
  onKeepWriting,
  onGroundClose,
  onPersist,
  onToggleLike,
  onToggleSave,
}: {
  entry: JournalEntry;
  provider: Provider;
  initialReflection?: string | null;
  onBackTopics: () => void;
  onKeepWriting: () => void;
  onGroundClose: () => void;
  onPersist: (reflection: string) => void;
  onToggleLike: (liked: boolean) => void;
  onToggleSave: (saved: boolean) => void;
}) {
  const meta = CATS[entry.category];

  // When a reflection is already cached (e.g. returning from the closing
  // grounding exercise), skip the fetch and show it immediately.
  const [status, setStatus] = useState<Status>(
    initialReflection ? "done" : "loading",
  );
  const [reflection, setReflection] = useState(initialReflection || "");
  const [typed, setTyped] = useState(initialReflection || "");
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [heartPop, setHeartPop] = useState(false);
  const [fellBackTo, setFellBackTo] = useState<Provider | null>(null);

  const persistedRef = useRef(Boolean(initialReflection));

  const recap =
    entry.text.length > 240 ? entry.text.slice(0, 240) + "…" : entry.text;

  const ENGINE_LABEL: Record<Provider, string> = {
    groq: "Groq",
    gemini: "Gemini",
    claude: "Claude",
  };

  // Fetch the reflection once for this entry.
  useEffect(() => {
    if (initialReflection) return;
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/reflect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: entry.category,
            mood: entry.mood,
            prompt: entry.prompt,
            text: entry.text,
            provider,
          }),
          signal: controller.signal,
        });
        const data = (await res.json()) as {
          reflection?: string;
          crisis?: boolean;
          error?: string;
          engine?: Provider;
          fellBack?: boolean;
        };
        if (cancelled) return;
        if (data.crisis) {
          setStatus("crisis");
        } else if (data.reflection) {
          if (data.fellBack && data.engine) setFellBackTo(data.engine);
          setReflection(data.reflection);
          setStatus("typing");
        } else {
          setStatus("error");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [entry]);

  // Typing animation, mirroring the original 14ms-per-character reveal.
  useEffect(() => {
    if (status !== "typing" || !reflection) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (i < reflection.length) {
        i++;
        setTyped(reflection.slice(0, i));
        timer = setTimeout(tick, 14);
      } else {
        setStatus("done");
        if (!persistedRef.current) {
          persistedRef.current = true;
          onPersist(reflection);
        }
      }
    };
    tick();
    return () => clearTimeout(timer);
  }, [status, reflection, onPersist]);

  const toggleLike = () => {
    const next = !isLiked;
    setIsLiked(next);
    if (next) {
      setHeartPop(true);
      setTimeout(() => setHeartPop(false), 300);
    }
    onToggleLike(next);
  };

  const toggleSave = () => {
    const next = !isSaved;
    setIsSaved(next);
    onToggleSave(next);
  };

  return (
    <div id="reflection" className="screen active">
      <div className="reflection-header">
        <button className="back-btn" onClick={onBackTopics}>
          <ArrowLeft />
          All topics
        </button>
        <span className="cat-badge" style={{ background: meta.bg, color: meta.fg }}>
          {meta.label}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "1rem" }}>
        <div className="entry-recap">
          <div className="recap-label">Your entry</div>
          <div className="recap-text">{recap}</div>
        </div>

        <div className={"crisis-banner" + (status === "crisis" ? " visible" : "")}>
          <h3>You&apos;re not alone</h3>
          <p>
            What you&apos;ve shared matters. Please reach out to{" "}
            <a href="tel:18334564566">Crisis Services Canada: 1-833-456-4566</a>{" "}
            (24/7), or text 45645. In immediate danger, call 911.
          </p>
        </div>

        {status !== "crisis" && (
          <div className="reflection-card">
            <div className="ref-eyebrow">
              <div className="ref-eyebrow-dot" />
              <span>{meta.modeLabel}</span>
            </div>

            {status === "loading" ? (
              <div className="reflection-text loading">
                Reading your entry
                <span className="typing-dots">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            ) : status === "error" ? (
              <div className="reflection-text">
                Something went quiet on our end. Your entry is safe — try again
                in a moment.
              </div>
            ) : (
              <div className="reflection-text">
                {status === "typing" ? typed : reflection}
              </div>
            )}

            {status === "done" && fellBackTo && (
              <div
                style={{
                  fontSize: ".68rem",
                  color: "var(--muted)",
                  fontStyle: "italic",
                  fontFamily: "'Lora',serif",
                  marginTop: ".6rem",
                }}
              >
                {ENGINE_LABEL[provider]} was unavailable — reflected with{" "}
                {ENGINE_LABEL[fellBackTo]} instead.
              </div>
            )}

            {status === "done" && (
              <>
                <div className="reaction-bar" style={{ display: "flex" }}>
                  <div className="reaction-left">
                    <button
                      className={
                        "react-btn" +
                        (isLiked ? " liked" : "") +
                        (heartPop ? " heart-pop" : "")
                      }
                      onClick={toggleLike}
                    >
                      <HeartIcon
                        fill={isLiked ? "var(--gold)" : "none"}
                        stroke={isLiked ? "var(--gold)" : "currentColor"}
                      />
                      <span>{isLiked ? "Resonated" : "This resonated"}</span>
                    </button>
                    <button
                      className={"react-btn" + (isSaved ? " saved" : "")}
                      onClick={toggleSave}
                    >
                      <BookmarkIcon
                        fill={isSaved ? "var(--teal)" : "none"}
                        stroke={isSaved ? "var(--teal)" : "currentColor"}
                      />
                      <span>{isSaved ? "Saved" : "Save for session"}</span>
                    </button>
                  </div>
                  <span className="react-hint">
                    {isSaved ? "Bring this to your next session" : ""}
                  </span>
                </div>

                {isSaved && (
                  <div className="therapy-tip" style={{ display: "block" }}>
                    <strong>Saved.</strong> Bring this to your next session as a
                    starting point for what&apos;s been coming up for you.
                  </div>
                )}

                <div className="ref-actions" style={{ display: "flex" }}>
                  <button className="action-btn" onClick={onBackTopics}>
                    Back to topics
                  </button>
                  <button className="action-btn primary" onClick={onKeepWriting}>
                    Keep writing
                  </button>
                </div>

                <div className="closing-ground-card" style={{ display: "block" }}>
                  <p>
                    <strong>Well done for showing up today.</strong> Talking about
                    feelings takes courage. Would you like a short grounding
                    exercise to close your session and carry some calm with you?
                  </p>
                  <button className="closing-ground-btn" onClick={onGroundClose}>
                    <GroundingGlyphSimple />
                    Yes, ground me
                  </button>
                </div>
              </>
            )}

            {status === "error" && (
              <div className="ref-actions" style={{ display: "flex" }}>
                <button className="action-btn" onClick={onBackTopics}>
                  Back to topics
                </button>
                <button className="action-btn primary" onClick={onKeepWriting}>
                  Keep writing
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
