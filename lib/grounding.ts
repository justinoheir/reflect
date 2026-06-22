export interface GroundingStep {
  title: string;
  body: string;
}

export interface GroundingVariant {
  step1: GroundingStep;
  step3: GroundingStep;
  step6: GroundingStep & { btn: string };
}

export interface ClosingVariant {
  step1: GroundingStep;
  step6: GroundingStep & { btn: string };
}

// Multiple variations to keep it fresh — rotated per day.
export const GROUNDING_VARIANTS: GroundingVariant[] = [
  {
    step1: {
      title: "Let's help you arrive",
      body: "Before we begin, take a moment to settle in. This short grounding practice will help you feel present, calm, and ready to reflect openly.\n\nFind a comfortable position. You're safe here.",
    },
    step3: {
      title: "Close your eyes for a moment",
      body: "Rest your eyes. Take one more slow breath.\n\nThink about why you've come here today. What's on your mind? You don't need to name it yet — just let it be present.\n\nTake as long as you need.",
    },
    step6: {
      title: "You're present. You're safe.",
      body: "Well done. Take a moment to notice how you feel right now — a little more settled, a little more here.\n\nThis is your space. There's no right way to do this. Just honesty.",
      btn: "Begin my session →",
    },
  },
  {
    step1: {
      title: "A moment just for you",
      body: "Before diving in, let's create a little stillness. This practice takes only a few minutes and helps you arrive fully — mind and body.\n\nSit comfortably. There's no rush.",
    },
    step3: {
      title: "Soften your gaze",
      body: "Let your eyes go heavy or close them gently. Breathe slowly.\n\nWhat brought you here today? Don't try to solve it — just let it surface. Notice it with curiosity, not judgment.\n\nWhen you're ready, come back.",
    },
    step6: {
      title: "You showed up. That matters.",
      body: "The simple act of pausing and turning inward takes real courage. Notice any small shift in how you feel.\n\nFrom this quieter place, you're ready to reflect honestly and openly.",
      btn: "Let's begin →",
    },
  },
  {
    step1: {
      title: "Settling into the present",
      body: "Taking a moment to ground yourself before reflecting helps you connect more honestly with what's really going on inside.\n\nGet comfortable. Let your shoulders drop. You've got time.",
    },
    step3: {
      title: "Turn your attention inward",
      body: "Gently close or lower your eyes. Breathe out slowly.\n\nWithout pressure, let the reason you came here today drift into awareness. Don't analyze it — just acknowledge it.\n\nStay here as long as feels right.",
    },
    step6: {
      title: "Grounded. Present. Ready.",
      body: "Feel the difference between where you were a few minutes ago and now. That shift — however subtle — is real.\n\nTake that sense of calm with you into your reflection.",
      btn: "Start reflecting →",
    },
  },
];

export const CLOSING_VARIANTS: ClosingVariant[] = [
  {
    step1: {
      title: "A gentle close",
      body: "You did something meaningful today by showing up and being honest. Let's take a few minutes to settle back into your body and carry some calm with you.\n\nMake yourself comfortable.",
    },
    step6: {
      title: "You can carry this with you",
      body: "That sense of groundedness doesn't have to stay here. It's available to you whenever you need it — just a few breaths away.\n\nThank you for being honest with yourself today.",
      btn: "Close my session →",
    },
  },
  {
    step1: {
      title: "Coming back to yourself",
      body: "Exploring difficult feelings takes real courage. Let's take a moment to honour that and bring yourself gently back to the present.\n\nBreathe. You're okay.",
    },
    step6: {
      title: "Be gentle with yourself today",
      body: "Whatever came up during your session — notice it without judgment. You don't need to resolve everything at once.\n\nYou showed up. That's enough.",
      btn: "Finish session →",
    },
  },
  {
    step1: {
      title: "Easing back into your day",
      body: "After sitting with your feelings, it helps to gently reorient yourself before stepping back into the world.\n\nThis will only take a few minutes.",
    },
    step6: {
      title: "Well done for today",
      body: "You brought your honest self here and that matters. Carry this stillness with you — and come back whenever you need the space.\n\nTake care of yourself.",
      btn: "Done for today →",
    },
  },
];

export interface SensePrompt {
  count: number;
  sense: string;
  prompt: string;
}

export const SENSE_PROMPTS: SensePrompt[] = [
  {
    count: 5,
    sense: "see",
    prompt:
      "Name <strong>5 things you can see</strong> right now. Look slowly around the space you're in.",
  },
  {
    count: 4,
    sense: "hear",
    prompt:
      "Notice <strong>4 sounds you can hear</strong>. Listen beyond the obvious — what's in the background?",
  },
  {
    count: 3,
    sense: "touch",
    prompt:
      "Find <strong>3 things you can feel</strong> — your chair, your clothes, the temperature of the air.",
  },
  {
    count: 2,
    sense: "smell",
    prompt:
      "Identify <strong>2 things you can smell</strong>. Even faint ones count — the room, your clothes, outside air.",
  },
  {
    count: 1,
    sense: "taste",
    prompt:
      "Notice <strong>1 thing you can taste</strong> right now. Even the absence of taste is an answer.",
  },
];

// Icons for the five senses, in see→taste order.
export const SENSE_ICONS = ["👁️", "👂", "✋", "👃", "👅"];

export interface BodyItem {
  id: string;
  label: string;
}

export const BODY_ITEMS: BodyItem[] = [
  { id: "jaw", label: "Unclench your jaw" },
  { id: "shoulders", label: "Drop your shoulders" },
  { id: "hands", label: "Open your hands" },
  { id: "breath", label: "Take one slow breath" },
];

export function variantIndex(context: "entry" | "closing", d = new Date()): number {
  const day = Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return (day + (context === "closing" ? 1 : 0)) % 3;
}
