import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Proxies audio to OpenAI Whisper for transcription, keeping the OpenAI key
// server-side. (This is the one non-Anthropic dependency, used purely for
// voice-to-text on journal entries.)
export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Voice transcription is not configured." },
      { status: 503 },
    );
  }

  let incoming: FormData;
  try {
    incoming = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = incoming.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No audio file provided." }, { status: 400 });
  }

  const form = new FormData();
  form.append("file", file, file.name || "recording.webm");
  form.append("model", "whisper-1");
  form.append("language", "en");

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Transcription service error." },
        { status: 502 },
      );
    }

    const data = (await res.json()) as { text?: string };
    return NextResponse.json({ text: data.text || "" });
  } catch (err) {
    console.error("Transcription failed:", err);
    return NextResponse.json({ error: "Transcription failed." }, { status: 502 });
  }
}
