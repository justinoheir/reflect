import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { SYSTEM_PROMPTS, CAT_LABELS } from "@/lib/systemPrompts";
import type { CatKey } from "@/lib/types";

export const runtime = "nodejs";

interface ReflectBody {
  category: CatKey;
  mood?: string | null;
  prompt?: string;
  text: string;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY." },
      { status: 500 },
    );
  }

  let body: ReflectBody;
  try {
    body = (await req.json()) as ReflectBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { category, mood, prompt, text } = body;
  const system = SYSTEM_PROMPTS[category];
  if (!system || typeof text !== "string" || text.trim().length < 10) {
    return NextResponse.json({ error: "Invalid entry." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const userMessage = `Category: ${CAT_LABELS[category]}
Mood: ${mood || "not specified"}
Prompt: "${prompt || ""}"

Journal entry:
${text}`;

  try {
    // Low effort keeps the reflection tight (100–150 words) and free of
    // preamble. `output_config` is accepted by the API but not yet in this SDK
    // version's types, so the params are asserted to the request type.
    const params = {
      model: "claude-opus-4-8",
      max_tokens: 1000,
      output_config: { effort: "low" },
      system,
      messages: [{ role: "user", content: userMessage }],
    } as Anthropic.MessageCreateParamsNonStreaming;

    const response = await client.messages.create(params);

    const raw = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (raw.toUpperCase().startsWith("CRISIS")) {
      return NextResponse.json({ crisis: true });
    }

    return NextResponse.json({ reflection: raw });
  } catch (err) {
    console.error("Reflection generation failed:", err);
    return NextResponse.json(
      { error: "Reflection generation failed." },
      { status: 502 },
    );
  }
}
