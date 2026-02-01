import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Resend } from "resend";
import { signBookingToken } from "@/lib/bookingToken";
import { bookingRequestSchema } from "@/lib/validation";

type Size = "20 Yard" | "30 Yard" | "40 Yard";

const inventoryCaps: Record<Size, number> = {
  "20 Yard": 1,
  "30 Yard": 2,
  "40 Yard": 2,
};

// Booking policy caps
const MAX_DURATION_DAYS = 14; // used for overlap query buffer + validation
const MAX_ADVANCE_DAYS = 90; // 3 months

function todayInTimeZone(tz = "America/Chicago") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}


function normalizeSize(input: any): Size | null {
  // Accept "20", "20 Yard", 20, etc.
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

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

/**
 * Convert anything like:
 * - "2026-02-01" -> "2026-02-01"
 * - ISO "2026-02-01T00:00:00.000Z" -> "2026-02-01"
 */
function toDateOnly(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${value}`);
  // Use UTC date component to avoid local timezone shifting.
  return d.toISOString().slice(0, 10);
}

/**
 * Add N days to a YYYY-MM-DD date string and return YYYY-MM-DD.
 */
function addDaysDateOnly(dateOnly: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) throw new Error(`Invalid dateOnly: ${dateOnly}`);
  const d = new Date(`${dateOnly}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Count only relevant holds:
 * - ignore cancelled events
 * - count events with Status: REQUEST / CONFIRMED in description,
 *   or summary starting with REQUEST/CONFIRMED
 */
function isCountedBookingEvent(ev: any) {
  if (!ev) return false;
  if (ev.status === "cancelled") return false;

  const summary = String(ev.summary ?? "");
  const desc = String(ev.description ?? "");
  const text = `${summary}\n${desc}`.toUpperCase();

  return (
    text.includes("STATUS: REQUEST") ||
    text.includes("STATUS: CONFIRMED") ||
    summary.toUpperCase().startsWith("REQUEST") ||
    summary.toUpperCase().startsWith("CONFIRMED")
  );
}

/**
 * Extract a date-only [start, end) range from a Google Calendar event.
 * - For all-day events, ev.start.date and ev.end.date are YYYY-MM-DD, and end is EXCLUSIVE.
 * - For timed events, normalize to date-only via toDateOnly(dateTime) (still treated as [start, end)).
 */
function eventToRangeDateOnly(ev: any): { start: string; end: string } | null {
  if (!ev?.start || !ev?.end) return null;

  const start =
    typeof ev.start.date === "string"
      ? ev.start.date
      : typeof ev.start.dateTime === "string"
      ? toDateOnly(ev.start.dateTime)
      : null;

  const end =
    typeof ev.end.date === "string"
      ? ev.end.date
      : typeof ev.end.dateTime === "string"
      ? toDateOnly(ev.end.dateTime)
      : null;

  if (!start || !end) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return null;

  return { start, end }; // end is exclusive
}

/**
 * Overlap for date-only ranges using exclusive end.
 * Two ranges [aStart, aEnd) and [bStart, bEnd) overlap iff:
 *   aStart < bEnd AND bStart < aEnd
 */
function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

function isAllowedDuration(durationDays: number) {
  // Policy: 7 is standard; allow 8–14 as extended
  return durationDays === 7 || (durationDays >= 8 && durationDays <= 14);
}

export async function POST(req: Request) {
  try {
    // 1) Read JSON ONCE
    const raw = await req.json().catch(() => null);
    if (!raw) {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    // 2) Honeypot: pretend success (don’t tip off bots)
    if (raw.companyWebsite && String(raw.companyWebsite).trim() !== "") {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 3) Zod validation (server-side)
    const parsed = bookingRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Use validated data from here down
    const data = parsed.data;

    // 4) Normalize size (your existing helper)
    const size = normalizeSize(data.dumpsterSize);
    if (!size) {
      return NextResponse.json({ ok: false, error: "Invalid dumpster size." }, { status: 400 });
    }

    const name = data.name.trim();
    const phone = data.phone.trim();
    const email = data.email.trim().toLowerCase();
    const address = (data.address ?? "").trim();
    const notes = (data.notes ?? "").trim();

    const startDateOnly = toDateOnly(data.startDate);
    const durationDays = Number(data.durationDays);

    // Enforce your policy duration constraints (7 OR 8–14)
    if (!isAllowedDuration(durationDays)) {
      return NextResponse.json({ error: "Invalid durationDays. Allowed: 7, or 8–14." }, { status: 400 });
    }

    // Enforce booking horizon (3 months / 90 days)
    const today = todayInTimeZone("America/Chicago");
    const maxStart = addDaysDateOnly(today, MAX_ADVANCE_DAYS);
    if (startDateOnly > maxStart) {
      return NextResponse.json(
        { error: `Start date too far in advance. Max is ${MAX_ADVANCE_DAYS} days.` },
        { status: 400 }
      );
    }

    // Rental window for ALL-DAY events (end is exclusive)
    const endDateOnly = addDaysDateOnly(startDateOnly, durationDays);

    const calId = getCalendarId(size);
    if (!calId) throw new Error(`Missing calendar env var for size: ${size}`);

    const cap = inventoryCaps[size];

    const auth = getAuth();
    const calendar = google.calendar({ version: "v3", auth });

    // Overlap query buffer
    const bufferedStartDateOnly = addDaysDateOnly(startDateOnly, -MAX_DURATION_DAYS);

    const list = await calendar.events.list({
      calendarId: calId,
      timeMin: `${bufferedStartDateOnly}T00:00:00.000Z`,
      timeMax: `${endDateOnly}T00:00:00.000Z`,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
    });

    const overlapping = (list.data.items ?? [])
      .filter(isCountedBookingEvent)
      .filter((ev) => {
        const r = eventToRangeDateOnly(ev);
        if (!r) return false;
        return rangesOverlap(r.start, r.end, startDateOnly, endDateOnly);
      }).length;

    if (overlapping >= cap) {
      return NextResponse.json({ ok: true, available: false }, { status: 200 });
    }

    // Create REQUEST event (ALL-DAY)
    const summary = `REQUEST – ${size} – ${name}`;
    const created = await calendar.events.insert({
      calendarId: calId,
      requestBody: {
        summary,
        start: { date: startDateOnly },
        end: { date: endDateOnly },
        description: [
          `Status: REQUEST`,
          `Name: ${name}`,
          `Phone: ${phone}`,
          `Email: ${email}`,
          ...(address ? [`Address: ${address}`] : []),
          ...(notes ? [`Notes: ${notes}`] : []),
          `Size: ${size}`,
          `Start: ${startDateOnly}`,
          `End: ${endDateOnly}`,
          `DurationDays: ${durationDays}`,
          ...(durationDays > 7 ? [`OverageFee: $10 (flat)`] : []),
        ].join("\n"),
      },
    });

    const eventId = created.data.id;
    if (!eventId) throw new Error("Google Calendar did not return an event id.");

    const secret = requireEnv("APPROVE_TOKEN_SECRET");

    // Token payload expects ISO boundaries
    const startISO = `${startDateOnly}T00:00:00.000Z`;
    const endISO = `${endDateOnly}T00:00:00.000Z`;

    const token = signBookingToken(
      {
        calId,
        eventId,
        customerEmail: email,
        customerName: name,
        startISO,
        endISO,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      secret
    );

    const siteUrl = requireEnv("SITE_URL");
    const approveUrl = `${siteUrl}/api/approve?token=${encodeURIComponent(token)}`;
    const declineUrl = `${siteUrl}/api/approve?token=${encodeURIComponent(token)}&action=decline`;

    // Email owner (+ customer ack)
    const resendKey = requireEnv("RESEND_API_KEY");
    const emailFrom = requireEnv("EMAIL_FROM");
    const ownerEmail = requireEnv("OWNER_NOTIFY_EMAIL");
    const resend = new Resend(resendKey);

    await resend.emails.send({
      from: emailFrom,
      to: ownerEmail,
      subject: `New REQUEST: ${size} (${name})`,
      html: `
        <p><b>New booking request</b></p>
        <p><b>Size:</b> ${size}</p>
        <p><b>Name:</b> ${name}<br/>
           <b>Phone:</b> ${phone}<br/>
           <b>Email:</b> ${email}</p>
        ${address ? `<p><b>Address:</b> ${address}</p>` : ""}
        ${notes ? `<p><b>Notes:</b> ${notes}</p>` : ""}
        <p><b>Start:</b> ${startDateOnly}<br/>
           <b>End:</b> ${endDateOnly}<br/>
           <b>Duration:</b> ${durationDays} day(s)
           ${durationDays > 7 ? `<br/><b>Overage:</b> $10 flat (over 7 days)` : ""}
        </p>
        <p>
          <a href="${approveUrl}">✅ Approve</a>
          &nbsp; | &nbsp;
          <a href="${declineUrl}">❌ Decline</a>
        </p>
      `,
    });

    // Best-effort: customer acknowledgement email
    let customerAckSent = false;
    try {
      await resend.emails.send({
        from: emailFrom,
        to: email,
        subject: "We received your dumpster request ✅",
        html: `
          <p>Hi ${name},</p>
          <p>We received your dumpster request and will review it shortly.</p>
          <p><b>Dumpster:</b> ${size}<br/>
             <b>Dates:</b> ${startDateOnly} to ${endDateOnly}<br/>
             <b>Duration:</b> ${durationDays} day(s)
             ${durationDays > 7 ? `<br/><b>Overage:</b> $10 flat fee (over 7 days)` : ""}
          </p>
          ${address ? `<p><b>Address:</b> ${address}</p>` : ""}
          <p>If we need any clarification, we’ll reach out using the phone/email you provided.</p>
        `,
      });
      customerAckSent = true;
    } catch (e) {
      console.error("Customer ACK email failed", e);
    }

    return NextResponse.json(
      { ok: true, available: true, eventId, start: startDateOnly, end: endDateOnly, customerAckSent },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}
