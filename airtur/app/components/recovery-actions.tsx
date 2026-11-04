"use client";

import { useState } from "react";
import {
  Coffee,
  ArrowLeftRight,
  CalendarClock,
  MessageSquare,
  Sparkles,
  Loader2,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

type Action = "wait" | "rebook" | "replan" | "assistance";

type FlightContext = {
  airline: string;
  number: string;
  from: string;
  to: string;
  date: string;
  scheduled: string;
  updated: string;
  status: string;
  reason: string;
  dataSource?: string;
  verifiedAt?: string;
  retrievedAt?: string;
  providerStatus?: string;
  delayMinutes?: number | null;
  terminal?: string | null;
  gate?: string | null;
  arrivalScheduled?: string;
  arrivalEstimated?: string;
  verification?: {
    status?: string;
    officialAirlineChecked?: boolean;
    sourceCount?: number;
    conflictDetected?: boolean;
    conflictCheckPerformed?: boolean;
    message?: string;
    recommendation?: string;
    reports?: Array<{
      provider: string;
      status: string;
      retrievedAt?: string | null;
      url?: string | null;
    }>;
  };
};

type RecoveryActionsProps = {
  flight: FlightContext;
  deadline?: string;
  budget?: string;
  priority?: string;
};

type CopilotFacts = {
  dataSource?: string;
  status?: string;
  delayText?: string;
  retrievedAt?: string;
};

const actions = [
  {
    id: "wait" as Action,
    title: "Wait at the airport",
    description: "Make the most of your waiting time",
    Icon: Coffee,
  },
  {
    id: "rebook" as Action,
    title: "Explore rebooking",
    description: "Understand your alternatives",
    Icon: ArrowLeftRight,
  },
  {
    id: "replan" as Action,
    title: "Replan my journey",
    description: "Adjust affected travel arrangements",
    Icon: CalendarClock,
  },
  {
    id: "assistance" as Action,
    title: "Get airline assistance",
    description: "Prepare questions and requests",
    Icon: MessageSquare,
  },
];

export default function RecoveryActions({
  flight,
  deadline,
  budget,
  priority,
}: RecoveryActionsProps) {
  const [action, setAction] = useState<Action>("wait");
  const [details, setDetails] = useState("");
  const [hours, setHours] = useState("6");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [facts, setFacts] = useState<CopilotFacts | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generatePlan() {
    if (loading) return;

    setLoading(true);
    setResult("");
    setFacts(null);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flight,
          action,
          deadline,
          budget,
          priority,
          waitingHours: action === "wait" ? Number(hours) : undefined,
          additionalContext: details.trim(),
        }),
      });

      const raw = await response.text();

      let data: {
        advice?: string;
        error?: string;
        facts?: CopilotFacts;
      } = {};

      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          "The AI service returned an invalid response. Please retry.",
        );
      }

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status}).`);
      }

      if (!data.advice?.trim()) {
        throw new Error("No AI guidance was returned.");
      }

      setResult(data.advice);
      setFacts(data.facts ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copyPlan() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Unable to copy the plan automatically.");
    }
  }

  return (
    <section className="panel recovery-panel">
      <div className="panel-heading">
        <div className="panel-icon">
          <Sparkles size={19} />
        </div>
        <div>
          <h3>What would you like to do next?</h3>
          <p>Choose a path. Airtur will help you plan it.</p>
        </div>
      </div>

      <div className="recovery-options">
        {actions.map(({ id, title, description, Icon }) => (
          <button
            key={id}
            type="button"
            className={`recovery-option ${action === id ? "selected" : ""}`}
            disabled={loading}
            onClick={() => {
              setAction(id);
              setResult("");
              setFacts(null);
              setError("");
            }}
            aria-pressed={action === id}
          >
            <Icon size={20} />
            <span>
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
          </button>
        ))}
      </div>

      {action === "wait" && (
        <>
          <label htmlFor="waiting-hours">Estimated waiting time (hours)</label>
          <input
            id="waiting-hours"
            type="number"
            min="1"
            max="24"
            value={hours}
            disabled={loading}
            onChange={(e) => setHours(e.target.value)}
          />
        </>
      )}

      <label htmlFor="recovery-details">
        Anything else Airtur should know?
      </label>

      <textarea
        id="recovery-details"
        className="recovery-textarea"
        value={details}
        disabled={loading}
        onChange={(e) => setDetails(e.target.value)}
        placeholder={
          action === "wait"
            ? "e.g. I'm at Lagos airport, traveling with a child, and want somewhere quiet to work."
            : "e.g. I have an important meeting tomorrow morning."
        }
        rows={3}
      />

      <button
        type="button"
        className="primary-button"
        disabled={
          loading ||
          (action === "wait" &&
            (!Number.isFinite(Number(hours)) ||
              Number(hours) < 1 ||
              Number(hours) > 24))
        }
        onClick={generatePlan}
        aria-busy={loading}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : error ? (
          <RefreshCw size={18} />
        ) : (
          <Sparkles size={18} />
        )}

        {loading
          ? "Preparing your plan..."
          : error
            ? "Retry action plan"
            : "Create my action plan"}
      </button>

      {loading && (
        <p role="status" className="mt-3 text-sm text-(--muted)">
          Meta AI is preparing your personalized guidance. This may take a
          moment.
        </p>
      )}

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="response-card">
          {facts && (
            <div className="mb-5 rounded-xl border border-(--border) bg-(--surface) p-4 text-xs leading-6">
              <p className="font-bold text-[#36c3c5]">
                Flight information supplied to AI
              </p>

              <p className="mt-1 text-(--muted)">
                {facts.dataSource === "client-supplied-provider-data"
                  ? "Third-party provider record"
                  : "Demo or unverified information"}
                {" · Status: "}
                {facts.status ?? "Unknown"}
                {" · Delay: "}
                {facts.delayText ?? "Unknown"}
              </p>

              <p className="mt-2 font-bold text-(--muted)">
                Everything below is an AI suggestion to verify.
              </p>
            </div>
          )}

          <div className="recovery-result-header">
            <strong>Your Airtur action plan</strong>
            <button type="button" onClick={copyPlan}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="response-text">{result}</div>

          <p className="response-note">
            AI-generated guidance. Verify schedules, airport amenities,
            availability, and airline policies.
          </p>
        </div>
      )}
    </section>
  );
}
