import { NextRequest, NextResponse } from "next/server";

type Endpoint = {
  airport?: string;
  iata?: string;
  terminal?: string | null;
  gate?: string | null;
  baggage?: string | null;
  scheduled?: string;
  estimated?: string;
  actual?: string;
  delay?: number | null;
};

type AviationFlight = {
  flight_date?: string;
  flight_status?: string;
  airline?: { name?: string };
  flight?: {
    iata?: string;
    codeshared?: unknown;
  };
  departure?: Endpoint;
  arrival?: Endpoint;
};

type AviationResponse = {
  data?: AviationFlight[];
  error?: {
    code?: string;
    message?: string;
  };
};

type FlightStatus =
  | "Scheduled"
  | "On time"
  | "Delayed"
  | "Rescheduled"
  | "Cancelled"
  | "Departed"
  | "Landed"
  | "Unknown";

type SourceReport = {
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

const DELAY_THRESHOLD_MINUTES = 15;

const BASE_URL = (
  process.env.AVIATIONSTACK_BASE_URL || "https://api.aviationstack.com/v1"
).replace(/\/+$/, "");

function displayTime(value?: string | null) {
  if (!value) return "Unknown";
  return value.replace("T", " ").slice(0, 16);
}

function minutesBetween(from?: string, to?: string): number | null {
  if (!from || !to) return null;

  // Only compare timestamps that include explicit timezone
  // information. Otherwise, local timezone assumptions could
  // create an incorrect delay calculation.
  const hasTimezone = (value: string) => /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);

  if (!hasTimezone(from) || !hasTimezone(to)) {
    return null;
  }

  const start = Date.parse(from);
  const end = Date.parse(to);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }

  return Math.round((end - start) / 60000);
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function normalizeStatus(
  rawStatus: string,
  delayMinutes: number | null,
  hasUpdatedDeparture: boolean,
): FlightStatus {
  const raw = rawStatus.trim().toLowerCase();

  if (raw === "cancelled" || raw === "canceled") {
    return "Cancelled";
  }

  if (raw === "landed") return "Landed";

  if (raw === "active" || raw === "departed") {
    return "Departed";
  }

  if (raw === "rescheduled") {
    return "Rescheduled";
  }

  if (
    raw === "delayed" ||
    (delayMinutes !== null && delayMinutes >= DELAY_THRESHOLD_MINUTES)
  ) {
    return "Delayed";
  }

  if (raw === "scheduled") {
    // A scheduled flight is not necessarily confirmed
    // to be on time.
    return "Scheduled";
  }

  if (raw === "on_time" || raw === "on-time" || raw === "on time") {
    return "On time";
  }

  // An updated time alone does not establish punctuality.
  void hasUpdatedDeparture;

  return "Unknown";
}

function providerErrorMessage(code?: string): {
  message: string;
  status: number;
} {
  switch (code) {
    case "usage_limit_reached":
      return {
        message: "The flight data quota for this month has been used up.",
        status: 429,
      };

    case "rate_limit_reached":
      return {
        message: "Too many flight lookups right now. Please try again shortly.",
        status: 429,
      };

    case "https_access_restricted":
      return {
        message:
          "The Aviationstack plan does not support HTTPS requests. Check your API plan and server configuration.",
        status: 502,
      };

    case "function_access_restricted":
      return {
        message: "The current flight data plan does not support this lookup.",
        status: 502,
      };

    case "invalid_access_key":
    case "missing_access_key":
      return {
        message: "Flight data API credentials are invalid or missing.",
        status: 503,
      };

    default:
      return {
        message: "The flight provider could not complete this lookup.",
        status: 502,
      };
  }
}

export async function GET(request: NextRequest) {
  const key = process.env.AVIATIONSTACK_API_KEY;

  if (!key) {
    return NextResponse.json(
      { error: "Flight data API key is not configured." },
      { status: 503 },
    );
  }

  const number = (request.nextUrl.searchParams.get("number") || "")
    .replace(/\s+/g, "")
    .toUpperCase();

  const date = request.nextUrl.searchParams.get("date") || "";

  if (!/^[A-Z0-9]{2,3}\d{1,5}[A-Z]?$/.test(number) || !validDate(date)) {
    return NextResponse.json(
      { error: "Enter a valid flight number and date." },
      { status: 400 },
    );
  }

  try {
    async function query(includeDate: boolean) {
      const url = new URL(`${BASE_URL}/flights`);

      url.searchParams.set("access_key", key as string);
      url.searchParams.set("flight_iata", number);
      url.searchParams.set("limit", "20");

      if (includeDate) {
        url.searchParams.set("flight_date", date);
      }

      const response = await fetch(url.toString(), {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(15000),
      });

      const text = await response.text();

      let data: AviationResponse;

      try {
        data = JSON.parse(text) as AviationResponse;
      } catch {
        throw new Error("Aviationstack returned an invalid JSON response.");
      }

      return { response, data };
    }

    let { response, data } = await query(true);

    let dateFilterUnavailable = false;

    if (data.error?.code === "function_access_restricted") {
      dateFilterUnavailable = true;

      ({ response, data } = await query(false));
    }

    if (!response.ok || data.error) {
      console.error("Aviationstack error", {
        status: response.status,
        code: data.error?.code,
      });

      const mapped = providerErrorMessage(data.error?.code);

      return NextResponse.json(
        { error: mapped.message },
        { status: mapped.status },
      );
    }

    const candidates = (data.data ?? []).filter(
      (item) =>
        item.flight?.iata?.replace(/\s+/g, "").toUpperCase() === number &&
        item.flight_date === date,
    );

    const match =
      candidates.find((item) => !item.flight?.codeshared) ?? candidates[0];

    if (!match) {
      return NextResponse.json({
        found: false,
        message: dateFilterUnavailable
          ? "This provider plan could not search the requested date directly. No matching record was returned. This does not mean the flight does not exist."
          : "No matching flight record was returned for this date. This does not mean the flight does not exist.",
        verification: {
          status: "unverified",
          officialAirlineChecked: false,
          sourceCount: 0,
          conflictDetected: false,
          message:
            "Airtur could not verify this flight using the currently connected provider.",
          reports: [],
        },
      });
    }

    const dep = match.departure;
    const arr = match.arrival;

    const rawStatus = (match.flight_status || "").toLowerCase();

    const reportedDelay =
      typeof dep?.delay === "number" &&
      Number.isFinite(dep.delay) &&
      dep.delay >= 0
        ? dep.delay
        : null;

    const calculatedDelay = minutesBetween(
      dep?.scheduled,
      dep?.estimated || dep?.actual,
    );

    const delayMinutes = reportedDelay ?? calculatedDelay;

    const status = normalizeStatus(
      rawStatus,
      delayMinutes,
      Boolean(dep?.estimated || dep?.actual),
    );

    const retrievedAt = new Date().toISOString();

    const sourceReport: SourceReport = {
      provider: "Aviationstack",
      sourceType: "third_party",
      flightNumber: number,
      departureDate: date,
      origin: dep?.iata || null,
      destination: arr?.iata || null,
      status,
      rawStatus: rawStatus || "unknown",
      scheduledDeparture: dep?.scheduled || null,
      updatedDeparture: dep?.estimated || dep?.actual || null,
      delayMinutes,
      retrievedAt,
      providerUpdatedAt: null,
      official: false,
      url: null,
    };

    return NextResponse.json({
      found: true,

      flight: {
        airline: match.airline?.name || "Unknown airline",
        number,
        from: `${dep?.airport || "Unknown"} (${dep?.iata || "—"})`,
        to: `${arr?.airport || "Unknown"} (${arr?.iata || "—"})`,
        date,
        scheduled: displayTime(dep?.scheduled),
        updated: displayTime(dep?.estimated || dep?.actual || dep?.scheduled),
        status,
        delayMinutes,
        terminal: dep?.terminal || null,
        gate: dep?.gate || null,
        arrivalScheduled: displayTime(arr?.scheduled),
        arrivalEstimated: displayTime(arr?.estimated || arr?.scheduled),
        reason: "The cause has not been confirmed by the connected provider.",
        dataSource: "aviationstack",
        retrievedAt,
        // Kept for compatibility with existing UI.
        // This is retrieval time, NOT verification time.
        verifiedAt: retrievedAt,
        providerStatus: rawStatus || "unknown",
      },

      verification: {
        status: "single_source",
        officialAirlineChecked: false,
        sourceCount: 1,
        conflictDetected: false,
        conflictCheckPerformed: false,
        message:
          "Flight information was retrieved from Aviationstack. Airtur has not independently verified it against the operating airline or another provider.",
        recommendation:
          "Confirm important flight changes with the operating airline before making costly or time-sensitive decisions.",
        reports: [sourceReport],
      },
    });
  } catch (error) {
    console.error(
      "Flight lookup error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      {
        error: "Flight lookup is temporarily unavailable.",
      },
      { status: 503 },
    );
  }
}
