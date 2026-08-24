// Stateless signed session tokens. HMAC-SHA256, no dependency, no table.
//
//   <payload-base64url>.<signature-base64url>
//
// The payload is readable by anyone holding the token — never put a password
// or anything secret in it. The signature is what makes it unforgeable.

import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SEC = 60 * 60 * 24 * 30; // 30 days

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

function sign(payloadB64, secret) {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

export function createSession(claims, secret, ttlSec = DEFAULT_TTL_SEC) {
  if (!secret) throw new Error("createSession: SESSION_SECRET is not set");
  const payload = {
    ...claims,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSec,
  };
  const payloadB64 = b64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

export function readSession(token, secret) {
  if (typeof token !== "string" || !secret) return null;

  const dot = token.indexOf(".");
  if (dot < 1) return null;

  const payloadB64 = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);
  const expectedSig = sign(payloadB64, secret);

  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let claims;
  try {
    claims = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof claims.exp !== "number" || claims.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return claims;
}
