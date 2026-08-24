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
    await burnTime();
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
    await burnTime();
    return res.status(401).json(DENIED);
  }

  if (row.status && row.status !== "Active") {
    return res.status(403).json({ error: "This account is disabled. Contact your trainer." });
  }

  // migrate-on-login: hash it now and clear the plaintext copy.
  if (needsMigration) {
    try {
      const password_hash = await hashPassword(password);
      const { error: upErr } = await admin
        .from("clients")
        .update({ password_hash, password: null })
        .eq("id", row.id);
      if (upErr) console.error("client-login: migration failed", upErr.message);
    } catch (e) {
      // A failed upgrade must not block a valid login — it retries next time.
      console.error("client-login: migration threw", e);
    }
  }

  const token = createSession({ sub: String(row.id), role: "client" }, SESSION_SECRET);

  return res.status(200).json({
    token,
    client: toPublicClient(row),
    migrated: needsMigration,
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

// Flatten the timing difference between "no such user" and "wrong password",
// and slow down trivial brute force. Not a substitute for real rate limiting.
function burnTime() {
  return new Promise((r) => setTimeout(r, 250 + Math.floor(Math.random() * 150)));
}
