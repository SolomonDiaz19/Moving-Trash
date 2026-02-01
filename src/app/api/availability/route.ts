import { NextResponse } from "next/server";
import { google } from "googleapis";

/**
 * Dumpster inventory caps (concurrent rentals)
 */
type Size = "20 Yard" | "30 Yard" | "40 Yard";

const inventoryCaps: Record<Size, number> = {
  "20 Yard": 1,
  "30 Yard": 2,
  "40 Yard": 2,
};

/**
 * Booking policy
 */
const MAX_DURATION_DAYS = 14; // buffer + validation
const MAX_ADVANCE_DAYS = 90;  // 3 months

/**
 * Helpers
 */
function todayInTimeZone(tz = "America/Chicago") {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizeSize(input: any): Size | null {
  const s = String(input ?? "").trim();
  if (s === "20" || s === "20 Yard") return "20 Yard";
  if (s === "30" || s === "30 Yard") return "30 Yard";
  if (s === "40" || s === "40 Yard") return "40 Yard";
  return null;
}

function getCalendarId(size: Size) {
  if (size === "20 Yard") return process.env.GCAL_20_ID;
  if (size === "30 Yard") return process.env.GCAL_30_ID;
  return process.env.GCAL_40_ID;
}

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");

  const creds: any = JSON.parse(raw);

  return new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

function toDateOnly(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${value}`);
  return d.toISOString().slice(0, 10);
}

function addDaysDateOnly(dateOnly: string, days: number) {
  const d = new Date(`${dateOnly}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isAllowedDuration(durationDays: number) {
  return durationDays === 7 || (durationDays >= 8 && durationDays <= 14);
}

function isCountedBookingEvent(ev: any) {
  if (!ev || ev.status === "cancelled") return false;
  const text = `${ev.summary ?? ""}\n${ev.description ?? ""}`.toUpperCase();
  return (
    text.includes("STATUS: REQUEST") ||
    text.includes("STATUS: CONFIRMED") ||
    text.startsWith("REQUEST") ||
    text.startsWith("CONFIRMED")
  );
}

function eventToRangeDateOnly(ev: any): { start: string; end: string } | null {
  const start =
    ev.start?.date ??
    (ev.start?.dateTime ? toDateOnly(ev.start.dateTime) : null);

  const end =
    ev.end?.date ??
    (ev.end?.dateTime ? toDateOnly(ev.end.dateTime) : null);

  if (!start || !end) return null;
  return { start, end }; // end is exclusive
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * GET /api/availability
 * Query params:
 * - size=30 Yard
 * - duration=7 | 8–14
 * - days=90
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const size = normalizeSize(searchParams.get("size"));
    const durationDays = Number(searchParams.get("duration"));
    const days = Number(searchParams.get("days") ?? MAX_ADVANCE_DAYS);

    if (!size) {
      return NextResponse.json({ error: "Invalid or missing size" }, { status: 400 });
    }

    if (!isAllowedDuration(durationDays)) {
      return NextResponse.json(
        { error: "Invalid duration. Allowed: 7 or 8–14 days." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(days) || days <= 0 || days > MAX_ADVANCE_DAYS) {
      return NextResponse.json(
        { error: `Invalid days. Max allowed is ${MAX_ADVANCE_DAYS}.` },
        { status: 400 }
      );
    }

    const calId = getCalendarId(size);
    if (!calId) throw new Error("Missing calendar ID");

    const cap = inventoryCaps[size];

    const auth = getAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const today = todayInTimeZone("America/Chicago");
    const rangeEnd = addDaysDateOnly(today, days + durationDays);
    const bufferedStart = addDaysDateOnly(today, -MAX_DURATION_DAYS);

    const list = await calendar.events.list({
      calendarId: calId,
      timeMin: `${bufferedStart}T00:00:00.000Z`,
      timeMax: `${rangeEnd}T00:00:00.000Z`,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
    });

    const events = (list.data.items ?? []).filter(isCountedBookingEvent);

    const available: string[] = [];
    const unavailable: string[] = [];

    for (let i = 0; i < days; i++) {
      const start = addDaysDateOnly(today, i);
      const end = addDaysDateOnly(start, durationDays);

      let overlapping = 0;

      for (const ev of events) {
        const r = eventToRangeDateOnly(ev);
        if (!r) continue;
        if (rangesOverlap(r.start, r.end, start, end)) {
          overlapping++;
          if (overlapping >= cap) break;
        }
      }

      if (overlapping < cap) {
        available.push(start);
      } else {
        unavailable.push(start);
      }
    }

    return NextResponse.json({
      size,
      durationDays,
      days,
      available,
      unavailable,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}
