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

/**
 * Format date range for humans.
 * Your calendar endDateOnly is exclusive for all-day events,
 * so we display inclusive end = endDateOnly - 1 day.
 */
function formatRangeDateOnly(startDateOnly: string, endDateOnlyExclusive: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(startDateOnly) && /^\d{4}-\d{2}-\d{2}$/.test(endDateOnlyExclusive)) {
    const endD = new Date(`${endDateOnlyExclusive}T00:00:00.000Z`);
    if (!Number.isNaN(endD.getTime())) {
      endD.setUTCDate(endD.getUTCDate() - 1);
      const inclusiveEnd = endD.toISOString().slice(0, 10);
      return `${startDateOnly} to ${inclusiveEnd}`;
    }
  }
  return `${startDateOnly} to ${endDateOnlyExclusive}`;
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

/**
 * Simple, consistent email wrapper.
 * (Keeps emails professional without needing React email templates.)
 */
function emailLayout(opts: { title: string; intro: string; detailsHtml: string; footer?: string }) {
  const footer =
    opts.footer ??
    `If you have urgent questions, call or text us at (469) 716-3877.`;

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #111827;">
    <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
      <div style="border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden;">
        <div style="padding: 18px 20px; background: #ffffff; border-bottom: 1px solid #e5e7eb;">
          <div style="font-size: 16px; font-weight: 700; color: #111827;">BBA Waste Hauling Services</div>
        </div>

        <div style="padding: 20px;">
          <div style="font-size: 18px; font-weight: 700; margin-bottom: 10px;">${opts.title}</div>
          <div style="margin: 0 0 14px 0; color: #374151;">${opts.intro}</div>

          <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 16px; background: #ffffff;">
            ${opts.detailsHtml}
          </div>

          <div style="margin-top: 16px; color: #374151;">${footer}</div>
          <div style="margin-top: 18px; color: #6b7280; font-size: 12px;">
            Please reply to this email if you need to make changes.
          </div>
        </div>
      </div>

      <div style="margin-top: 16px; color: #6b7280; font-size: 12px;">
        BBA Waste Hauling Services • Dallas–Fort Worth Metroplex
      </div>
    </div>
  </div>
  `;
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
        { ok: false, error: "Please wait a few minutes and try again." },
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

    // ✅ Include useful fields in the token so the approve route can show them (optional-safe)
    const token = signBookingToken(
      {
        calId,
        eventId,
        customerEmail: email,
        customerName: name,
        startISO,
        endISO,
        // extras (for email display / approve page details)
        size,
        phone,
        address,
        notes,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      } as any,
      secret
    );

    const siteUrl = requireEnv("SITE_URL");
    const approveUrl = `${siteUrl}/api/approve?token=${encodeURIComponent(token)}`;
    const declineUrl = `${siteUrl}/api/approve?token=${encodeURIComponent(token)}&action=decline`;

    const resendKey = requireEnv("RESEND_API_KEY");
    const emailFrom = requireEnv("EMAIL_FROM");
    const ownerEmail = requireEnv("OWNER_NOTIFY_EMAIL");
    const resend = new Resend(resendKey);

    const dateRangeText = formatRangeDateOnly(startDateOnly, endDateOnly);

    // ---------------- Owner Email (Professional) ----------------
    const ownerDetailsHtml = `
      <div style="margin: 0; padding: 0; color: #111827;">
        <div><b>Customer:</b> ${name}</div>
        <div style="margin-top: 6px;"><b>Phone:</b> ${phone}</div>
        <div style="margin-top: 6px;"><b>Email:</b> ${email}</div>
        <div style="margin-top: 6px;"><b>Dumpster Size:</b> ${size}</div>
        <div style="margin-top: 6px;"><b>Requested Dates:</b> ${dateRangeText}</div>
        <div style="margin-top: 6px;"><b>Duration:</b> ${durationDays} day(s)${
          durationDays > 7 ? ` • <b>Overage:</b> $10 flat (over 7 days)` : ""
        }</div>
        ${
          address
            ? `<div style="margin-top: 6px;"><b>Service Address:</b> ${address}</div>`
            : `<div style="margin-top: 6px;"><b>Service Address:</b> (not provided)</div>`
        }
        ${notes ? `<div style="margin-top: 6px;"><b>Notes:</b> ${notes}</div>` : ""}
        <div style="margin-top: 14px;">
          <a href="${approveUrl}" style="display:inline-block; padding:10px 14px; background:#dc2626; color:#ffffff; text-decoration:none; border-radius:10px; font-weight:700;">
            ✅ Approve
          </a>
          <span style="display:inline-block; width:10px;"></span>
          <a href="${declineUrl}" style="display:inline-block; padding:10px 14px; border:1px solid #111827; color:#111827; text-decoration:none; border-radius:10px; font-weight:700;">
            ❌ Decline
          </a>
        </div>
      </div>
    `;

    const ownerHtml = emailLayout({
      title: "New Dumpster Rental Request",
      intro: "A new request was submitted on the website. Review details below and approve or decline.",
      detailsHtml: ownerDetailsHtml,
      footer: "Tip: If the service address is missing or incomplete, reply to request clarification before approving.",
    });

    await resend.emails.send({
      from: emailFrom,
      to: ownerEmail,
      subject: `New Dumpster Request — ${size} — ${name}`,
      html: ownerHtml,
    });

    // ---------------- Customer ACK Email (Professional + Address Clarification) ----------------
    let customerAckSent = false;
    try {
      const customerDetailsHtml = `
        <div style="margin: 0; padding: 0; color: #111827;">
          <div><b>Dumpster Size:</b> ${size}</div>
          <div style="margin-top: 6px;"><b>Requested Dates:</b> ${dateRangeText}</div>
          <div style="margin-top: 6px;"><b>Duration:</b> ${durationDays} day(s)${
            durationDays > 7 ? ` • <b>Overage:</b> $10 flat (over 7 days)` : ""
          }</div>
          ${
            address
              ? `<div style="margin-top: 6px;"><b>Service Address:</b> ${address}</div>`
              : `<div style="margin-top: 6px;"><b>Service Address:</b> (not provided)</div>`
          }
        </div>
      `;

      const customerHtml = emailLayout({
        title: "Request Received",
        intro:
          "Thank you for contacting BBA Waste Hauling Services. We’ve received your request and will review availability shortly.",
        detailsHtml: customerDetailsHtml,
        footer:
          "Please note: the service address should be the exact delivery location (street address), not just the city. We’ll email you once your request is approved or if we need additional information.",
      });

      await resend.emails.send({
        from: emailFrom,
        to: email,
        subject: "BBA Waste Hauling — Request Received",
        html: customerHtml,
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
