"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GROUNDING_VARIANTS,
  CLOSING_VARIANTS,
  SENSE_PROMPTS,
  SENSE_ICONS,
  BODY_ITEMS,
  variantIndex,
  type GroundingStep,
} from "@/lib/grounding";
import type { GroundingContext } from "@/lib/types";
import { ArrowLeft, ArrowRight, BodyGlyph } from "../icons";

const TOTAL_STEPS = 6;

function renderBody(text: string) {
  // Variant bodies use \n / \n\n for line breaks (originally injected via innerHTML).
  return text.split("\n").map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

interface ResolvedText {
  step1: GroundingStep;
  step3: GroundingStep;
  step6: GroundingStep & { btn: string };
}

function resolveText(context: GroundingContext): ResolvedText {
  const varIdx = variantIndex(context);
  if (context === "closing") {
    const c = CLOSING_VARIANTS[varIdx];
    return {
      step1: c.step1,
      // Closing reuses its intro copy for the eyes-closed step (matches original).
      step3: { title: c.step1.title, body: c.step1.body },
      step6: c.step6,
    };
  }
  const g = GROUNDING_VARIANTS[varIdx];
  return { step1: g.step1, step3: g.step3, step6: g.step6 };
}

export default function Grounding({
  context,
  onComplete,
  onSkip,
  onExit,
}: {
  context: GroundingContext;
  onComplete: () => void;
  onSkip: () => void;
  onExit: () => void; // back pressed on step 1
}) {
  const [step, setStep] = useState(1);
  const text = resolveText(context);

  // ── Breathing state ──
  const [breathCount, setBreathCount] = useState(0);
  const [breathInstruction, setBreathInstruction] = useState("Inhale");
  const [breathStatus, setBreathStatus] = useState(
    "Breathe with the circle — let it guide you.",
  );
  const [breathPhase, setBreathPhase] = useState<"expand" | "contract" | "">("");
  const breathTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Senses state ──
  const [senseIdx, setSenseIdx] = useState(0);

  // ── Body scan state ──
  const [bodyActiveIdx, setBodyActiveIdx] = useState(-1);

  const clearBreath = useCallback(() => {
    if (breathTimer.current) {
      clearTimeout(breathTimer.current);
      breathTimer.current = null;
    }
  }, []);

  // Breathing loop, driven while on step 2.
  useEffect(() => {
    if (step !== 2) return;
    let count = 0;
    setBreathCount(0);
    setBreathInstruction("Inhale");
    setBreathStatus("Breathe with the circle — let it guide you.");

    const runBreath = () => {
      if (count >= 5) {
        setBreathStatus("Beautiful. Five breaths complete.");
        setBreathInstruction("✓");
        breathTimer.current = setTimeout(() => setStep(3), 1800);
        return;
      }
      setBreathInstruction("Inhale");
      setBreathPhase("expand");
      setBreathStatus("Breathe in slowly through your nose…");
      breathTimer.current = setTimeout(() => {
        setBreathInstruction("Hold");
        setBreathStatus("Hold gently…");
        breathTimer.current = setTimeout(() => {
          setBreathInstruction("Exhale");
          setBreathPhase("contract");
          setBreathStatus("Breathe out slowly through your mouth…");
          count++;
          setBreathCount(count);
          breathTimer.current = setTimeout(runBreath, 4500);
        }, 1800);
      }, 4000);
    };
    runBreath();

    return clearBreath;
  }, [step, clearBreath]);

  // Reset sense/body steps when entered.
  useEffect(() => {
    if (step === 4) setSenseIdx(0);
    if (step === 5) setBodyActiveIdx(-1);
  }, [step]);

  // Clean up any pending breath timer on unmount.
  useEffect(() => clearBreath, [clearBreath]);

  const handleBack = () => {
    if (step > 1) {
      clearBreath();
      setStep(step - 1);
    } else {
      onExit();
    }
  };

  const handleSkip = () => {
    clearBreath();
    onSkip();
  };

  const handleComplete = () => {
    clearBreath();
    onComplete();
  };

  const nextSense = () => {
    if (senseIdx < 4) setSenseIdx(senseIdx + 1);
    else setStep(5);
  };

  const nextBodyItem = () => {
    const next = bodyActiveIdx + 1;
    if (next < BODY_ITEMS.length) setBodyActiveIdx(next);
    else setStep(6);
  };

  const sense = SENSE_PROMPTS[senseIdx];
  const bodyBtnLabel =
    bodyActiveIdx < 0
      ? "Start →"
      : bodyActiveIdx < BODY_ITEMS.length - 1
        ? "Next →"
        : "Done →";

  return (
    <div id="grounding" className="screen active">
      <div className="grounding-bg" />
      <div className="grounding-inner">
        <div className="grounding-header">
          <button className="grounding-back" onClick={handleBack}>
            <ArrowLeft />
            Back
          </button>
          <button className="grounding-skip" onClick={handleSkip}>
            Skip grounding →
          </button>
        </div>

        <div className="gstep-progress">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const n = i + 1;
            const cls =
              "gprog-dot" +
              (n < step ? " done" : n === step ? " current" : "");
            return <div key={n} className={cls} />;
          })}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="gstep active">
            <div className="gstep-eyebrow">Grounding exercise</div>
            <div className="gstep-title">{text.step1.title}</div>
            <div className="gstep-body">{renderBody(text.step1.body)}</div>
            <button
              className="btn-primary"
              style={{ maxWidth: 200 }}
              onClick={() => setStep(2)}
            >
              I&apos;m ready
              <ArrowRight />
            </button>
          </div>
        )}

        {/* STEP 2 — breathing */}
        {step === 2 && (
          <div className="gstep active">
            <div className="gstep-eyebrow">
              Deep breathing · {breathCount} of 5
            </div>
            <div className="gstep-title">Follow the circle</div>
            <div className="breath-circle-wrap">
              <div className={"breath-circle " + breathPhase}>
                <div className="breath-inner">
                  <span className="breath-instruction">{breathInstruction}</span>
                </div>
              </div>
            </div>
            <div className="breath-count">{breathStatus}</div>
          </div>
        )}

        {/* STEP 3 — eyes closed */}
        {step === 3 && (
          <div className="gstep active">
            <div className="gstep-eyebrow">Settle in</div>
            <div className="gstep-title">{text.step3.title}</div>
            <div className="gstep-body">{renderBody(text.step3.body)}</div>
            <button
              className="btn-primary"
              style={{ maxWidth: 240, marginTop: ".5rem" }}
              onClick={() => setStep(4)}
            >
              I&apos;m back
              <ArrowRight />
            </button>
          </div>
        )}

        {/* STEP 4 — 5 senses */}
        {step === 4 && (
          <div className="gstep active">
            <div className="gstep-eyebrow">5 senses grounding</div>
            <div className="gstep-title">Notice what&apos;s around you</div>
            <div className="senses-grid">
              {(["See", "Hear", "Touch", "Smell", "Taste"] as const).map(
                (label, i) => (
                  <div className="sense-item" key={label}>
                    <div
                      className={
                        "sense-icon" + (i === senseIdx ? " highlighted" : "")
                      }
                    >
                      {SENSE_ICONS[i]}
                    </div>
                    <div className="sense-label">{label}</div>
                  </div>
                ),
              )}
            </div>
            <div className="sense-count-display">{sense.count}</div>
            <div
              className="sense-prompt"
              dangerouslySetInnerHTML={{ __html: sense.prompt }}
            />
            <button
              className="btn-primary"
              style={{ maxWidth: 200, marginTop: "1.25rem" }}
              onClick={nextSense}
            >
              {senseIdx < 4 ? "Next sense →" : "Done →"}
            </button>
          </div>
        )}

        {/* STEP 5 — body scan */}
        {step === 5 && (
          <div className="gstep active">
            <div className="gstep-eyebrow">Body awareness</div>
            <div className="gstep-title">Relax and be present</div>
            <div className="gstep-body">
              Gently bring your attention to each part of your body below. Notice
              any tension — and let it go.
            </div>
            <div className="body-items">
              {BODY_ITEMS.map((item, i) => (
                <div
                  key={item.id}
                  className={"body-item" + (i === bodyActiveIdx ? " active" : "")}
                >
                  <BodyGlyph id={item.id} />
                  {item.label}
                </div>
              ))}
            </div>
            <button
              className="btn-primary"
              style={{ maxWidth: 240, marginTop: "1.1rem" }}
              onClick={nextBodyItem}
            >
              {bodyBtnLabel}
            </button>
          </div>
        )}

        {/* STEP 6 — ready */}
        {step === 6 && (
          <div className="gstep active">
            <div className="gstep-eyebrow">
              {context === "closing" ? "Take care" : "You're grounded"}
            </div>
            <div className="gstep-title">{text.step6.title}</div>
            <div className="gstep-body">{renderBody(text.step6.body)}</div>
            <button
              className="btn-primary"
              style={{ maxWidth: 240 }}
              onClick={handleComplete}
            >
              {text.step6.btn}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
