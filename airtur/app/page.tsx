"use client";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Compass,
  Copy,
  LayoutDashboard,
  Loader2,
  Menu,
  Plane,
  RadioTower,
  Route,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import LiveFlightSearch, {
  type LiveFlight,
  type FlightVerification,
} from "./components/live-flight-search";
import RecoveryActions from "./components/recovery-actions";
import ThemeToggle from "./theme-toggle";
type FlightStatus =
  | "Delayed"
  | "Cancelled"
  | "On time"
  | "Unknown"
  | "Scheduled"
  | "Rescheduled"
  | "Departed"
  | "Landed"
  | "Disputed";
type Flight = {
  airline: string;
  number: string;
  from: string;
  to: string;
  date: string;
  scheduled: string;
  updated: string;
  status: FlightStatus;
  reason: string;
  dataSource?: "aviationstack" | "demo";
  verifiedAt?: string;
  retrievedAt?: string;
  providerStatus?: string;
  delayMinutes?: number | null;
  terminal?: string | null;
  gate?: string | null;
  arrivalScheduled?: string;
  arrivalEstimated?: string;
  verification?: FlightVerification;
};
type CopilotFacts = {
  dataSource?: string;
  status?: string;
  delayText?: string;
  retrievedAt?: string;
  independentlyVerifiedByCopilot?: boolean;
};
const scenarios: Record<string, Flight> = {
  delayed: {
    airline: "Demo Airways",
    number: "DM 7120",
    from: "Lagos (LOS)",
    to: "Owerri (QOW)",
    date: "2026-11-04",
    scheduled: "12:00 PM",
    updated: "5:30 PM",
    status: "Delayed",
    reason: "Cause not provided in this scenario.",
    dataSource: "demo",
  },
  cancelled: {
    airline: "Demo Airways",
    number: "DM 204",
    from: "Lagos (LOS)",
    to: "Abuja (ABV)",
    date: "2026-11-04",
    scheduled: "2:00 PM",
    updated: "Not available",
    status: "Cancelled",
    reason: "Cancellation reason not provided.",
    dataSource: "demo",
  },
  ontime: {
    airline: "Demo Airways",
    number: "DM 108",
    from: "Abuja (ABV)",
    to: "Lagos (LOS)",
    date: "2026-11-04",
    scheduled: "9:00 AM",
    updated: "9:00 AM",
    status: "On time",
    reason: "No disruption in this demonstration scenario.",
    dataSource: "demo",
  },
};
function airportCode(value: string) {
  return value.match(/\(([^)]+)\)/)?.[1] || "—";
}
function airportName(value: string) {
  return value.split(" (")[0];
}
function parseTime(value: string): number | null {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return hour * 60 + Number(match[2]);
}
function getDelayMinutes(flight: Flight): number | null {
  if (!["Delayed", "Rescheduled"].includes(flight.status)) return null;
  // Live provider records carry a computed delay; their timestamps are
  // not in the demo "h:mm AM/PM" format, so they can't be parsed below.
  if (
    typeof flight.delayMinutes === "number" &&
    Number.isFinite(flight.delayMinutes) &&
    flight.delayMinutes >= 0
  ) {
    return flight.delayMinutes;
  }
  if (flight.dataSource !== "demo") return null;
  const scheduled = parseTime(flight.scheduled);
  const updated = parseTime(flight.updated);
  if (scheduled === null || updated === null) return null;
  const difference = updated - scheduled;
  return difference >= 0 ? difference : null;
}
function formatDelay(minutes: number | null) {
  if (minutes === null) return "Not available";
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining}m`;
}
async function readApiResponse(
  response: Response,
): Promise<{ advice: string; facts?: CopilotFacts }> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(
      `Server returned an empty response (HTTP ${response.status}).`,
    );
  }
  let data: { advice?: string; error?: string; facts?: CopilotFacts };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned an invalid response (HTTP ${response.status}).`,
    );
  }
  if (!response.ok) {
    throw new Error(data.error || `Request failed (HTTP ${response.status}).`);
  }
  if (typeof data.advice !== "string") {
    throw new Error("No AI guidance was returned.");
  }
  return { advice: data.advice, facts: data.facts };
}
export default function Home() {
  const [scenario, setScenario] = useState("delayed");
  const [flight, setFlight] = useState<Flight>(scenarios.delayed);
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("");
  const [priority, setPriority] = useState("Arrive as early as possible");
  const [advice, setAdvice] = useState("");
  const [facts, setFacts] = useState<CopilotFacts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeId, setActiveId] = useState("overview");
  // Highlight the sidebar item for the section currently under the header.
  useEffect(() => {
    // Same order as the sections appear on the page.
    const ids = ["overview", "flight-monitor", "ai-copilot", "recovery-center"];
    function updateActive() {
      let current = "overview";
      for (const id of ids) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= 140) {
          current = id;
        }
      }
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      setActiveId(atBottom ? "recovery-center" : current);
    }
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, []);
  const delayMinutes = getDelayMinutes(flight);
  const isLive = flight.dataSource === "aviationstack";
  // The flight sent to the AI and recovery workflows always carries the
  // delay computed here, so demo and live flights are treated the same way.
  const flightForAi: Flight = {
    ...flight,
    delayMinutes: flight.status === "On time" && !isLive ? 0 : delayMinutes,
  };
  function clearAdvice() {
    setAdvice("");
    setFacts(null);
    setError("");
    setCopied(false);
  }
  function loadScenario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFlight({ ...scenarios[scenario] });
    clearAdvice();
  }
  function handleLiveFlight(found: LiveFlight) {
    setFlight({
      ...found,
      status: ([
        "Delayed",
        "Cancelled",
        "On time",
        "Unknown",
        "Scheduled",
        "Rescheduled",
        "Departed",
        "Landed",
        "Disputed",
      ].includes(found.status)
        ? found.status
        : "Unknown") as FlightStatus,
      dataSource: "aviationstack",
    });
    clearAdvice();
  }
  async function generateAdvice() {
    setLoading(true);
    clearAdvice();
    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flight: flightForAi,
          action: "assess",
          deadline,
          budget,
          priority,
        }),
      });
      const result = await readApiResponse(response);
      setAdvice(result.advice);
      setFacts(result.facts ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to generate your plan.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function copyAdvice() {
    try {
      await navigator.clipboard.writeText(advice);
      setCopied(true);
    } catch {
      setError("Unable to copy the plan automatically.");
    }
  }
  const navItems = [
    {
      id: "overview",
      label: "Overview",
      Icon: LayoutDashboard,
    },
    {
      id: "flight-monitor",
      label: "Flight Monitor",
      Icon: RadioTower,
    },
    {
      id: "ai-copilot",
      label: "AI Copilot",
      Icon: Sparkles,
    },
    {
      id: "recovery-center",
      label: "Recovery Center",
      Icon: Route,
    },
  ];
  const retrievedSource = flight.retrievedAt ?? flight.verifiedAt;
  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      <div className="flex min-h-screen">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-(--border) bg-(--surface) transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-(--border) px-6 py-6">
            <Link
              href="/landing"
              className="flex items-center gap-3 text-2xl font-extrabold"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#087f8c] text-white">
                <Plane size={20} />
              </span>
              airtur<span className="text-[#45c8c8]">.</span>
            </Link>
            <button
              type="button"
              className="lg:hidden"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={21} />
            </button>
          </div>
          <div className="px-4 py-7">
            <p className="px-3 text-xs font-bold tracking-widest text-(--muted)">
              WORKSPACE
            </p>
            <nav className="mt-5 space-y-2" aria-label="Dashboard navigation">
              {navItems.map(({ id, label, Icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  aria-current={activeId === id ? "location" : undefined}
                  onClick={() => {
                    setActiveId(id);
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#087f8c]/15 ${
                    activeId === id ? "bg-[#087f8c]/15 text-[#36c3c5]" : ""
                  }`}
                >
                  <Icon size={19} />
                  {label}
                </a>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <div className="rounded-2xl border border-(--border) p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck size={18} className="text-[#36c3c5]" />
                Travel smarter
              </div>
              <p className="mt-2 text-xs leading-6 text-(--muted)">
                Built with Meta AI. Flight availability, prices, and airline
                policies must be independently verified.
              </p>
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-4 border-b border-(--border) bg-(--surface) px-5 lg:px-9">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu size={23} />
              </button>
              <div>
                <p className="text-sm font-bold">Travel command center</p>
                <p className="text-xs text-(--muted)">
                  Your journey, back on track.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-[#087f8c]/15 px-3 py-2 text-xs font-semibold text-[#36c3c5] sm:inline-flex">
                Demo-enabled MVP
              </span>
              <ThemeToggle />
            </div>
          </header>
          <main
            id="overview"
            className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-9"
          >
            <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#102c40] to-[#10535d] p-7 text-white md:p-10">
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#80e7df]">
                  <Sparkles size={16} />
                  YOUR AI TRAVEL COPILOT
                </div>
                <h1 className="mt-5 text-3xl font-extrabold leading-tight md:text-5xl">
                  Flight disrupted?
                  <span className="mt-2 block text-[#7ee4dc]">
                    Know your next move.
                  </span>
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-7 text-[#d5e8ec] md:text-base">
                  Understand your flight situation, investigate alternatives,
                  and get personalized recovery guidance.
                </p>
                <a
                  href="#ai-copilot"
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#7ee4dc] px-5 py-3 text-sm font-bold text-[#102c40]"
                >
                  Plan my next move
                  <ArrowRight size={17} />
                </a>
              </div>
              <Plane
                size={210}
                strokeWidth={0.6}
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 top-1/2 hidden -translate-y-1/2 rotate-[-25deg] text-[#83e7e0]/30 md:block"
              />
            </section>
            <section aria-label="Trip summary">
              <div className="mb-5">
                <p className="text-xs font-bold tracking-widest text-[#36c3c5]">
                  AT A GLANCE
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  Your travel overview
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  icon={<Plane size={20} />}
                  label="Current flight"
                  value={flight.number}
                  detail={flight.airline}
                />
                <SummaryCard
                  icon={<Activity size={20} />}
                  label="Flight status"
                  value={flight.status}
                  detail={
                    isLive
                      ? "Provider-reported · not airline-confirmed"
                      : "Demo or unverified information"
                  }
                />
                <SummaryCard
                  icon={<Clock3 size={20} />}
                  label="Departure delay"
                  value={
                    ["Cancelled", "Disputed"].includes(flight.status)
                      ? flight.status
                      : ["Delayed", "Rescheduled"].includes(flight.status)
                        ? formatDelay(delayMinutes)
                        : flight.status === "On time"
                          ? "None reported"
                          : "Unknown"
                  }
                  detail="Reported delay, when available"
                />
                <SummaryCard
                  icon={<Compass size={20} />}
                  label="Recovery assistant"
                  value="Ready"
                  detail="Meta AI-powered guidance"
                />
              </div>
            </section>
            <section
              id="flight-monitor"
              className="grid scroll-mt-24 gap-6 xl:grid-cols-[1.1fr_0.9fr]"
            >
              <div className="space-y-6">
                {/* LiveFlightSearch renders its own panel and heading */}
                <LiveFlightSearch onFlightFound={handleLiveFlight} />
                <section className="panel">
                  <div className="panel-heading">
                    <div className="panel-icon">
                      <Plane size={19} />
                    </div>
                    <div>
                      <h3>Try a demonstration</h3>
                      <p>Explore Airtur using a sample scenario.</p>
                    </div>
                  </div>
                  <form onSubmit={loadScenario}>
                    <label htmlFor="demo-scenario">Select a scenario</label>
                    <select
                      id="demo-scenario"
                      value={scenario}
                      onChange={(event) => setScenario(event.target.value)}
                    >
                      <option value="delayed">Delayed flight</option>
                      <option value="cancelled">Cancelled flight</option>
                      <option value="ontime">On-time flight</option>
                    </select>
                    <button type="submit" className="primary-button">
                      Load demo scenario
                      <ArrowRight size={18} />
                    </button>
                    <p className="disclaimer">
                      Fictional demonstration data. Not live flight tracking.
                    </p>
                  </form>
                </section>
              </div>
              <div className="space-y-6">
                <section className="panel flight-panel">
                  <div className="flight-topline">
                    <span className="section-kicker">CURRENT FLIGHT</span>
                    <span
                      className={`status status-${flight.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      <span className="status-dot" />
                      {flight.status}
                    </span>
                  </div>
                  <div className="airline-name">
                    {flight.airline} · {flight.number}
                  </div>
                  <p className="disclaimer flight-source">
                    {isLive
                      ? `Aviationstack provider record · Retrieved ${
                          retrievedSource
                            ? new Date(retrievedSource ?? "").toLocaleString()
                            : "recently"
                        }`
                      : "Fictional demonstration scenario"}
                  </p>
                  <div className="route-display">
                    <div>
                      <strong>{airportCode(flight.from)}</strong>
                      <span>{airportName(flight.from)}</span>
                    </div>
                    <div className="route-middle">
                      <div className="route-line">
                        <Plane size={21} />
                      </div>
                      <small>Flight route</small>
                    </div>
                    <div className="destination">
                      <strong>{airportCode(flight.to)}</strong>
                      <span>{airportName(flight.to)}</span>
                    </div>
                  </div>
                  <div className="flight-times">
                    <div>
                      <Clock3 size={17} />
                      <span>Scheduled</span>
                      <strong>{flight.scheduled}</strong>
                    </div>
                    <div>
                      <CalendarDays size={17} />
                      <span>Updated</span>
                      <strong>{flight.updated}</strong>
                    </div>
                  </div>
                  <div
                    className={`notice ${
                      ["On time", "Landed"].includes(flight.status)
                        ? "notice-success"
                        : ""
                    }`}
                  >
                    {["On time", "Landed"].includes(flight.status) ? (
                      <CheckCircle2 size={19} />
                    ) : (
                      <TriangleAlert size={19} />
                    )}
                    <p>
                      {flight.status === "Unknown"
                        ? "The provider has not confirmed whether this flight is on time."
                        : flight.reason}{" "}
                      Confirm important information directly with the airline.
                    </p>
                  </div>
                </section>
                <section
                  className="panel"
                  aria-label="Flight verification summary"
                >
                  <div className="panel-heading">
                    <div className="panel-icon">
                      <ShieldCheck size={19} />
                    </div>
                    <div>
                      <h3>Source verification</h3>
                      <p>See what Airtur has actually checked.</p>
                    </div>
                  </div>
                  {!isLive ? (
                    <p className="text-sm leading-7 text-(--muted)">
                      Demonstration scenario. No real flight sources were
                      queried.
                    </p>
                  ) : (
                    <div className="space-y-3 text-sm leading-6">
                      <p>
                        <strong>Primary provider:</strong> Aviationstack
                        (reported data, not airline-confirmed).
                      </p>
                      <p>
                        <strong>Official airline:</strong>{" "}
                        {flight.verification?.officialAirlineChecked
                          ? "Reported as checked by supplied metadata; not independently authenticated"
                          : "Not checked"}
                      </p>
                      <p>
                        <strong>Cross-provider comparison:</strong>{" "}
                        {flight.verification?.conflictCheckPerformed
                          ? flight.verification?.conflictDetected
                            ? "Conflicting reports supplied"
                            : "No conflict reported in supplied comparison"
                          : "Not performed"}
                      </p>
                      {flight.verification?.message && (
                        <p className="text-(--muted)">
                          {flight.verification?.message}
                        </p>
                      )}
                      {flight.verification?.reports?.length ? (
                        <div className="space-y-2">
                          {flight.verification?.reports?.map(
                            (report, index) => (
                              <div
                                key={`${report.provider}-${index}`}
                                className="rounded-xl border border-(--border) p-3"
                              >
                                <strong>{report.provider}</strong> ·{" "}
                                {report.status}
                                <p className="text-xs text-(--muted)">
                                  Retrieved:{" "}
                                  {report.retrievedAt
                                    ? new Date(
                                        report.retrievedAt,
                                      ).toLocaleString()
                                    : "Unknown"}
                                </p>
                                {report.url && (
                                  <a
                                    className="text-[#36c3c5] underline"
                                    href={report.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    View source
                                  </a>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <p className="text-(--muted)">
                          No independent comparison reports available.
                        </p>
                      )}
                      <p className="text-xs text-(--muted)">
                        The dashboard displays provider metadata returned by the
                        flight API. It does not itself authenticate official
                        airline checks.
                      </p>
                    </div>
                  )}
                </section>
                <section className="panel">
                  <div className="panel-heading">
                    <div className="panel-icon">
                      <Activity size={19} />
                    </div>
                    <div>
                      <h3>Departure timeline</h3>
                      <p>Scheduled versus updated departure.</p>
                    </div>
                  </div>
                  {delayMinutes !== null ? (
                    <div className="space-y-5">
                      <TimelineBar
                        label="Scheduled"
                        value={flight.scheduled}
                        percentage={50}
                        color="#3ac8c6"
                      />
                      <TimelineBar
                        label="Updated"
                        value={flight.updated}
                        percentage={80}
                        color="#f0b85b"
                      />
                      <p className="text-xs leading-6 text-(--muted)">
                        Illustrative bars, not a scaled time axis. Calculated
                        delay: <strong>{formatDelay(delayMinutes)}</strong>.
                        Provider times may be updated.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm leading-7 text-(--muted)">
                      A comparable scheduled and updated departure time is not
                      available for this flight.
                    </p>
                  )}
                </section>
              </div>
            </section>
            <section id="ai-copilot" className="panel scroll-mt-24">
              <div className="copilot-heading">
                <div className="copilot-symbol">
                  <Sparkles size={22} />
                </div>
                <div>
                  <span className="section-kicker">
                    PERSONALIZED ASSISTANCE
                  </span>
                  <h3>Meet your Airtur Copilot</h3>
                  <p>Tell us what matters most about your journey.</p>
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="copilot-form">
                  <label htmlFor="deadline">When do you need to arrive?</label>
                  <input
                    id="deadline"
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                    placeholder="e.g. Before 10 AM tomorrow"
                  />
                  <label htmlFor="budget">Budget for alternatives</label>
                  <input
                    id="budget"
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                    placeholder="e.g. NGN 80,000"
                  />
                  <label htmlFor="priority">What matters most?</label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                  >
                    <option>Arrive as early as possible</option>
                    <option>Spend as little as possible</option>
                    <option>Avoid additional uncertainty</option>
                    <option>Understand my passenger rights</option>
                  </select>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={generateAdvice}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 size={18} className="spin" />
                    ) : (
                      <Sparkles size={18} />
                    )}
                    {loading
                      ? "Preparing your guidance..."
                      : "Find my next move"}
                  </button>
                </div>
                <div>
                  {error && (
                    <p className="error-message" role="alert">
                      {error}
                    </p>
                  )}
                  {advice ? (
                    <div className="response-card">
                      {facts && (
                        <div className="mb-5 rounded-xl border border-(--border) bg-(--surface) p-4 text-xs leading-6">
                          <p className="font-bold text-[#36c3c5]">
                            Flight information supplied to AI
                          </p>
                          <p className="mt-1 text-(--muted)">
                            {facts?.dataSource ===
                            "client-supplied-provider-data"
                              ? "Client-supplied provider record · not independently verified"
                              : "Demo or unverified information"}
                            {" · "}Status: {facts?.status ?? "Unknown"}
                            {" · "}Delay: {facts?.delayText ?? "Unknown"}
                            {facts?.retrievedAt
                              ? ` · Retrieved ${new Date(
                                  facts?.retrievedAt ?? "",
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`
                              : ""}
                          </p>
                          <p className="mt-2 font-bold text-(--muted)">
                            Everything below is an AI suggestion to verify.
                          </p>
                        </div>
                      )}
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <strong>Your recovery plan</strong>
                        <button
                          type="button"
                          onClick={copyAdvice}
                          className="flex items-center gap-2 text-sm"
                        >
                          {copied ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <Copy size={16} />
                          )}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="response-text">{advice}</div>
                      <p className="response-note">
                        AI guidance only. Verify live schedules, availability,
                        costs, and airline policies.
                      </p>
                    </div>
                  ) : (
                    <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-(--border) p-7 text-center">
                      <Sparkles size={32} className="text-[#36c3c5]" />
                      <h4 className="mt-4 font-bold">
                        Your next move starts here
                      </h4>
                      <p className="mt-2 max-w-xs text-sm leading-7 text-(--muted)">
                        Share your travel priorities and Airtur will generate a
                        personalized action plan using Meta AI.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
            <section id="recovery-center" className="scroll-mt-24">
              <div className="mb-5">
                <p className="text-xs font-bold tracking-widest text-[#36c3c5]">
                  RECOVERY CENTER
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  Choose your next step
                </h2>
              </div>
              <RecoveryActions
                key={`${flight.number}-${flight.date}-${flight.dataSource}-${flight.retrievedAt ?? flight.status}`}
                flight={flightForAi}
                deadline={deadline}
                budget={budget}
                priority={priority}
              />
            </section>
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-(--border) py-7 text-xs text-(--muted)">
              <span>airtur. — Your journey, back on track.</span>
              <span>Powered by Meta AI · Hackathon MVP</span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
function SummaryCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-(--border) bg-(--surface) p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-(--muted)">{label}</span>
        <span className="text-[#36c3c5]">{icon}</span>
      </div>
      <p className="mt-5 wrap-break-word text-xl font-bold">{value}</p>
      <p className="mt-2 text-xs leading-5 text-(--muted)">{detail}</p>
    </div>
  );
}
function TimelineBar({
  label,
  value,
  percentage,
  color,
}: {
  label: string;
  value: string;
  percentage: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between gap-3 text-sm">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#728a99]/20">
        <div
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
