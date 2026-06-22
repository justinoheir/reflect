import type { CatKey, Category } from "./types";

// Client-safe category display metadata (no system prompts — those live server-side
// in lib/systemPrompts.ts so they're never shipped to the browser).
export type CategoryMeta = Omit<Category, "system">;

export const CAT_KEYS: CatKey[] = [
  "emotions",
  "relationships",
  "self",
  "stress",
  "growth",
];

export const CATS: Record<CatKey, CategoryMeta> = {
  emotions: {
    key: "emotions",
    label: "Emotions",
    icon: "🌊",
    sub: "Feelings that are hard to manage or understand",
    bg: "var(--c-emotions-bg)",
    fg: "var(--c-emotions-fg)",
    modeLabel: "Emotional reflection",
  },
  relationships: {
    key: "relationships",
    label: "Relationships",
    icon: "🤝",
    sub: "Difficulties with other people or social connection",
    bg: "var(--c-relationships-bg)",
    fg: "var(--c-relationships-fg)",
    modeLabel: "Relationship reflection",
  },
  self: {
    key: "self",
    label: "Self",
    icon: "🪞",
    sub: "Self-worth, confidence, and personal identity",
    bg: "var(--c-self-bg)",
    fg: "var(--c-self-fg)",
    modeLabel: "Self reflection",
  },
  stress: {
    key: "stress",
    label: "Stress",
    icon: "⚡",
    sub: "Pressure from responsibilities and life situations",
    bg: "var(--c-stress-bg)",
    fg: "var(--c-stress-fg)",
    modeLabel: "Stress reflection",
  },
  growth: {
    key: "growth",
    label: "Growth",
    icon: "🌱",
    sub: "Healing, habits, and becoming who you want to be",
    bg: "var(--c-growth-bg)",
    fg: "var(--c-growth-fg)",
    modeLabel: "Growth reflection",
  },
};

export const PLACEHOLDERS: Record<CatKey, string> = {
  emotions: "Write about what you're feeling — no filter needed…",
  relationships: "Tell me what's happening with this person or situation…",
  self: "What's been going on with how you see yourself lately…",
  stress: "What's been pressing on you — lay it all out…",
  growth: "What are you working on or working through right now…",
};

export const DAILY_PROMPTS: Record<CatKey, string[]> = {
  emotions: [
    "What emotion has been sitting with you most today — and where do you feel it in your body?",
    "What have you been trying not to feel lately?",
    "If your anxiety or sadness could speak, what would it say?",
    "When did you last feel genuinely at ease?",
    "What feeling are you most tired of carrying?",
  ],
  relationships: [
    "Is there something unspoken sitting between you and someone important to you?",
    "What relationship is taking more energy than it's giving right now?",
    "When did you last feel truly understood by someone?",
    "What's something you wish you could say to someone but haven't?",
    "Is there a pattern in your relationships you keep noticing?",
  ],
  self: [
    "What's the harshest thing you've said to yourself this week?",
    "Where do you feel most like yourself — and least?",
    "What belief about yourself are you not sure is actually true?",
    "If you had to describe who you're becoming right now, what would you say?",
    "What are you afraid people would discover if they really knew you?",
  ],
  stress: [
    "What's weighing on you most right now — and what would 'enough' actually look like?",
    "Where is most of your energy going? Is that where you want it to go?",
    "What are you putting off that's quietly adding to your stress?",
    "What part of your life feels most out of balance?",
    "What would you let go of today if you gave yourself permission?",
  ],
  growth: [
    "What's one small thing you did recently that felt like the person you want to become?",
    "What habit are you most aware of wanting to change — and what gets in the way?",
    "What does your version of 'doing well' actually look like right now?",
    "Where are you being too hard on yourself about your progress?",
    "What could you do tomorrow that your future self would thank you for?",
  ],
};

// Day-of-year rotation, identical math to the original app. Computed on the client
// only (called from effects) to avoid SSR/CSR hydration mismatches.
export function dayOfYear(d = new Date()): number {
  return Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000,
  );
}

export function promptIndex(d = new Date()): number {
  return dayOfYear(d) % 5;
}
