# Reflect — Between Sessions

A private journaling app for processing what's on your mind between therapy
appointments. Five topics, one daily prompt each, with AI-generated reflections,
grounding exercises, and optional voice entry.

This is the Next.js port of the original single-file prototype (preserved at
[`legacy/reflect-app.html`](legacy/reflect-app.html)). The conversion keeps the
UI and behavior identical while moving the two external API calls server-side so
keys are never exposed to the browser.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **@anthropic-ai/sdk** — reflection generation (`claude-opus-4-8`)
- OpenAI Whisper — voice-to-text (optional)
- `localStorage` for entries, saved reflections, and daily progress

## Project structure

```
app/
  layout.tsx            Root layout + Google Fonts (Lora, DM Sans)
  page.tsx              Renders the client app
  globals.css           Original styles, verbatim
  api/
    reflect/route.ts    Anthropic reflection endpoint (server-side key)
    transcribe/route.ts OpenAI Whisper proxy (server-side key)
components/
  ReflectApp.tsx        State + screen orchestration
  BottomNav.tsx
  icons.tsx
  screens/              Welcome, Grounding, TopicSelect, Journal,
                        Reflection, Saved, History
lib/
  categories.ts         Display metadata + daily prompts (client-safe)
  grounding.ts          Grounding/closing variants, senses, body scan
  systemPrompts.ts      Reflection system prompts (server-only)
  storage.ts            localStorage helpers
  types.ts
```

## What changed from the prototype

- The Anthropic call (previously made directly from the browser, with no working
  key) now runs in `/api/reflect` using a server-side `ANTHROPIC_API_KEY`. Model
  updated to `claude-opus-4-8`.
- The OpenAI Whisper call now runs in `/api/transcribe` using a server-side
  `OPENAI_API_KEY`. Voice entry degrades gracefully (503) if the key is absent.
- The imperative DOM/screen state machine became React components with
  `localStorage`-backed state. Storage keys are unchanged, so existing data
  carries over.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable            | Required | Purpose                                   |
| ------------------- | -------- | ----------------------------------------- |
| `ANTHROPIC_API_KEY` | Yes      | Powers reflection generation              |
| `OPENAI_API_KEY`    | No       | Powers voice-to-text (button is disabled-gracefully without it) |

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm start` — run the production build

> Reflect supports wellbeing between professional appointments — it is not a
> substitute for therapy or crisis care.
