"use client";

import { CATS } from "@/lib/categories";
import type { HistoryEntry, Screen } from "@/lib/types";
import BottomNav from "../BottomNav";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function History({
  entries,
  navigate,
}: {
  entries: HistoryEntry[];
  navigate: (s: Screen) => void;
}) {
  return (
    <div id="history" className="screen active">
      <div className="page-header">
        <div className="ph-left">
          <div className="header-dot" />
          <span className="header-brand">All entries</span>
        </div>
        <span className="header-date">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "1rem" }}>
        {entries.length === 0 ? (
          <div className="empty-state">
            Your entries will appear here after you write your first one.
          </div>
        ) : (
          entries.map((e) => {
            const cat = e.category ? CATS[e.category] : null;
            return (
              <div className="entry-card" key={e.id}>
                <div className="ec-meta">
                  <span className="ec-date">{formatDate(e.date)}</span>
                  {cat && (
                    <span
                      className="ec-badge"
                      style={{ background: cat.bg, color: cat.fg }}
                    >
                      {cat.label}
                    </span>
                  )}
                  {e.mood && <span className="ec-mood">{e.mood}</span>}
                  {e.saved && (
                    <span className="ec-saved">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--gold)">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      saved
                    </span>
                  )}
                </div>
                <div className="ec-text">{e.text}</div>
                {e.reflection && (
                  <div className="ec-reflection">
                    {e.reflection.slice(0, 120)}
                    {e.reflection.length > 120 ? "…" : ""}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <BottomNav active="history" navigate={navigate} />
    </div>
  );
}
