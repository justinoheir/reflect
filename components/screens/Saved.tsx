"use client";

import { useState } from "react";
import { CATS } from "@/lib/categories";
import type { SavedReflection, Screen } from "@/lib/types";
import BottomNav from "../BottomNav";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Saved({
  saved,
  navigate,
  onUnsave,
}: {
  saved: SavedReflection[];
  navigate: (s: Screen) => void;
  onUnsave: (id: number) => void;
}) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copy = async (r: SavedReflection) => {
    const cat = r.category ? CATS[r.category] : null;
    const text = `Reflect — ${cat ? cat.label + " · " : ""}${new Date(
      r.date,
    ).toLocaleDateString("en-CA", {
      month: "long",
      day: "numeric",
    })}\n\nMy entry:\n"${r.snippet}"\n\nReflection:\n${r.reflection}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(r.id);
      setTimeout(() => setCopiedId((c) => (c === r.id ? null : c)), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div id="saved" className="screen active">
      <div className="page-header">
        <div className="ph-left">
          <div className="header-dot" />
          <span className="header-brand">Saved reflections</span>
        </div>
        <span className="header-date">{saved.length} saved</span>
      </div>
      <p
        style={{
          fontSize: ".77rem",
          color: "var(--muted)",
          lineHeight: 1.65,
          fontFamily: "'Lora',serif",
          fontStyle: "italic",
          padding: ".7rem 0 .4rem",
          flexShrink: 0,
        }}
      >
        Reflections you&apos;ve saved — bring these to your next session, or
        revisit whenever you need them.
      </p>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "1rem" }}>
        {saved.length === 0 ? (
          <div className="empty-state">
            Reflections you save will appear here — perfect for bringing to your
            next therapy session.
          </div>
        ) : (
          saved.map((r) => {
            const cat = r.category ? CATS[r.category] : null;
            return (
              <div className="saved-card" key={r.id}>
                <div className="saved-card-meta">
                  <span className="saved-card-date">{formatDate(r.date)}</span>
                  {cat && (
                    <span
                      className="saved-card-badge"
                      style={{ background: cat.bg, color: cat.fg }}
                    >
                      {cat.label}
                    </span>
                  )}
                </div>
                <div className="saved-card-snippet">&quot;{r.snippet}&quot;</div>
                <div className="saved-card-text">{r.reflection}</div>
                <div className="saved-card-footer">
                  <button
                    className="tiny-btn danger"
                    onClick={() => onUnsave(r.id)}
                  >
                    Remove
                  </button>
                  <button className="tiny-btn" onClick={() => copy(r)}>
                    {copiedId === r.id ? "Copied!" : "Copy to clipboard"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <BottomNav active="saved" navigate={navigate} />
    </div>
  );
}
