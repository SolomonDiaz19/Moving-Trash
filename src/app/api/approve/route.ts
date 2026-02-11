import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Resend } from "resend";
import { verifyBookingToken } from "@/lib/bookingToken";

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
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
}

function formatRange(startISO: string, endISO: string) {
  const start = toDateOnly(startISO);
  const end = toDateOnly(endISO);

  // Display inclusive end = endDate - 1 day (end is exclusive for all-day events)
  if (/^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end)) {
    const endD = new Date(`${end}T00:00:00.000Z`);
    if (!Number.isNaN(endD.getTime())) {
      endD.setUTCDate(endD.getUTCDate() - 1);
      const inclusiveEnd = endD.toISOString().slice(0, 10);
      return `${start} to ${inclusiveEnd}`;
    }
  }
  return `${start} to ${end}`;
}

function replaceStatus(description: string, nextStatus: "CONFIRMED" | "DECLINED") {
  const desc = description ?? "";
  if (/Status:\s*REQUEST/i.test(desc)) {
    return desc.replace(/Status:\s*REQUEST/gi, `Status: ${nextStatus}`);
  }
  if (/Status:\s*CONFIRMED/i.test(desc) || /Status:\s*DECLINED/i.test(desc)) {
    return desc.replace(/Status:\s*(CONFIRMED|DECLINED)/gi, `Status: ${nextStatus}`);
  }
  return `${desc}\nStatus: ${nextStatus}`.trim();
}

function parseSizeFromSummary(summary: string) {
  // "REQUEST – 20 Yard – Name" or "CONFIRMED – 30 Yard – Name"
  const s = String(summary || "");
  const match = s.match(/\b(20 Yard|30 Yard|40 Yard)\b/i);
  return match ? match[1] : "";
}

function redirectTo(
  req: Request,
  status: "approved" | "declined" | "invalid" | "error",
  details?: { name?: string; size?: string; range?: string }
) {
  const url = new URL("/approve", req.url);
  url.searchParams.set("status", status);
  if (details?.name) url.searchParams.set("name", details.name);
  if (details?.size) url.searchParams.set("size", details.size);
  if (details?.range) url.searchParams.set("range", details.range);
  return NextResponse.redirect(url);
}

/**
 * Minimal HTML template for consistent, professional emails.
 * (Keeps it simple but clean.)
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token") || "";
    const action = (searchParams.get("action") || "approve").toLowerCase();

    const secret = process.env.APPROVE_TOKEN_SECRET;
    if (!secret) throw new Error("Missing APPROVE_TOKEN_SECRET");

    const payload: any = verifyBookingToken(token, secret);
    if (!payload) {
      return redirectTo(req, "invalid");
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) throw new Error("Missing RESEND_API_KEY");

    const resend = new Resend(resendKey);

    const from = process.env.EMAIL_FROM;
    if (!from) throw new Error("Missing EMAIL_FROM");

    const auth = getAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const rangeText = formatRange(payload.startISO, payload.endISO);

    // Optional address if your booking token includes it
    // (If your token uses a different key, adjust here.)
    const address =
      payload.address ||
      payload.serviceAddress ||
      payload.location ||
      "";

    const detailsHtml = (sizeText: string) => `
      <div style="margin: 0; padding: 0; color: #111827;">
        <div><b>Customer:</b> ${payload.customerName}</div>
        ${sizeText ? `<div style="margin-top: 6px;"><b>Dumpster:</b> ${sizeText}</div>` : ""}
        <div style="margin-top: 6px;"><b>Dates:</b> ${rangeText}</div>
        ${address ? `<div style="margin-top: 6px;"><b>Service Address:</b> ${address}</div>` : ""}
      </div>
    `;

    // --- DECLINE ---
    if (action === "decline") {
      // Fetch event first so we can show details on the /approve page even after delete
      let size = "";
      try {
        const ev = await calendar.events.get({
          calendarId: payload.calId,
          eventId: payload.eventId,
        });
        size = parseSizeFromSummary(ev.data.summary || "");
      } catch {
        // ignore
      }

      // Idempotent decline: if already deleted, delete call can throw; treat as declined
      try {
        await calendar.events.delete({
          calendarId: payload.calId,
          eventId: payload.eventId,
        });
      } catch {
        // ignore
      }

      // Professional decline email
      const declineHtml = emailLayout({
        title: "Request Update",
        intro:
          `Thanks for your request. Unfortunately, we’re unable to accommodate the dates you selected at this time.`,
        detailsHtml: detailsHtml(size),
        footer:
          `Reply with alternate dates and we’ll do our best to help you schedule.`,
      });

      const result = await resend.emails.send({
        from,
        to: payload.customerEmail,
        subject: "BBA Waste Hauling — Request Update",
        html: declineHtml,
      });

      console.log("RESEND DECLINE EMAIL RESULT:", result);

      return redirectTo(req, "declined", {
        name: payload.customerName,
        size,
        range: rangeText,
      });
    }

    // --- APPROVE ---
    const ev = await calendar.events.get({
      calendarId: payload.calId,
      eventId: payload.eventId,
    });

    const currentSummary = ev.data.summary || "";
    const currentDesc = ev.data.description || "";

    const size = parseSizeFromSummary(currentSummary);

    // Idempotent approve: if it already looks confirmed, do NOT patch or re-email
    const alreadyConfirmed =
      currentSummary.toUpperCase().startsWith("CONFIRMED") ||
      /Status:\s*CONFIRMED/i.test(currentDesc);

    if (!alreadyConfirmed) {
      const nextSummary = currentSummary.replace(/^REQUEST\s*[–-]\s*/i, "CONFIRMED – ");
      const nextDesc = replaceStatus(currentDesc, "CONFIRMED");

      await calendar.events.patch({
        calendarId: payload.calId,
        eventId: payload.eventId,
        requestBody: {
          summary: nextSummary,
          description: nextDesc,
        },
      });

      const approveHtml = emailLayout({
        title: "Booking Confirmed",
        intro: `Great news — your dumpster rental request has been approved and scheduled.`,
        detailsHtml: detailsHtml(size),
        footer:
          `Please ensure clear access at the service address for delivery and pickup. If you need to make changes, reply to this email or call/text (469) 716-3877.`,
      });

      const result2 = await resend.emails.send({
        from,
        to: payload.customerEmail,
        subject: "BBA Waste Hauling — Booking Confirmed",
        html: approveHtml,
      });

      console.log("RESEND APPROVE EMAIL RESULT:", result2);
    } else {
      console.log("Approve link clicked again: already CONFIRMED, skipping patch/email.");
    }

    return redirectTo(req, "approved", {
      name: payload.customerName,
      size,
      range: rangeText,
    });
  } catch (err: any) {
    console.error("APPROVE ROUTE ERROR:", err);
    return redirectTo(req, "error");
  }
}
