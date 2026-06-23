"use client";

import { useEffect, useRef, useState } from "react";
import { CATS, DAILY_PROMPTS, PLACEHOLDERS } from "@/lib/categories";
import type { CatKey, JournalEntry, Provider } from "@/lib/types";
import { ArrowLeft, MicIcon, StopIcon, SendIcon, SpinnerIcon } from "../icons";
import ModelToggle from "../ModelToggle";

const MOODS = ["okay", "good", "anxious", "low", "tired", "restless", "grateful"];

export default function Journal({
  cat,
  promptIdx,
  provider,
  onProviderChange,
  onBack,
  onSubmit,
}: {
  cat: CatKey;
  promptIdx: number;
  provider: Provider;
  onProviderChange: (p: Provider) => void;
  onBack: () => void;
  onSubmit: (entry: JournalEntry) => void;
}) {
  const meta = CATS[cat];
  const prompt = DAILY_PROMPTS[cat][promptIdx];

  const [text, setText] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // ── Voice state ──
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "transcribing">(
    "idle",
  );
  const [voiceStatus, setVoiceStatus] = useState("");
  const [timerLabel, setTimerLabel] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wordLabel = words === 0 ? "0 words" : `${words} word${words === 1 ? "" : "s"}`;

  useEffect(() => {
    // Stop recording / clear timers if the component unmounts mid-record.
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== "inactive") mr.stop();
    };
  }, []);

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const transcribe = async (blob: Blob, mimeType: string): Promise<string> => {
    const ext = mimeType.includes("webm") ? "webm" : "mp4";
    const form = new FormData();
    form.append("file", blob, `recording.${ext}`);
    const res = await fetch("/api/transcribe", { method: "POST", body: form });
    if (!res.ok) throw new Error("Transcription failed");
    const data = (await res.json()) as { text?: string };
    return data.text || "";
  };

  const toggleRecording = async () => {
    if (voiceState === "recording") {
      stopRecording();
      return;
    }
    if (voiceState === "transcribing") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setVoiceState("transcribing");
        setVoiceStatus("");
        const blob = new Blob(chunksRef.current, { type: mimeType });
        try {
          const transcript = await transcribe(blob, mimeType);
          setText((prev) => (prev ? prev + " " + transcript : transcript));
          setVoiceState("idle");
          setVoiceStatus("Transcription complete — edit if needed");
          setTimeout(() => setVoiceStatus(""), 3000);
        } catch {
          setVoiceState("idle");
          setVoiceStatus("Transcription failed — please try again.");
          setTimeout(() => setVoiceStatus(""), 5000);
        }
      };

      recorder.start(250);
      setVoiceState("recording");
      setVoiceStatus("Recording… speak naturally");
      secondsRef.current = 0;
      setTimerLabel("00:00");
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        const m = String(Math.floor(secondsRef.current / 60)).padStart(2, "0");
        const s = String(secondsRef.current % 60).padStart(2, "0");
        setTimerLabel(`${m}:${s}`);
        if (secondsRef.current >= 300) stopRecording();
      }, 1000);
    } catch {
      setVoiceState("idle");
      setVoiceStatus(
        "Microphone access denied — please allow mic access in your browser settings.",
      );
      setTimeout(() => setVoiceStatus(""), 5000);
    }
  };

  const submit = () => {
    const trimmed = text.trim();
    if (trimmed.length < 10) {
      const ta = taRef.current;
      if (ta) {
        ta.style.outline = "2px solid #f0997b";
        setTimeout(() => {
          ta.style.outline = "none";
        }, 1500);
      }
      return;
    }
    onSubmit({
      text: trimmed,
      mood,
      category: cat,
      prompt,
      date: new Date().toISOString(),
    });
  };

  return (
    <div id="journal" className="screen active">
      <div className="journal-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft />
          All topics
        </button>
        <span
          className="cat-badge"
          style={{ background: meta.bg, color: meta.fg }}
        >
          {meta.label}
        </span>
      </div>
      <div className="prompt-section">
        <div className="prompt-label" style={{ color: meta.fg }}>
          {meta.label} · today&apos;s prompt
        </div>
        <div className="prompt-q">{prompt}</div>
      </div>
      <div className="writing-section">
        <div className="mood-row">
          <span className="mood-label">Feeling right now:</span>
          {MOODS.map((m) => (
            <button
              key={m}
              className={"mood-btn" + (mood === m ? " selected" : "")}
              onClick={() => setMood(m)}
            >
              {m}
            </button>
          ))}
        </div>
        <textarea
          ref={taRef}
          className="entry-textarea"
          placeholder={PLACEHOLDERS[cat]}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="voice-bar">
          <button
            className={"voice-btn" + (voiceState === "recording" ? " recording" : "")}
            onClick={toggleRecording}
            aria-label="Record voice entry"
          >
            {voiceState === "recording" ? <StopIcon /> : <MicIcon />}
            <span>
              {voiceState === "recording" ? "Stop recording" : "Speak instead"}
            </span>
          </button>
          <div
            className={"voice-wave" + (voiceState === "recording" ? " active" : "")}
          >
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div
            className={
              "voice-transcribing" +
              (voiceState === "transcribing" ? " active" : "")
            }
          >
            <SpinnerIcon width={13} height={13} />
            Transcribing…
          </div>
          <span className="voice-status">{voiceStatus}</span>
          {voiceState === "recording" && (
            <span className="voice-timer" style={{ display: "block" }}>
              {timerLabel}
            </span>
          )}
        </div>
        <div className="word-count">{wordLabel}</div>
      </div>
      <ModelToggle provider={provider} onChange={onProviderChange} />
      <div className="submit-bar">
        <span className="submit-hint">Private · just for you</span>
        <button className="submit-btn" onClick={submit}>
          <SendIcon />
          Reflect
        </button>
      </div>
    </div>
  );
}
