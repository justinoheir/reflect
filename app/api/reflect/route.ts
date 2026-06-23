import { NextResponse } from "next/server";
import { SYSTEM_PROMPTS, CAT_LABELS } from "@/lib/systemPrompts";
import type { CatKey, Provider } from "@/lib/types";

export const runtime = "nodejs";

interface ReflectBody {
  category: CatKey;
  mood?: string | null;
  prompt?: string;
  text: string;
  provider?: Provider;
}

const GEMINI_MODEL = "gemini-2.0-flash";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// Result of a provider call: either generated text, or a signal that the entry
// was blocked by safety filters (→ surface the crisis pathway).
type ProviderResult = { text: string } | { blocked: true };

class ProviderError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

// ── Gemini (Balanced, free tier) ──
async function callGemini(system: string, user: string): Promise<ProviderResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ProviderError("Server is missing GEMINI_API_KEY.", 500);
  }

  // Relax filters so heavy-but-legitimate emotional content isn't refused — we
  // want the model itself to apply the CRISIS protocol.
  const safetySettings = [
    "HARM_CATEGORY_HARASSMENT",
    "HARM_CATEGORY_HATE_SPEECH",
    "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    "HARM_CATEGORY_DANGEROUS_CONTENT",
  ].map((category) => ({ category, threshold: "BLOCK_ONLY_HIGH" }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: 1000, temperature: 0.9 },
      safetySettings,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Gemini error:", res.status, detail);
    throw new ProviderError("Reflection generation failed.");
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    promptFeedback?: { blockReason?: string };
  };

  const raw = (
    data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || ""
  ).trim();

  if (!raw || data.promptFeedback?.blockReason) return { blocked: true };
  return { text: raw };
}

// ── Groq (Fast, free tier — OpenAI-compatible API) ──
async function callGroq(system: string, user: string): Promise<ProviderResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new ProviderError("Server is missing GROQ_API_KEY.", 500);
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 1000,
      temperature: 0.9,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Groq error:", res.status, detail);
    throw new ProviderError("Reflection generation failed.");
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = (data.choices?.[0]?.message?.content || "").trim();
  if (!raw) throw new ProviderError("Reflection generation failed.");
  return { text: raw };
}

export async function POST(req: Request) {
  let body: ReflectBody;
  try {
    body = (await req.json()) as ReflectBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { category, mood, prompt, text } = body;
  const provider: Provider = body.provider || "gemini";
  const system = SYSTEM_PROMPTS[category];
  if (!system || typeof text !== "string" || text.trim().length < 10) {
    return NextResponse.json({ error: "Invalid entry." }, { status: 400 });
  }

  if (provider === "claude") {
    return NextResponse.json(
      { error: "Claude support is coming soon." },
      { status: 501 },
    );
  }

  const userMessage = `Category: ${CAT_LABELS[category]}
Mood: ${mood || "not specified"}
Prompt: "${prompt || ""}"

Journal entry:
${text}`;

  const call = (p: "groq" | "gemini") =>
    p === "groq"
      ? callGroq(system, userMessage)
      : callGemini(system, userMessage);

  // Try the chosen engine first, then transparently fall back to the other one
  // if it errors (quota/429, server error, missing key). A *blocked* result is
  // not an error — it returns the crisis pathway and never falls back.
  const order: ("groq" | "gemini")[] =
    provider === "groq" ? ["groq", "gemini"] : ["gemini", "groq"];

  let lastError: unknown = null;
  for (const p of order) {
    try {
      const result = await call(p);
      if ("blocked" in result) return NextResponse.json({ crisis: true });
      if (result.text.toUpperCase().startsWith("CRISIS")) {
        return NextResponse.json({ crisis: true });
      }
      return NextResponse.json({
        reflection: result.text,
        engine: p,
        fellBack: p !== provider,
      });
    } catch (err) {
      lastError = err;
      if (p !== order[order.length - 1]) {
        console.warn(`Provider "${p}" failed, falling back…`, err);
      }
    }
  }

  if (lastError instanceof ProviderError) {
    return NextResponse.json(
      { error: lastError.message },
      { status: lastError.status },
    );
  }
  console.error("Reflection generation failed:", lastError);
  return NextResponse.json(
    { error: "Reflection generation failed." },
    { status: 502 },
  );
}
