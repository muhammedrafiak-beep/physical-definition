// POST /api/admin-login   { username, password }
//
// Replaces the hardcoded `const ADMIN = { u, p }` that shipped inside the
// browser bundle — anyone who opened devtools could read the trainer's
// password straight out of the JavaScript.
//
// Required environment variables:
//   ADMIN_USERNAME   your admin login name
//   ADMIN_PASSWORD   your admin password (server-only, never VITE_-prefixed)
//   SESSION_SECRET   already set for client-login; reused here

import { safeEqual, missingEnv } from "./_lib/admin.js";
import { createSession } from "./_lib/session.js";
import { checkLimit, recordHit, bucket, clientIp, tooMany, limiterDb } from "./_lib/ratelimit.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const missing = missingEnv(["ADMIN_USERNAME", "ADMIN_PASSWORD", "SESSION_SECRET"]);
  if (missing.length) {
    console.error("admin-login: missing env vars:", missing.join(", "));
    return res.status(500).json({
      error: `Server is not configured — missing: ${missing.join(", ")}`,
    });
  }

  const body = typeof req.body === "string" ? safeJson(req.body) : req.body;
  const username = String(body?.username ?? "");
  const password = String(body?.password ?? "");

  // ── Rate limiting ─────────────────────────────────────────
  //
  // This endpoint needs more care than client-login for two reasons.
  //
  // First, there is exactly ONE admin account and it opens every client's
  // records, so it gets a GLOBAL limit as well as a per-IP one. A botnet
  // spread across a thousand addresses never trips a per-IP limit; every one
  // of its attempts still lands in the same global bucket.
  //
  // Second — and this is the part that bites — the login screen calls THIS
  // endpoint first for everyone, and only falls through to client-login when
  // it says no. So every ordinary client signing in arrives here as a failed
  // admin login. If those counted against the strict buckets, your own clients
  // would lock you out of your own admin panel. They don't: a wrong username
  // spends only the loose bucket, which exists to bound hammering and stop
  // someone enumerating usernames for free. Only a RIGHT username with a wrong
  // password touches the strict ones — which is exactly what guessing a
  // password looks like.
  //
  // Cost of the global limit, worth knowing: someone determined can burn those
  // 40 failures and keep you out for 15 minutes. Wait it out, or run
  // `delete from public.rate_limit_hits;` in Supabase (see sql/06_rate_limit.sql).
  //
  // If the database is unreachable the limiter logs an error and lets the
  // request through. Admin login must keep working even when the limiter
  // cannot — see the header of _lib/ratelimit.js.
  const ip = clientIp(req);
  const db = limiterDb();

  const looseRules = [
    { key: bucket("admin-login", "unknown-user-ip", ip), limit: 200, windowSec: 15 * 60 },
  ];
  const strictRules = [
    { key: bucket("admin-login", "ip", ip), limit: 10, windowSec: 15 * 60 },
    { key: bucket("admin-login", "global", "the-one-admin"), limit: 40, windowSec: 15 * 60 },
  ];

  // The username is compared first, on purpose. It is not the secret — the
  // password is — and knowing which bucket to charge before spending anything
  // is what keeps client fall-through traffic out of the strict counters.
  // The password is still not looked at until after the limit has been checked,
  // which is the part that matters: no guess is ever verified for free.
  //
  // This does make a correct username measurably slower than a wrong one (one
  // extra count query). Accepted knowingly: the alternative is your own clients
  // filling the buckets that protect your password.
  const userOk = safeEqual(username, process.env.ADMIN_USERNAME);
  const rules = userOk ? [...looseRules, ...strictRules] : looseRules;

  const limited = await checkLimit(db, rules);
  if (!limited.ok) return tooMany(res, limited.retryAfter);

  const passOk = safeEqual(password, process.env.ADMIN_PASSWORD);

  if (!userOk || !passOk) {
    // Only failures are counted, so signing in correctly costs nothing.
    await Promise.all([
      recordHit(db, rules),
      new Promise((r) => setTimeout(r, 250 + Math.floor(Math.random() * 150))),
    ]);
    return res.status(401).json({ error: "Invalid username or password" });
  }

  // 12 hours — an admin session is far more powerful than a client one, so it
  // is deliberately shorter than the client's 30 days.
  const token = createSession({ sub: "admin", role: "admin" }, process.env.SESSION_SECRET, 60 * 60 * 12);

  return res.status(200).json({ token });
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
