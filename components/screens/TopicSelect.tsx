"use client";

import { CAT_KEYS, CATS, DAILY_PROMPTS } from "@/lib/categories";
import type { CatKey, Screen } from "@/lib/types";
import BottomNav from "../BottomNav";
import { CheckIcon, PencilIcon, GroundingGlyph } from "../icons";

export default function TopicSelect({
  promptIdx,
  todayAnswered,
  dateStr,
  onOpenJournal,
  onGround,
  onSignOut,
  navigate,
}: {
  promptIdx: number;
  todayAnswered: string[];
  dateStr: string;
  onOpenJournal: (cat: CatKey) => void;
  onGround: () => void;
  onSignOut: () => void;
  navigate: (s: Screen) => void;
}) {
  const answered = todayAnswered.length;

  return (
    <div id="today" className="screen active">
      <div className="page-header">
        <div className="ph-left">
          <div className="header-dot" />
          <span className="header-brand">Reflect</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="header-date">{dateStr}</span>
          <button className="tiny-btn" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: ".5rem" }}>
        <div className="today-intro">
          <h2>What&apos;s coming up for you today?</h2>
          <p>
            Choose one or more topics below. Each has one prompt — written just
            for today.
          </p>
          <div className="openness-note">
            <strong>This is a safe space.</strong> Be as open and honest as you
            feel comfortable being. Everything you share stays completely private
            to you.
          </div>
          <div className="prog-row">
            {CAT_KEYS.map((k) => (
              <div
                key={k}
                className={"prog-dot" + (todayAnswered.includes(k) ? " done" : "")}
              />
            ))}
            <span className="prog-label">{answered} of 5 answered today</span>
          </div>
        </div>
        <div className="cat-cards">
          {CAT_KEYS.map((key) => {
            const cat = CATS[key];
            const done = todayAnswered.includes(key);
            const prompt = DAILY_PROMPTS[key][promptIdx];
            return (
              <div
                key={key}
                className={"cat-card" + (done ? " answered" : "")}
                onClick={() => onOpenJournal(key)}
              >
                <div className="cat-card-header">
                  <div
                    className="cat-card-icon"
                    style={{ background: cat.bg }}
                  >
                    {cat.icon}
                  </div>
                  <div className="cat-card-info">
                    <span className="cat-card-name" style={{ color: cat.fg }}>
                      {cat.label}
                    </span>
                    <span className="cat-card-sub">{cat.sub}</span>
                  </div>
                  <div
                    className="cat-card-status"
                    style={{ color: done ? "var(--teal)" : "var(--muted)" }}
                  >
                    {done ? (
                      <CheckIcon width={14} height={14} stroke="var(--teal)" />
                    ) : (
                      <>
                        <PencilIcon width={14} height={14} /> Write
                      </>
                    )}
                  </div>
                </div>
                <div className="cat-card-question">{prompt}</div>
              </div>
            );
          })}
        </div>
        <div className="ground-btn-wrap">
          <button className="ground-inline-btn" onClick={onGround}>
            <GroundingGlyph />
            Take a grounding moment before writing
          </button>
        </div>
      </div>
      <BottomNav active="today" navigate={navigate} />
    </div>
  );
}
