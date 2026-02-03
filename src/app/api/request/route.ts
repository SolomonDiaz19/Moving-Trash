import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Resend } from "resend";
import { signBookingToken } from "@/lib/bookingToken";
import { bookingRequestSchema } from "@/lib/validation";

import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

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

function toDateOnly(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${value}`);
  return d.toISOString().slice(0, 10);
}

function addDaysDateOnly(dateOnly: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) throw new Error(`Invalid dateOnly: ${dateOnly}`);
  const d = new Date(`${dateOnly}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

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

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

function isAllowedDuration(durationDays: number) {
  return durationDays === 7 || (durationDays >= 8 && durationDays <= 14);
}

/** ---------------- Rate Limit ---------------- **/

// 10 requests per 15 minutes per IP
const rateLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, "15 m"),
  analytics: true,
});

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** ---------------- Handler ---------------- **/

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

    // 3) Rate limit by IP (after honeypot, before heavy work)
    const ip = getClientIp(req);
    const { success, limit, remaining, reset } = await rateLimiter.limit(`request:${ip}`);

    if (!success) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
          },
        }
      );
    }

    // 4) Zod validation (server-side)
    const parsed = bookingRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 5) Normalize size
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

    if (!isAllowedDuration(durationDays)) {
      return NextResponse.json(
        { ok: false, error: "Invalid durationDays. Allowed: 7, or 8–14." },
        { status: 400 }
      );
    }

    // booking horizon
    const today = todayInTimeZone("America/Chicago");
    const maxStart = addDaysDateOnly(today, MAX_ADVANCE_DAYS);
    if (startDateOnly > maxStart) {
      return NextResponse.json(
        { ok: false, error: `Start date too far in advance. Max is ${MAX_ADVANCE_DAYS} days.` },
        { status: 400 }
      );
    }

    // rental window [start, end)
    const endDateOnly = addDaysDateOnly(startDateOnly, durationDays);

    const calId = getCalendarId(size);
    if (!calId) throw new Error(`Missing calendar env var for size: ${size}`);

    const cap = inventoryCaps[size];

    const auth = getAuth();
    const calendar = google.calendar({ version: "v3", auth });

    // overlap buffer
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

    // Create REQUEST event
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
      { ok: false, error: "Server error", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}
