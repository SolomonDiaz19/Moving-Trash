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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token") || "";
    const action = (searchParams.get("action") || "approve").toLowerCase();

    const secret = process.env.APPROVE_TOKEN_SECRET;
    if (!secret) throw new Error("Missing APPROVE_TOKEN_SECRET");

    const payload = verifyBookingToken(token, secret);
    if (!payload) {
      return redirectTo(req, "invalid");
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) throw new Error("Missing RESEND_API_KEY");

    const resend = new Resend(resendKey);

    const auth = getAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const rangeText = formatRange(payload.startISO, payload.endISO);

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
        // if it was already deleted, we still proceed with a safe redirect
      }

      // Idempotent decline: if already deleted, delete call can throw; we treat as "declined"
      try {
        await calendar.events.delete({
          calendarId: payload.calId,
          eventId: payload.eventId,
        });
      } catch {
        // ignore — already declined/deleted
      }

      // Send decline email (idempotent-ish: will resend if link is clicked again)
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: payload.customerEmail,
        subject: "Dumpster request update",
        html: `
          <p>Hi ${payload.customerName},</p>
          <p>Your dumpster request could not be confirmed for:</p>
          <p><b>${rangeText}</b></p>
          <p>Please reply with alternate dates and we’ll help you schedule.</p>
        `,
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

    // ✅ Idempotent approve: if it already looks confirmed, do NOT patch or re-email
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

      const result2 = await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: payload.customerEmail,
        subject: "Your dumpster request is approved ✅",
        html: `
          <p>Hi ${payload.customerName},</p>
          <p>Your dumpster request has been <b>approved</b> for:</p>
          <p><b>${rangeText}</b></p>
          <p>If anything changes, reply to this email or call us.</p>
        `,
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
