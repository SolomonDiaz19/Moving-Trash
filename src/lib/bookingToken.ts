import crypto from "crypto";

type TokenPayload = {
  calId: string;
  eventId: string;
  customerEmail: string;
  customerName: string;
  startISO: string;
  endISO: string;
  exp: number; // unix seconds
};

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function signBookingToken(payload: TokenPayload, secret: string) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac("sha256", secret).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyBookingToken(token: string, secret: string): TokenPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = b64url(crypto.createHmac("sha256", secret).update(body).digest());
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  const payload = JSON.parse(Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
  if (!payload?.exp || Date.now() / 1000 > payload.exp) return null;

  return payload as TokenPayload;
}
