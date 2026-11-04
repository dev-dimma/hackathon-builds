"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
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
    delayMinutes: 330,
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
    delayMinutes: null,
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
    delayMinutes: 0,
  },
};

function getDelayMinutes(flight: Flight): number | null {
  if (typeof flight.delayMinutes === "number") {
    return Number.isFinite(flight.delayMinutes) ? flight.delayMinutes : null;
  }
  return null;
}

function formatDelay(minutes: number | null) {
  if (minutes === null) return "Not available";
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining}m`;
}

function getStatusColor(status: FlightStatus) {
  if (status === "Delayed" || status === "Rescheduled") {
    return "text-amber-300 bg-amber-500/15";
  }
  if (status === "Cancelled" || status === "Disputed") {
    return "text-red-300 bg-red-500/15";
  }
  if (status === "On time" || status === "Landed") {
    return "text-emerald-300 bg-emerald-500/15";
  }
  return "text-sky-300 bg-sky-500/15";
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

  let data: {
    advice?: string;
    error?: string;
    facts?: CopilotFacts;
  };

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

  if (typeof data.advice !== "string" || !data.advice.trim()) {
    throw new Error("No AI guidance was returned.");
  }

  return {
    advice: data.advice,
    facts: data.facts,
  };
}

export default function Home() {
  const [scenario, setScenario] = useState("delayed");
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoNotice, setDemoNotice] = useState("");
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

  useEffect(() => {
    const ids = ["overview", "flight-monitor", "ai-copilot", "recovery-center"];

    function updateActive() {
      let current = "overview";

      for (const id of ids) {
        const element = document.getElementById(id);

        if (element && element.getBoundingClientRect().top <= 160) {
          current = id;
        }
      }

      setActiveId(current);
    }

    updateActive();

    window.addEventListener("scroll", updateActive, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", updateActive);
    };
  }, []);

  const delayMinutes = getDelayMinutes(flight);

  const flightForAi: Flight = {
    ...flight,
    delayMinutes,
  };

  function clearAdvice() {
    setAdvice("");
    setFacts(null);
    setError("");
    setCopied(false);
  }

  async function loadScenario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (demoLoading) return;

    setDemoLoading(true);
    setDemoNotice("");

    try {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 450);
      });

      const selected = scenarios[scenario];

      if (!selected) {
        throw new Error("Invalid demo scenario.");
      }

      setFlight({ ...selected });
      clearAdvice();

      const names: Record<string, string> = {
        delayed: "Delayed flight",
        cancelled: "Cancelled flight",
        ontime: "On-time flight",
      };

      setDemoNotice(
        `${names[scenario]} loaded successfully. Your flight monitor and recovery tools are updated.`,
      );

      document.getElementById("flight-monitor")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } catch {
      setDemoNotice("Unable to load the demonstration. Please try again.");
    } finally {
      setDemoLoading(false);
    }
  }

  function handleLiveFlight(found: LiveFlight) {
    const validStatuses: FlightStatus[] = [
      "Delayed",
      "Cancelled",
      "On time",
      "Unknown",
      "Scheduled",
      "Rescheduled",
      "Departed",
      "Landed",
      "Disputed",
    ];

    const status: FlightStatus = validStatuses.includes(
      found.status as FlightStatus,
    )
      ? (found.status as FlightStatus)
      : "Unknown";

    setFlight({
      ...found,
      status,
      dataSource: "aviationstack",
    });

    clearAdvice();
    setDemoNotice("");

    document.getElementById("flight-monitor")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function generateAdvice() {
    if (loading) return;

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

  function navigateTo(id: string) {
    setActiveId(id);
    setSidebarOpen(false);

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-(--border) bg-(--surface) transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-(--border) px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-600 p-2.5 text-white">
              <Plane size={22} />
            </div>

            <div className="text-2xl font-bold tracking-tight">
              airtur
              <span className="text-teal-400">.</span>
            </div>
          </div>

          <button
            type="button"
            className="lg:hidden"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pt-8">
          <p className="mb-5 px-2 text-xs font-bold tracking-widest text-sky-300">
            WORKSPACE
          </p>

          <nav className="space-y-2">
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => navigateTo(id)}
                aria-current={activeId === id ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  activeId === id
                    ? "bg-teal-700/20 text-white"
                    : "text-(--text) hover:bg-teal-700/10"
                }`}
              >
                <Icon size={19} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-5">
          <div className="rounded-2xl border border-(--border) p-4">
            <ShieldCheck size={20} className="mb-3 text-teal-400" />

            <h3 className="text-sm font-semibold">Travel smarter</h3>

            <p className="mt-2 text-xs leading-6 text-(--muted)">
              Built with Meta AI. Flight information, prices, and airline
              policies must be independently verified.
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-(--border) bg-(--surface) px-5 md:px-9">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Open navigation"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div>
              <h1 className="text-sm font-bold">Travel command center</h1>

              <p className="text-xs text-(--muted)">
                Your journey, back on track.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-teal-600/10 px-4 py-2 text-xs font-semibold text-teal-400 sm:inline-flex">
              Demo-enabled MVP
            </span>

            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-12 px-5 py-8 md:px-9">
          <section id="overview" className="scroll-mt-28 space-y-6">
            <div>
              <p className="text-xs font-bold tracking-widest text-teal-400">
                OVERVIEW
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                Flight disrupted?
                <br />
                Know your next move.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-(--muted)">
                Airtur helps you understand flight disruptions and plan your
                next steps with AI-powered guidance.
              </p>
            </div>

            <div className="rounded-2xl border border-(--border) bg-(--surface) p-5">
              <div className="flex items-start gap-3">
                <TriangleAlert
                  size={20}
                  className="mt-1 shrink-0 text-amber-400"
                />

                <p className="text-sm leading-7 text-(--muted)">
                  Airtur currently retrieves flight information from
                  Aviationstack. An API record is not proof that a flight will
                  operate as scheduled. Confirm critical decisions with the
                  operating airline.
                </p>
              </div>
            </div>

            <form
              onSubmit={loadScenario}
              className="rounded-2xl border border-(--border) bg-(--surface) p-6"
            >
              <div className="mb-6 flex items-start gap-4">
                <div className="rounded-xl bg-teal-600/15 p-3 text-teal-400">
                  <Plane size={22} />
                </div>

                <div>
                  <h3 className="text-lg font-bold">Try a demonstration</h3>

                  <p className="mt-1 text-sm text-(--muted)">
                    Explore Airtur using a sample scenario.
                  </p>
                </div>
              </div>

              <label
                htmlFor="demo-scenario"
                className="mb-2 block text-sm font-semibold"
              >
                Select a scenario
              </label>

              <select
                id="demo-scenario"
                value={scenario}
                onChange={(event) => setScenario(event.target.value)}
                disabled={demoLoading}
                className="w-full rounded-xl border border-(--border) bg-(--bg) px-4 py-4 text-sm"
              >
                <option value="delayed">Delayed flight</option>
                <option value="cancelled">Cancelled flight</option>
                <option value="ontime">On-time flight</option>
              </select>

              <button
                type="submit"
                disabled={demoLoading}
                aria-busy={demoLoading}
                className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl bg-teal-700 px-5 py-4 text-sm font-bold text-white transition hover:bg-teal-600 disabled:cursor-wait disabled:opacity-70"
              >
                {demoLoading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                    Loading scenario...
                  </>
                ) : (
                  <>
                    Load demo scenario
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {demoNotice && (
                <p
                  role="status"
                  aria-live="polite"
                  className="mt-4 flex items-start gap-2 rounded-lg bg-teal-600/10 p-3 text-sm text-teal-400"
                >
                  <CheckCircle2 size={18} className="shrink-0" />
                  {demoNotice}
                </p>
              )}

              <p className="mt-4 text-center text-xs text-(--muted)">
                Fictional demonstration data. Not live flight tracking.
              </p>
            </form>
          </section>

          <section id="flight-monitor" className="scroll-mt-28 space-y-6">
            <div>
              <p className="text-xs font-bold tracking-widest text-teal-400">
                FLIGHT MONITOR
              </p>

              <h2 className="mt-2 text-2xl font-bold">Track your flight</h2>

              <p className="mt-2 text-sm text-(--muted)">
                Search for a flight or explore the selected demonstration
                scenario.
              </p>
            </div>

            <LiveFlightSearch onFlightFound={handleLiveFlight} />

            <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-widest text-teal-400">
                    CURRENT FLIGHT
                  </p>

                  <h3 className="mt-3 text-xl font-bold">
                    {flight.airline} · {flight.number}
                  </h3>

                  <p className="mt-2 text-sm text-(--muted)">
                    {flight.from} to {flight.to}
                  </p>
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${getStatusColor(
                    flight.status,
                  )}`}
                >
                  {flight.status}
                </span>
              </div>

              <div className="mt-6 grid gap-4 border-t border-(--border) pt-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Flight date",
                    value: flight.date,
                  },
                  {
                    label: "Scheduled departure",
                    value: flight.scheduled,
                  },
                  {
                    label: "Reported departure",
                    value: flight.updated,
                  },
                  {
                    label: "Reported delay",
                    value: formatDelay(delayMinutes),
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-(--muted)">{item.label}</p>

                    <p className="mt-2 text-sm font-bold">{item.value}</p>
                  </div>
                ))}
              </div>

              {flight.reason && (
                <div className="mt-6 rounded-xl bg-(--bg) p-4">
                  <p className="text-xs font-bold">Reported reason</p>

                  <p className="mt-2 text-sm text-(--muted)">{flight.reason}</p>
                </div>
              )}

              <div className="mt-6 rounded-xl border border-(--border) p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-teal-400" />

                  <h4 className="text-sm font-bold">
                    Flight information reliability
                  </h4>
                </div>

                {flight.dataSource === "demo" ? (
                  <p className="mt-3 text-sm leading-6 text-(--muted)">
                    Demonstration scenario. No real flight sources were queried.
                  </p>
                ) : (
                  <>
                    <p className="mt-3 text-sm leading-6 text-(--muted)">
                      Provider: Aviationstack. This information has not been
                      independently confirmed with the operating airline.
                    </p>

                    {flight.retrievedAt && (
                      <p className="mt-2 text-xs text-(--muted)">
                        Retrieved: {flight.retrievedAt}
                      </p>
                    )}

                    {flight.verification?.message && (
                      <p className="mt-3 text-sm leading-6 text-(--muted)">
                        {flight.verification.message}
                      </p>
                    )}

                    {flight.verification?.reports?.map((report, index) => (
                      <div
                        key={`${report.provider}-${index}`}
                        className="mt-3 rounded-lg bg-(--bg) p-3"
                      >
                        <p className="text-sm font-semibold">
                          {report.provider}
                        </p>

                        <p className="mt-1 text-xs text-(--muted)">
                          Reported status: {report.status}
                        </p>

                        {report.retrievedAt && (
                          <p className="mt-1 text-xs text-(--muted)">
                            Retrieved: {report.retrievedAt}
                          </p>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </section>

          <section id="ai-copilot" className="scroll-mt-28 space-y-6">
            <div>
              <p className="text-xs font-bold tracking-widest text-teal-400">
                AI COPILOT
              </p>

              <h2 className="mt-2 text-2xl font-bold">Find your next move</h2>

              <p className="mt-2 text-sm text-(--muted)">
                Tell Airtur what matters most to you and get a personalized
                recovery plan powered by Meta AI.
              </p>
            </div>

            <div className="grid gap-6 rounded-2xl border border-(--border) bg-(--surface) p-6 lg:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="deadline"
                    className="mb-2 block text-sm font-semibold"
                  >
                    When do you need to arrive?
                  </label>

                  <input
                    id="deadline"
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                    placeholder="Before 10AM tomorrow"
                    className="w-full rounded-xl border border-(--border) bg-(--bg) px-4 py-4 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="budget"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Budget for alternatives
                  </label>

                  <input
                    id="budget"
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                    placeholder="100,000 NGN"
                    className="w-full rounded-xl border border-(--border) bg-(--bg) px-4 py-4 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="priority"
                    className="mb-2 block text-sm font-semibold"
                  >
                    What matters most?
                  </label>

                  <select
                    id="priority"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    className="w-full rounded-xl border border-(--border) bg-(--bg) px-4 py-4 text-sm"
                  >
                    <option>Arrive as early as possible</option>
                    <option>Minimize additional costs</option>
                    <option>Reduce stress and uncertainty</option>
                    <option>Find the safest practical option</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={generateAdvice}
                  aria-busy={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-teal-700 px-5 py-4 text-sm font-bold text-white transition hover:bg-teal-600 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Preparing your guidance...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Find my next move
                    </>
                  )}
                </button>

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl bg-red-500/15 p-4 text-sm text-red-300"
                  >
                    {error}
                  </p>
                )}
              </div>

              <div className="min-h-80 rounded-2xl border border-(--border) p-5">
                {!advice ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    {loading ? (
                      <Loader2
                        size={32}
                        className="animate-spin text-teal-400"
                      />
                    ) : (
                      <Sparkles size={32} className="text-teal-400" />
                    )}

                    <h3 className="mt-5 text-lg font-bold">
                      {loading
                        ? "Preparing your recovery plan"
                        : "Your next move starts here"}
                    </h3>

                    <p className="mt-3 max-w-xs text-sm leading-7 text-(--muted)">
                      {loading
                        ? "Meta AI is reviewing your travel priorities."
                        : "Share your travel priorities and Airtur will generate a personalized action plan using Meta AI."}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="rounded-xl border border-(--border) p-4">
                      <p className="text-xs font-bold text-teal-400">
                        Flight information supplied to AI
                      </p>

                      <p className="mt-2 text-xs leading-6 text-(--muted)">
                        {flight.dataSource === "demo"
                          ? "Demo information"
                          : "Unverified third-party information"}
                        {" · Status: "}
                        {flight.status}
                        {" · Delay: "}
                        {formatDelay(delayMinutes)}
                      </p>

                      <p className="mt-2 text-xs text-(--muted)">
                        Everything below is an AI suggestion to verify.
                      </p>

                      {facts?.status && (
                        <p className="mt-2 text-xs text-(--muted)">
                          AI-reported status: {facts.status}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <h3 className="font-bold">Your recovery plan</h3>

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

                    <div className="mt-4 whitespace-pre-wrap text-sm leading-8">
                      {advice}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section
            id="recovery-center"
            className="scroll-mt-28 space-y-6 pb-12"
          >
            <div>
              <p className="text-xs font-bold tracking-widest text-teal-400">
                RECOVERY CENTER
              </p>

              <h2 className="mt-2 text-2xl font-bold">Choose your next step</h2>

              <p className="mt-2 text-sm text-(--muted)">
                Explore practical ways to respond to your current flight
                situation.
              </p>
            </div>

            <RecoveryActions flight={flightForAi} />

            <div className="flex items-start gap-3 rounded-xl border border-(--border) p-4">
              <Clock3 size={19} className="mt-1 shrink-0 text-teal-400" />

              <p className="text-xs leading-6 text-(--muted)">
                Airtur provides planning assistance, not confirmed flight
                bookings, guaranteed alternatives, or official airline
                instructions. Verify important decisions before acting.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
