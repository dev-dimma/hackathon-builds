"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Plane,
  Search,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Clock3,
  Database,
  Info,
} from "lucide-react";

export type FlightStatus =
  | "Scheduled"
  | "On time"
  | "Delayed"
  | "Rescheduled"
  | "Cancelled"
  | "Departed"
  | "Landed"
  | "Unknown"
  | "Disputed";

export type FlightSourceReport = {
  provider: string;
  sourceType: "third_party" | "official_airline";
  flightNumber: string;
  departureDate: string;
  origin: string | null;
  destination: string | null;
  status: FlightStatus;
  rawStatus: string;
  scheduledDeparture: string | null;
  updatedDeparture: string | null;
  delayMinutes: number | null;
  retrievedAt: string;
  providerUpdatedAt: string | null;
  official: boolean;
  url: string | null;
};

export type FlightVerification = {
  status: string;
  officialAirlineChecked: boolean;
  sourceCount: number;
  conflictDetected: boolean;
  conflictCheckPerformed?: boolean;
  message: string;
  recommendation?: string;
  reports: FlightSourceReport[];
};

export type LiveFlight = {
  airline: string;
  number: string;
  from: string;
  to: string;
  date: string;
  scheduled: string;
  updated: string;
  status: FlightStatus;
  reason: string;
  dataSource: "aviationstack";
  verifiedAt?: string;
  retrievedAt?: string;
  providerStatus: string;
  delayMinutes?: number | null;
  terminal?: string | null;
  gate?: string | null;
  arrivalScheduled?: string;
  arrivalEstimated?: string;
  verification?: FlightVerification;
};

type LookupResponse = {
  found?: boolean;
  message?: string;
  error?: string;
  flight?: LiveFlight;
  verification?: FlightVerification;
};

type Props = {
  onFlightFound: (flight: LiveFlight) => void;
};

function formatTimestamp(value?: string | null) {
  if (!value) return "Not provided";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Not provided";
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusClass(status: string) {
  switch (status) {
    case "Cancelled":
    case "Disputed":
      return "bg-red-500/10 text-red-600 dark:text-red-400";

    case "Delayed":
    case "Rescheduled":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400";

    case "On time":
    case "Landed":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";

    default:
      return "bg-slate-500/10 text-slate-600 dark:text-slate-300";
  }
}

export default function LiveFlightSearch({ onFlightFound }: Props) {
  const [number, setNumber] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [verification, setVerification] = useState<FlightVerification | null>(
    null,
  );

  const requestController = useRef<AbortController | null>(null);

  async function searchFlight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Cancel an earlier lookup if the user starts another one.
    requestController.current?.abort();

    const controller = new AbortController();
    requestController.current = controller;

    setLoading(true);
    setError("");
    setMessage("");
    setVerification(null);

    try {
      const params = new URLSearchParams({
        number: number.trim().replace(/\s+/g, "").toUpperCase(),
        date,
      });

      const response = await fetch(`/api/flights?${params.toString()}`, {
        signal: controller.signal,
        cache: "no-store",
      });

      // An upstream failure can cause a non-JSON response.
      const rawText = await response.text();

      let data: LookupResponse = {};

      if (rawText.trim()) {
        try {
          data = JSON.parse(rawText) as LookupResponse;
        } catch {
          throw new Error("The flight service returned an invalid response.");
        }
      }

      if (!response.ok) {
        throw new Error(
          data.error || `Flight lookup failed (HTTP ${response.status}).`,
        );
      }

      if (!data.found || !data.flight) {
        setMessage(data.message || "No matching flight record was found.");

        setVerification(data.verification ?? null);
        return;
      }

      const flight: LiveFlight = {
        ...data.flight,
        verification: data.verification,
      };

      setVerification(data.verification ?? null);

      onFlightFound(flight);

      const retrieved = flight.retrievedAt || flight.verifiedAt;

      const time = retrieved
        ? formatTimestamp(retrieved)
        : "an unspecified time";

      setMessage(
        `Flight record retrieved from Aviationstack at ${time}. This is a provider report, not independent verification.`,
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Unable to search for this flight.",
      );
    } finally {
      if (requestController.current === controller) {
        setLoading(false);
        requestController.current = null;
      }
    }
  }

  const hasConflict = verification?.conflictDetected === true;

  const officialChecked = verification?.officialAirlineChecked === true;

  return (
    <section className="panel">
      <div className="panel-heading">
        <div className="panel-icon">
          <Plane size={19} />
        </div>

        <div>
          <h3>Check a real flight</h3>
          <p>Look up flight data and review its reliability.</p>
        </div>
      </div>

      <form onSubmit={searchFlight}>
        <div className="field-row">
          <div>
            <label htmlFor="live-number">Flight number</label>

            <input
              id="live-number"
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              placeholder="e.g. AF149"
              autoComplete="off"
              required
            />
          </div>

          <div>
            <label htmlFor="live-date">Flight date</label>

            <input
              id="live-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>
        </div>

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? (
            <Loader2 size={18} className="spin" />
          ) : (
            <Search size={18} />
          )}

          {loading ? "Checking flight..." : "Check flight"}
        </button>
      </form>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {message && (
        <div className="lookup-message" role="status">
          <Info size={17} />
          <span>{message}</span>
        </div>
      )}

      {verification && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {hasConflict ? (
                  <ShieldAlert size={20} className="text-amber-500" />
                ) : officialChecked ? (
                  <ShieldCheck size={20} className="text-emerald-500" />
                ) : (
                  <Database size={20} className="text-[#36c3c5]" />
                )}

                <h4 className="font-bold">Flight information reliability</h4>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  hasConflict
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : officialChecked
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-slate-500/10 text-slate-600 dark:text-slate-300"
                }`}
              >
                {hasConflict
                  ? "Conflicting reports"
                  : officialChecked
                    ? "Airline source checked"
                    : "Not independently verified"}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {verification.message}
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <Database size={15} />
                Sources queried
              </div>

              <p className="mt-2 text-2xl font-bold">
                {verification.sourceCount}
              </p>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Sources that returned matching records
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <ShieldCheck size={15} />
                Official airline
              </div>

              <p className="mt-2 text-sm font-bold">
                {officialChecked ? "Source checked" : "Not checked"}
              </p>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Official airline status verification
              </p>
            </div>
          </div>

          {verification.reports.length > 0 && (
            <div className="border-t border-[var(--border)] px-5 py-5">
              <h5 className="mb-4 text-sm font-bold">Source comparison</h5>

              <div className="space-y-3">
                {verification.reports.map((report, index) => (
                  <div
                    key={`${report.provider}-${index}`}
                    className="rounded-xl border border-[var(--border)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{report.provider}</p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {report.official
                            ? "Official airline source"
                            : "Third-party data provider"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                          report.status,
                        )}`}
                      >
                        {report.status}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--muted)]">
                      <span className="flex items-center gap-1">
                        <Clock3 size={14} />
                        Retrieved: {formatTimestamp(report.retrievedAt)}
                      </span>

                      <span>
                        Provider updated:{" "}
                        {formatTimestamp(report.providerUpdatedAt)}
                      </span>
                    </div>

                    {report.url && (
                      <a
                        href={report.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#36c3c5]"
                      >
                        View source
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {verification.recommendation && (
            <div className="border-t border-[var(--border)] bg-amber-500/5 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={19}
                  className="mt-0.5 shrink-0 text-amber-500"
                />

                <div>
                  <p className="text-sm font-bold">Recommended next step</p>

                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {verification.recommendation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="disclaimer">
        Airtur currently retrieves flight information from Aviationstack. An API
        record is not proof that a flight will operate as scheduled. Confirm
        critical decisions with the operating airline.
      </p>
    </section>
  );
}
