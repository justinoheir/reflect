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
- **Reflection engine** — switchable in-app between **Groq** (`openai/gpt-oss-120b`, Fast) and **Google Gemini** (`gemini-2.0-flash`, Balanced), both free tier. Claude is stubbed as "coming soon".
- OpenAI Whisper — voice-to-text (optional)
- **Supabase** — magic-link auth + per-user entry storage (Postgres + row-level security)

## Project structure

```
app/
  layout.tsx            Root layout + Google Fonts (Lora, DM Sans)
  page.tsx              Renders the client app
  globals.css           Original styles, verbatim
  api/
    reflect/route.ts    Gemini reflection endpoint (server-side key)
    transcribe/route.ts OpenAI Whisper proxy (server-side key)
components/
  ReflectApp.tsx        State + screen orchestration
  BottomNav.tsx
  icons.tsx
  screens/              Welcome, Grounding, TopicSelect, Journal,
                        Reflection, Saved, History
  api/
    reflect/route.ts    Multi-provider reflection endpoint (Groq/Gemini, server-side keys)
    transcribe/route.ts OpenAI Whisper proxy (server-side key)
components/
  ModelToggle.tsx       Groq/Gemini/Claude engine switcher
lib/
  categories.ts         Display metadata + daily prompts (client-safe)
  grounding.ts          Grounding/closing variants, senses, body scan
  systemPrompts.ts      Reflection system prompts (server-only)
  supabase.ts           Browser Supabase client (auth)
  db.ts                 Entry / saved-reflection queries (RLS-scoped)
  storage.ts            Local UI prefs (selected engine)
  types.ts
supabase/
  schema.sql            Tables + row-level security (run once)
```

## What changed from the prototype

- Reflection generation runs server-side in `/api/reflect`, switchable between
  **Groq** and **Gemini** with automatic fallback. Keys never reach the browser.
- Voice transcription runs in `/api/transcribe` (OpenAI Whisper), degrading
  gracefully (503) if the key is absent.
- **Auth + storage:** entries and saved reflections live in Supabase Postgres,
  scoped per user by row-level security. The app is gated behind a magic-link
  sign-in. (Only the selected engine stays in `localStorage`.)

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase setup (one-time)

1. Create a project at [supabase.com](https://supabase.com), then copy the
   **Project URL** and **publishable (anon) key** into `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase **SQL editor**
   to create the `entries` / `saved_reflections` tables and RLS policies.
3. In **Authentication → URL Configuration**, set the **Site URL** to your app
   origin (e.g. `http://localhost:3000`) and add it to **Redirect URLs**.

### Environment variables

| Variable                        | Required | Purpose                                          |
| ------------------------------- | -------- | ------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase project URL (auth + DB)                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase publishable/anon key (browser-safe)     |
| `GROQ_API_KEY`                  | One of   | Powers the "Groq (Fast)" reflection engine       |
| `GEMINI_API_KEY`                | these    | Powers the "Gemini (Balanced)" reflection engine |
| `OPENAI_API_KEY`                | No       | Powers voice-to-text (degrades gracefully)       |

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm start` — run the production build

> Reflect supports wellbeing between professional appointments — it is not a
> substitute for therapy or crisis care.
