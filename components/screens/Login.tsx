"use client";

import { useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { HeartIcon, SendIcon } from "../icons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    if (!supabaseConfigured) {
      setStatus("error");
      setMessage(
        "Sign-in isn't configured yet — add your Supabase keys to .env.local.",
      );
      return;
    }

    setStatus("sending");
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  };

  return (
    <div id="welcome" className="screen active">
      <div className="welcome-inner">
        <div className="logo-mark">
          <HeartIcon stroke="white" />
        </div>
        <h1>Reflect</h1>
        <div className="welcome-tagline">Between sessions</div>

        {status === "sent" ? (
          <div className="mission-block" style={{ textAlign: "center" }}>
            <p>
              <strong>Check your inbox.</strong>
            </p>
            <p>
              We sent a magic sign-in link to <strong>{email}</strong>. Open it on
              this device to continue — it expires shortly.
            </p>
            <button
              className="btn-secondary"
              style={{ margin: "1rem auto 0" }}
              onClick={() => {
                setStatus("idle");
                setMessage("");
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <div className="mission-block">
              <p>
                <strong>Sign in to your private space.</strong> Your entries and
                saved reflections sync securely to your account — nothing is
                shared with anyone.
              </p>
              <p>
                Enter your email and we&apos;ll send a one-tap sign-in link. No
                password to remember.
              </p>
            </div>
            <form className="login-form" onSubmit={submit}>
              <input
                type="email"
                className="login-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={status === "sending"}
              >
                <SendIcon />
                {status === "sending" ? "Sending…" : "Send magic link"}
              </button>
            </form>
            {status === "error" && (
              <div
                className="disclaimer"
                style={{ color: "#993C1D", borderColor: "#f5c4b3" }}
              >
                {message}
              </div>
            )}
          </>
        )}

        <div className="disclaimer">
          Reflect supports your wellbeing between professional appointments — it
          is not a substitute for therapy or crisis care.
          <br />
          In crisis?{" "}
          <a href="tel:18334564566">Crisis Services Canada: 1-833-456-4566</a>
        </div>
      </div>
    </div>
  );
}
