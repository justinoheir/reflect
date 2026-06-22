"use client";

import type { Screen } from "@/lib/types";
import { ClockIcon, BookmarkIcon, FileIcon } from "./icons";

export default function BottomNav({
  active,
  navigate,
}: {
  active: "today" | "saved" | "history";
  navigate: (s: Screen) => void;
}) {
  return (
    <nav className="bottom-nav">
      <button
        className={"nav-item" + (active === "today" ? " active" : "")}
        onClick={() => navigate("today")}
      >
        <ClockIcon />
        Today
      </button>
      <button
        className={"nav-item" + (active === "saved" ? " active" : "")}
        onClick={() => navigate("saved")}
      >
        <BookmarkIcon />
        Saved
      </button>
      <button
        className={"nav-item" + (active === "history" ? " active" : "")}
        onClick={() => navigate("history")}
      >
        <FileIcon />
        Entries
      </button>
    </nav>
  );
}
