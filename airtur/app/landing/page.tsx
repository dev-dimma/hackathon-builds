import Link from "next/link";
import { Bricolage_Grotesque } from "next/font/google";
import {
  ArrowRight,
  BellRing,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Coffee,
  Compass,
  MapPinned,
  Plane,
  PlaneTakeoff,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const steps = [
  {
    title: "Find your flight",
    description:
      "Search supported flight data, or pick a demonstration scenario to try it out.",
  },
  {
    title: "Tell Airtur what matters",
    description:
      "Share your arrival deadline, your budget, and what you can't compromise on.",
  },
  {
    title: "Choose your next move",
    description:
      "Get an AI-assisted plan, then decide what to explore: wait, rebook, or replan.",
  },
];

const faqs = [
  {
    q: "Does Airtur rebook my flight?",
    a: "No. Airtur explains your situation and the options worth investigating. Any change to your booking is made with your airline.",
  },
  {
    q: "Is the flight information live?",
    a: "Airtur uses supported flight data where available. The example on this page is an illustration and does not imply live availability.",
  },
  {
    q: "Do I need an account?",
    a: "No. You can try Airtur without signing in.",
  },
  {
    q: "What powers the guidance?",
    a: "Personalized recommendations are generated with Meta AI, based on the deadline, budget, and priorities you share.",
  },
];

const options = [
  {
    label: "Wait it out",
    note: "Departs 21:40. Arrives 1h 10m past your deadline.",
    tone: "text-amber-300",
  },
  {
    label: "Investigate rebooking",
    note: "Ask about earlier departures on the same route.",
    tone: "text-[#85e5dc]",
  },
  {
    label: "Replan the connection",
    note: "Check whether your onward trip still works.",
    tone: "text-[#85e5dc]",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f4f8f9] text-[#0d2638] antialiased">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a2133]/85 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-10">
          <Link
            href="/landing"
            className={`${display.className} flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#12a5b3] to-[#087f8c] shadow-lg shadow-[#087f8c]/40">
              <Plane size={20} />
            </span>
            airtur<span className="text-[#79e0d7]">.</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-[#c6dde3] md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[#79e0d7] px-4 py-2.5 text-sm font-bold text-[#0a2133] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Launch app
            <ArrowRight size={16} />
          </Link>
        </nav>
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-[#0a2133] px-5 pb-24 pt-16 text-white md:px-10 md:pb-32 md:pt-24">
          {/* layered backdrop */}
          <div className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-[#087f8c]/30 blur-[120px]" />
          <div className="pointer-events-none absolute -right-32 -top-32 h-[460px] w-[460px] rounded-full bg-[#79e0d7]/15 blur-[110px]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage:
                "radial-gradient(ellipse at 30% 30%, black 20%, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at 30% 30%, black 20%, transparent 70%)",
            }}
          />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#79e0d7]/30 bg-[#79e0d7]/10 px-4 py-2 text-sm font-semibold text-[#9aeee6]">
                <Sparkles size={15} />
                AI flight disruption copilot, powered by Meta AI
              </div>

              <h1
                className={`${display.className} text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl`}
              >
                <span className="bg-gradient-to-b from-white to-[#b9d6dd] bg-clip-text text-transparent">
                  Flight delayed?
                </span>
                <span className="mt-2 block bg-gradient-to-r from-[#79e0d7] via-[#5fd0e0] to-[#9fe8c7] bg-clip-text text-transparent">
                  Know your next move.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-8 text-[#c9dfe5] md:text-lg">
                Delays and cancellations are stressful. Airtur helps you
                understand what happened, compare your options, and decide with
                confidence.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/"
                  className="group inline-flex items-center gap-3 rounded-xl bg-[#79e0d7] px-7 py-4 font-bold text-[#0a2133] shadow-lg shadow-[#79e0d7]/20 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Try Airtur free
                  <ArrowRight
                    size={19}
                    className="transition group-hover:translate-x-1"
                  />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-7 py-4 font-semibold transition hover:bg-white/10"
                >
                  See how it works
                </a>
              </div>

              <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#c6e7e7]">
                {[
                  "Personalized guidance",
                  "Recovery planning",
                  "No sign-in required to try",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 size={17} className="text-[#79e0d7]" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* departure board mock: the memorable moment */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#79e0d7]/20 to-transparent blur-2xl" />
              <div className="relative rounded-3xl border border-white/15 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl md:p-7">
                <div className="flex items-center justify-between text-xs text-[#a9c9d2]">
                  <span className="flex items-center gap-2 font-semibold text-[#c6dde3]">
                    <PlaneTakeoff size={16} /> Departure
                  </span>
                  <span className="flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 font-bold text-amber-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300" />
                    Delayed 6h
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p
                      className={`${display.className} text-4xl font-extrabold md:text-5xl`}
                    >
                      LOS
                    </p>
                    <p className="mt-1 text-xs text-[#a9c9d2]">Lagos</p>
                  </div>
                  <div className="mx-4 flex flex-1 items-center gap-2 text-[#79e0d7]">
                    <span className="h-px flex-1 border-t border-dashed border-white/30" />
                    <Plane size={20} className="rotate-45" />
                    <span className="h-px flex-1 border-t border-dashed border-white/30" />
                  </div>
                  <div className="text-right">
                    <p
                      className={`${display.className} text-4xl font-extrabold md:text-5xl`}
                    >
                      LHR
                    </p>
                    <p className="mt-1 text-xs text-[#a9c9d2]">London</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="rounded-xl bg-white/8 p-3">
                    <p className="text-[#a9c9d2]">Scheduled</p>
                    <p className="mt-1 text-sm font-bold line-through decoration-amber-300/70">
                      15:40
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-400/10 p-3">
                    <p className="text-amber-200/80">Now</p>
                    <p className="mt-1 text-sm font-bold text-amber-300">
                      21:40
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/8 p-3">
                    <p className="text-[#a9c9d2]">Your deadline</p>
                    <p className="mt-1 text-sm font-bold">Tomorrow 09:00</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#79e0d7]/25 bg-[#0a2133]/70 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-[#9aeee6]">
                    <Sparkles size={16} /> Airtur suggests exploring
                  </p>
                  <ul className="mt-3 space-y-3">
                    {options.map((o) => (
                      <li key={o.label} className="flex gap-3 text-sm">
                        <CheckCircle2
                          size={17}
                          className={`mt-0.5 shrink-0 ${o.tone}`}
                        />
                        <span>
                          <span className="font-semibold">{o.label}</span>
                          <span className="block text-xs leading-5 text-[#a9c9d2]">
                            {o.note}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-[#8fb0ba]">
                Illustrative scenario. No live flight or booking availability is
                implied.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT IT TAKES INTO ACCOUNT */}
        <section className="border-b border-[#e1e9ed] bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 md:grid-cols-3 md:px-10">
            {[
              {
                icon: Clock3,
                t: "Your deadline",
                d: "Plans are built around when you actually need to arrive.",
              },
              {
                icon: Wallet,
                t: "Your budget",
                d: "Options are weighed against what you're willing to spend.",
              },
              {
                icon: Briefcase,
                t: "Your priorities",
                d: "Meetings, connections, comfort: you decide what matters.",
              },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e3f5f4] text-[#087f8c]">
                  <Icon size={21} />
                </span>
                <div>
                  <p className="font-bold">{t}</p>
                  <p className="mt-1 text-sm leading-6 text-[#5a7183]">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES: bento, mixed sizes */}
        <section
          id="features"
          className="mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-28"
        >
          <div className="mb-14 max-w-2xl">
            <h2
              className={`${display.className} text-3xl font-extrabold tracking-tight md:text-5xl`}
            >
              When travel plans change, you need a plan.
            </h2>
            <p className="mt-5 leading-8 text-[#5a7183]">
              Airtur brings flight information, personalized recommendations,
              and practical recovery planning into one experience.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-6">
            {/* large */}
            <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a2133] to-[#12405a] p-8 text-white md:col-span-4 md:p-10">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#79e0d7]/15 blur-3xl" />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[#79e0d7]">
                <BellRing size={24} />
              </span>
              <h3
                className={`${display.className} relative mt-6 text-2xl font-bold md:text-3xl`}
              >
                Understand the disruption
              </h3>
              <p className="relative mt-3 max-w-lg text-[#c9dfe5]">
                Check supported flight information and see what a delay or
                cancellation actually means for your journey, in plain language.
              </p>
              <div className="relative mt-8 flex flex-wrap gap-3 text-xs font-semibold">
                {["Delay", "Cancellation", "Missed connection"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/20 bg-white/8 px-4 py-2"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </article>

            {/* small */}
            <article className="rounded-3xl border border-[#d9e6ea] bg-white p-8 shadow-sm md:col-span-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e3f5f4] text-[#087f8c]">
                <Sparkles size={24} />
              </span>
              <h3 className={`${display.className} mt-6 text-xl font-bold`}>
                Personalized AI guidance
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#5a7183]">
                Share your deadline, budget, and priorities. Get practical next
                steps powered by Meta AI.
              </p>
            </article>

            <article className="rounded-3xl border border-[#d9e6ea] bg-white p-8 shadow-sm md:col-span-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e3f5f4] text-[#087f8c]">
                <RefreshCw size={24} />
              </span>
              <h3 className={`${display.className} mt-6 text-xl font-bold`}>
                Explore recovery options
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#5a7183]">
                Compare the decisions worth investigating: waiting, rebooking,
                and changing your plans.
              </p>
            </article>

            {/* large, with mini itinerary */}
            <article className="rounded-3xl border border-[#d9e6ea] bg-gradient-to-br from-white to-[#e9f6f5] p-8 shadow-sm md:col-span-4 md:p-10">
              <div className="grid items-center gap-8 md:grid-cols-2">
                <div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#087f8c] text-white">
                    <Compass size={24} />
                  </span>
                  <h3
                    className={`${display.className} mt-6 text-2xl font-bold`}
                  >
                    Make waiting time useful
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#5a7183]">
                    Get a suggested airport itinerary based on how much time you
                    have and what you like.
                  </p>
                </div>

                <ol className="relative space-y-4 border-l-2 border-dashed border-[#087f8c]/30 pl-6 text-sm">
                  {[
                    {
                      icon: Coffee,
                      t: "Settle in with a proper meal",
                      m: "Sample · 45 min",
                    },
                    {
                      icon: MapPinned,
                      t: "Walk the terminal and stretch",
                      m: "Sample · 30 min",
                    },
                    {
                      icon: Briefcase,
                      t: "Catch up on work near a charging spot",
                      m: "Sample · 90 min",
                    },
                  ].map(({ icon: Icon, t, m }) => (
                    <li
                      key={t}
                      className="relative rounded-xl bg-white p-3 shadow-sm"
                    >
                      <span className="absolute -left-[2.15rem] top-3.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#087f8c] text-white">
                        <Icon size={13} />
                      </span>
                      <p className="font-semibold">{t}</p>
                      <p className="text-xs text-[#6b8090]">{m}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </article>
          </div>
        </section>

        {/* HOW IT WORKS: a real sequence, so numbers are earned */}
        <section
          id="how-it-works"
          className="bg-[#e6f1f2] px-5 py-20 md:px-10 md:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 max-w-2xl">
              <h2
                className={`${display.className} text-3xl font-extrabold tracking-tight md:text-5xl`}
              >
                Three steps to a clearer decision.
              </h2>
            </div>

            <div className="relative grid gap-6 md:grid-cols-3">
              <div className="pointer-events-none absolute left-[16%] right-[16%] top-8 hidden border-t-2 border-dashed border-[#087f8c]/30 md:block" />
              {steps.map((step, i) => (
                <div
                  key={step.title}
                  className="relative rounded-3xl border border-[#d3e4e7] bg-white p-8 shadow-sm"
                >
                  <span
                    className={`${display.className} flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#12a5b3] to-[#087f8c] text-2xl font-extrabold text-white shadow-lg shadow-[#087f8c]/30`}
                  >
                    {i + 1}
                  </span>
                  <h3 className={`${display.className} mt-6 text-xl font-bold`}>
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#5a7183]">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MORE THAN TRACKING */}
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 md:grid-cols-2 md:px-10 md:py-28">
          <div>
            <h2
              className={`${display.className} text-3xl font-extrabold tracking-tight md:text-5xl`}
            >
              Flight tracking tells you what happened. Airtur helps you decide
              what comes next.
            </h2>
            <p className="mt-6 max-w-lg leading-8 text-[#5a7183]">
              Whether you want to wait at the airport, investigate rebooking,
              reorganize your itinerary, or contact your airline, Airtur helps
              you work through the decision.
            </p>
            <Link
              href="/"
              className="group mt-8 inline-flex items-center gap-2 font-bold text-[#087f8c] hover:underline"
            >
              Explore the AI copilot
              <ArrowRight
                size={18}
                className="transition group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="rounded-3xl bg-[#0a2133] p-6 text-white shadow-2xl md:p-9">
            <div className="flex items-center gap-3 border-b border-white/15 pb-6">
              <div className="rounded-xl bg-[#087f8c] p-3">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="font-bold">Airtur Copilot</p>
                <p className="text-xs text-[#a9c9d2]">
                  Example recovery workflow
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-xl bg-white/10 p-5">
              <div className="flex items-center gap-2 text-[#85e5dc]">
                <Clock3 size={18} />
                <span className="text-sm font-bold">Flight delayed</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[#d1e3e8]">
                Your departure is delayed by six hours. You have time to explore
                your options.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/15 p-4">
                <MapPinned size={20} className="text-[#85e5dc]" />
                <p className="mt-3 text-sm font-semibold">Plan airport time</p>
              </div>
              <div className="rounded-xl border border-white/15 p-4">
                <RefreshCw size={20} className="text-[#85e5dc]" />
                <p className="mt-3 text-sm font-semibold">Explore rebooking</p>
              </div>
            </div>

            <p className="mt-5 text-xs leading-6 text-[#a9c9d2]">
              Illustrative scenario. No live flight or booking availability is
              implied.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="mx-auto max-w-3xl px-5 pb-20 md:px-10 md:pb-28"
        >
          <h2
            className={`${display.className} text-center text-3xl font-extrabold tracking-tight md:text-4xl`}
          >
            Questions, answered.
          </h2>
          <div className="mt-10 divide-y divide-[#dbe7ea] overflow-hidden rounded-2xl border border-[#d9e6ea] bg-white">
            {faqs.map((f) => (
              <details key={f.q} className="group p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown
                    size={20}
                    className="shrink-0 text-[#087f8c] transition group-open:rotate-180"
                  />
                </summary>
                <p className="mt-3 text-sm leading-7 text-[#5a7183]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 pb-20 md:px-10">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#087f8c] via-[#0a93a0] to-[#0a6f86] px-7 py-16 text-center text-white md:px-16 md:py-20">
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full border border-white/15" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full border border-white/15" />
            <h2
              className={`${display.className} relative text-3xl font-extrabold md:text-5xl`}
            >
              Your journey deserves a better backup plan.
            </h2>
            <p className="relative mx-auto mt-5 max-w-xl leading-8 text-white/85">
              Try Airtur and see how AI can help you handle unexpected travel
              disruptions.
            </p>
            <Link
              href="/"
              className="group relative mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-[#087f8c] shadow-lg transition hover:bg-[#e8f7f6]"
            >
              Launch Airtur
              <ArrowRight
                size={18}
                className="transition group-hover:translate-x-1"
              />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e1e9ed] bg-white px-5 py-8 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center text-sm text-[#5a7183] md:flex-row">
          <span
            className={`${display.className} text-lg font-extrabold text-[#0d2638]`}
          >
            airtur.
          </span>
          <span>Flight disrupted? Know your next move.</span>
          <span className="flex items-center gap-2">
            <ShieldCheck size={16} />
            AI guidance, not confirmed bookings
          </span>
        </div>
      </footer>
    </div>
  );
}
