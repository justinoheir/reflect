"use client";

import type { Provider } from "@/lib/types";

interface Option {
  value: Provider;
  label: string;
  tag: string;
  disabled?: boolean;
}

const OPTIONS: Option[] = [
  { value: "groq", label: "Groq", tag: "Fast" },
  { value: "gemini", label: "Gemini", tag: "Balanced" },
  { value: "claude", label: "Claude", tag: "Soon", disabled: true },
];

export default function ModelToggle({
  provider,
  onChange,
}: {
  provider: Provider;
  onChange: (p: Provider) => void;
}) {
  return (
    <div className="model-toggle">
      <span className="model-toggle-label">Reflection engine</span>
      <div className="model-seg" role="group" aria-label="Reflection engine">
        {OPTIONS.map((opt) => {
          const active = opt.value === provider;
          return (
            <button
              key={opt.value}
              type="button"
              className={
                "model-opt" +
                (active ? " active" : "") +
                (opt.disabled ? " disabled" : "")
              }
              disabled={opt.disabled}
              aria-pressed={active}
              title={opt.disabled ? "Coming soon" : undefined}
              onClick={() => !opt.disabled && onChange(opt.value)}
            >
              {opt.label}
              <span className="model-opt-tag">{opt.tag}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
