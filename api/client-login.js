// POST /api/client-login   { email, password }
//
// Replaces the browser-side check
//     clients.find(x => x.email === u && x.password === p)
// which required the whole clients table — names, phones, passwords — to be
// readable from the browser with the anon key.
//
// Runs server-side with the SERVICE ROLE key. That key must never appear in
// any VITE_-prefixed variable: Vite inlines those into the client bundle.
//
// Required environment variables (Vercel → Settings → Environment Variables):
//   SUPABASE_URL                 e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    Supabase → Settings → API → service_role
//   SESSION_SECRET               any long random string, e.g. `openssl rand -hex 32`

import { createClient } from "@supabase/supabase-js";
import { hashPassword, verifyPassword, isHashed } from "./_lib/password.js";
import { createSession } from "./_lib/session.js";
import { checkLimit, recordHit, bucket, clientIp, tooMany } from "./_lib/ratelimit.js";

// Fields the browser is allowed to receive. Anything not listed here stays
// on the server — most importantly `password` and `password_hash`.
const CLIENT_FIELDS = [
  "id", "name", "email", "age", "weight", "height", "gender", "goal", "pal",
  "phone", "join_date", "status", "workout_plan", "nutrition_plan",
  "workout_system_id", "meal_plan_id", "progress",
];

function toPublicClient(row) {
  const out = {};
  for (const f of CLIENT_FIELDS) {
    if (f in row) out[f] = row[f];
  }
  // match the camelCase shape App.jsx already uses
  return {
    id: out.id,
    name: out.name,
    email: out.email,
    age: out.age,
    weight: out.weight,
    height: out.height,
    gender: out.gender,
    goal: out.goal,
    pal: out.pal,
    phone: out.phone,
    joinDate: out.join_date,
    status: out.status,
    workoutPlan: out.workout_plan,
    nutritionPlan: out.nutrition_plan,
    workoutSystemId: out.workout_system_id,
    mealPlanId: out.meal_plan_id,
    progress: out.progress || [],
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // SUPABASE_URL is preferred, but fall back to the VITE_-prefixed one the
  // browser build already uses — it is the same value and is not a secret.
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SESSION_SECRET = process.env.SESSION_SECRET;

  // Name the missing variables. Names only — never values.
  const missing = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!SESSION_SECRET) missing.push("SESSION_SECRET");

  if (missing.length) {
    console.error("client-login: missing env vars:", missing.join(", "));
    return res.status(500).json({
      error: `Server is not configured — missing: ${missing.join(", ")}`,
    });
  }

  const body = typeof req.body === "string" ? safeJson(req.body) : req.body;
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Two limits, because they stop different attacks.
  //
  //   by IP    — one machine working through a list of stolen email addresses.
  //   by email — a botnet working through passwords for ONE account, which the
  //              per-IP limit would never see.
  //
  // Only WRONG passwords are counted (see recordFailure below), so a whole gym
  // of real clients signing in from one address spends nothing. That is why
  // these numbers can be this tight without ever getting in anyone's way.
  //
  // The trade-off in the email limit: someone who knows a client's address can
  // burn those 10 attempts and make that client wait 15 minutes. Annoying, and
  // far better than leaving the account guessable.
  const ip = clientIp(req);
  const limitRules = [
    { key: bucket("client-login", "ip", ip), limit: 25, windowSec: 15 * 60 },
    { key: bucket("client-login", "email", email), limit: 10, windowSec: 15 * 60 },
  ];
  const recordFailure = () => recordHit(admin, limitRules);

  const limited = await checkLimit(admin, limitRules);
  if (!limited.ok) return tooMany(res, limited.retryAfter);

  const { data: rows, error } = await admin
    .from("clients")
    .select("*")
    .ilike("email", email)
    .limit(2);

  if (error) {
    console.error("client-login: lookup failed", error.message);
    return res.status(500).json({ error: "Could not sign you in. Try again." });
  }

  // One generic message for every failure below — never reveal whether the
  // email exists, or whether it was the password that was wrong.
  const DENIED = { error: "Invalid email or password" };

  const row = rows && rows.length === 1 ? rows[0] : null;
  if (!row) {
    await Promise.all([recordFailure(), burnTime()]);
    return res.status(401).json(DENIED);
  }

  let ok = false;
  let needsMigration = false;

  if (isHashed(row.password_hash)) {
    ok = await verifyPassword(password, row.password_hash);
  } else if (typeof row.password === "string" && row.password.length > 0) {
    // Legacy plaintext row: verify against it once, then upgrade it in place.
    ok = timingSafeString(password, row.password);
    needsMigration = ok;
  }

  if (!ok) {
    // Wrong password. This is the one case worth counting, and the reason the
    // limits above can stay tight without troubling anyone real.
    await Promise.all([recordFailure(), burnTime()]);
    return res.status(401).json(DENIED);
  }

  if (row.status && row.status !== "Active") {
    return res.status(403).json({ error: "This account is disabled. Contact your trainer." });
  }

  // migrate-on-login: hash the password, then clear the plaintext copy.
  //
  // These are two separate writes on purpose. Done as one update, a failure on
  // either half rolls back BOTH — which is how a NOT NULL constraint on
  // `password` silently left every row unhashed while logins kept succeeding.
  // Writing the hash first means that even if clearing the plaintext fails,
  // every future login for this client already goes through the hashed path.
  let migrationOk = null; // null = not attempted
  if (needsMigration) {
    migrationOk = false;
    try {
      const password_hash = await hashPassword(password);

      const { error: hashErr } = await admin
        .from("clients")
        .update({ password_hash })
        .eq("id", row.id);

      if (hashErr) {
        console.error("client-login: could not write password_hash for client", row.id, "-", hashErr.message);
      } else {
        const { error: clearErr } = await admin
          .from("clients")
          .update({ password: null })
          .eq("id", row.id);

        if (clearErr) {
          // Hash landed, plaintext did not clear. Not fatal, but it means the
          // plaintext is still sitting in the table — surface it loudly.
          console.error("client-login: password_hash written but plaintext NOT cleared for client", row.id, "-", clearErr.message);
        } else {
          migrationOk = true;
        }
      }
    } catch (e) {
      console.error("client-login: migration threw for client", row.id, "-", e && e.message);
    }

    if (!migrationOk) {
      console.error(
        "client-login: MIGRATION INCOMPLETE for client", row.id,
        "— this client's password is still stored in plaintext. Check the clients table."
      );
    }
  }

  const token = createSession({ sub: String(row.id), role: "client" }, SESSION_SECRET);

  return res.status(200).json({
    token,
    client: toPublicClient(row),
    migrated: migrationOk === true,
  });
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}

// Constant-time-ish comparison for the legacy plaintext path.
function timingSafeString(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Flatten the timing difference between "no such user" and "wrong password".
// Rate limiting (above) is what actually stops brute force; this only keeps
// the two failure cases from being distinguishable by a stopwatch.
function burnTime() {
  return new Promise((r) => setTimeout(r, 250 + Math.floor(Math.random() * 150)));
}
