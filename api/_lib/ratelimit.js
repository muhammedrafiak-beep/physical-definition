// Rate limiting for the endpoints anyone on the internet can reach.
//
// Before this, the only thing standing between /api/client-login and a script
// was a ~250 ms delay. That slows one attacker down; it does nothing about a
// hundred requests sent in parallel.
//
// THREE DESIGN DECISIONS WORTH KNOWING ABOUT
//
// 1. Counters live in Postgres, not in memory.
//    A Vercel function is short-lived and many instances run at once, so a
//    counter in module scope sees only a slice of the traffic and resets when
//    the instance is recycled. The database is the only place every instance
//    can agree on. The cost is one extra round-trip per attempt.
//
// 2. On the login endpoints we count FAILURES, not attempts.
//    checkLimit() before, recordHit() only when the credentials were wrong.
//    A client who signs in correctly spends nothing, so twenty real people
//    behind one gym wifi or one mobile network never crowd each other out —
//    while someone guessing passwords burns their budget on every try.
//    Signup is different and uses rateLimit(): there, the attempt itself
//    writes a row, so the attempt is the thing worth counting.
//
// 3. It fails OPEN, loudly.
//    If the limiter itself breaks — table missing, database unreachable — the
//    request is allowed through and the failure is logged as an error. A
//    limiter that can lock every real user out of the app is a worse problem
//    than the one it exists to solve. Watch the Vercel logs for
//    "rate-limit: CHECK FAILED".

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

const PURGE_AFTER_SEC = 24 * 60 * 60;
const PURGE_ODDS = 0.02; // roughly one request in fifty tidies up

// ── Identifying the caller ──────────────────────────────────

export function clientIp(req) {
  const h = (req && req.headers) || {};

  // Order matters. `x-real-ip` and `x-vercel-forwarded-for` are written by
  // Vercel's own proxy and a caller cannot set them. `x-forwarded-for` is a
  // list a caller can prepend to, so it is only a fallback.
  const trusted = h["x-real-ip"] || h["x-vercel-forwarded-for"];
  if (typeof trusted === "string" && trusted.trim()) return trusted.trim();

  const xff = h["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) {
    // Be honest about this branch: if it ever runs, the value is forgeable and
    // the per-IP limits can be sidestepped by rotating a fake header. On
    // Vercel the trusted headers above are always present, so it should not.
    console.warn("rate-limit: fell back to x-forwarded-for — per-IP limits are weaker here");
    return xff.split(",")[0].trim();
  }

  // Everyone unidentifiable shares one bucket. Deliberate: unknown callers get
  // limited together rather than not at all.
  return "unknown";
}

// Buckets are hashed so this table never becomes a list of who tried to sign
// in and from what address.
export function bucket(endpoint, scope, value) {
  const h = createHash("sha256").update(String(value)).digest("hex").slice(0, 24);
  return `${endpoint}:${scope}:${h}`;
}

// For endpoints that don't already hold a service-role client.
export function limiterDb() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("rate-limit: no database credentials — limiter is OFF for this request");
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// ── The limiter ─────────────────────────────────────────────
//
// rules: [{ key, limit, windowSec }] — every rule is checked; the first one
// over its limit blocks the request.

// Counts only. Nothing is written, so calling this does not use anyone's
// budget. Use it to decide whether to let a request proceed.
export async function checkLimit(db, rules) {
  if (!db || !rules || !rules.length) return { ok: true };

  try {
    const now = Date.now();
    const counts = await Promise.all(
      rules.map(async (r) => {
        const since = new Date(now - r.windowSec * 1000).toISOString();
        const { count, error } = await db
          .from("rate_limit_hits")
          .select("id", { count: "exact", head: true })
          .eq("bucket", r.key)
          .gte("created_at", since);
        if (error) throw new Error(error.message);
        return count || 0;
      })
    );

    for (let i = 0; i < rules.length; i++) {
      if (counts[i] >= rules[i].limit) {
        return { ok: false, retryAfter: rules[i].windowSec };
      }
    }
    return { ok: true };
  } catch (e) {
    console.error("rate-limit: CHECK FAILED, request allowed through -", e && e.message);
    return { ok: true, degraded: true };
  }
}

// Spends one unit of budget in each bucket. On the login endpoints this is
// called only after the credentials turned out to be wrong.
export async function recordHit(db, rules) {
  if (!db || !rules || !rules.length) return;

  try {
    const { error } = await db
      .from("rate_limit_hits")
      .insert(rules.map((r) => ({ bucket: r.key })));
    if (error) throw new Error(error.message);

    if (Math.random() < PURGE_ODDS) {
      const cutoff = new Date(Date.now() - PURGE_AFTER_SEC * 1000).toISOString();
      const { error: delErr } = await db.from("rate_limit_hits").delete().lt("created_at", cutoff);
      if (delErr) console.error("rate-limit: purge failed -", delErr.message);
    }
  } catch (e) {
    console.error("rate-limit: RECORD FAILED, this attempt was not counted -", e && e.message);
  }
}

// check + record in one call, for endpoints where the attempt itself is the
// cost (signup writes a row whether or not anything was "wrong").
export async function rateLimit(db, rules) {
  const res = await checkLimit(db, rules);
  if (!res.ok) return res;
  // Only allowed attempts are recorded, so someone already blocked does not
  // extend their own block by hitting refresh.
  await recordHit(db, rules);
  return res;
}

export function tooMany(res, retryAfter) {
  res.setHeader("Retry-After", String(retryAfter || 900));
  const mins = Math.max(1, Math.round((retryAfter || 900) / 60));
  return res.status(429).json({
    error: `Too many attempts. Please wait about ${mins} minutes and try again.`,
  });
}
