"use client";

import { HeartIcon, FaceSmile, ArrowRight } from "../icons";

export default function Welcome({
  onStartGrounding,
  onSkipToTopics,
  onSignOut,
}: {
  onStartGrounding: () => void;
  onSkipToTopics: () => void;
  onSignOut?: () => void;
}) {
  return (
    <div id="welcome" className="screen active">
      <div className="welcome-inner">
        <div className="logo-mark">
          <HeartIcon stroke="white" />
        </div>
        <h1>Reflect</h1>
        <div className="welcome-tagline">Between sessions</div>
        <div className="mission-block">
          <p>
            <strong>Reflect is your private, safe space</strong> to process
            what&apos;s on your mind between therapy appointments.
          </p>
          <p>
            Here you can <strong>vent freely, find support, gain perspective,</strong>{" "}
            and receive honest, thoughtful reflections — all in complete privacy.
            Nothing you share leaves this space without your permission.
          </p>
          <p>
            Five topics. One prompt each. Write at your own pace, in your own
            words.
          </p>
        </div>
        <div className="welcome-actions">
          <button className="btn-primary" onClick={onStartGrounding}>
            <FaceSmile />
            Start with grounding
          </button>
          <button className="btn-secondary" onClick={onSkipToTopics}>
            <ArrowRight />
            Go straight to topics
          </button>
        </div>
        <div className="disclaimer">
          Reflect supports your wellbeing between professional appointments — it
          is not a substitute for therapy or crisis care.
          <br />
          In crisis?{" "}
          <a href="tel:18334564566">Crisis Services Canada: 1-833-456-4566</a>
        </div>
        {onSignOut && (
          <button
            className="tiny-btn"
            style={{ marginTop: "1rem" }}
            onClick={onSignOut}
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
