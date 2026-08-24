// POST /api/signup   { name, email, phone, age, weight, height, gender, goal,
//                      experience, daysPerWeek, equipment, limitation, parq }
//
// PUBLIC. Creates a working account and picks a training programme without a
// human in the loop — the whole point of the self-serve flow.
//
// Two things it deliberately will NOT do on its own:
//   - assign anything to someone who answered YES to a PAR-Q question
//   - assign a clinical programme to someone who reports pain
// In both cases it files a registration for the trainer instead, and says so
// plainly to the person signing up. See api/_lib/assign.js for the rules.

import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "./_lib/password.js";
import { missingEnv, generatePassword } from "./_lib/admin.js";
import { assignSystem, PARQ_QUESTIONS } from "./_lib/assign.js";

// How the app refers to itself when it talks to a person signing up. One
// place, so it can change without hunting through message strings.
// A named human is used on the health-flagged path on purpose: someone who
// has just reported chest pain is reassured by a coach looking at it, not by
// "an administrator".
const SUPPORT = {
  team: "The Physical Definition team",
  coach: "One of our coaches",
};

const EXPERIENCE = ["beginner", "intermediate", "advanced"];
const EQUIPMENT = ["full_gym", "home_basic", "none"];
const LIMITATION = ["none", "knee", "back", "shoulder"];

const pick = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback);

function clean(v, max = 200) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}
function num(v, lo, hi, fallback = null) {
  const n = Number(v);
  return Number.isFinite(n) && n >= lo && n <= hi ? n : fallback;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const missing = missingEnv(["SUPABASE_SERVICE_ROLE_KEY"]);
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (missing.length) {
    console.error("signup: missing env vars:", missing.join(", "));
    return res.status(500).json({ error: `Server is not configured — missing: ${missing.join(", ")}` });
  }

  const body = typeof req.body === "string" ? safeJson(req.body) : (req.body || {});

  const name = clean(body.name, 120);
  const email = (clean(body.email, 200) || "").toLowerCase();
  if (!name || !email || !email.includes("@")) {
    return res.status(400).json({ error: "Name and a valid email are required" });
  }

  const age = num(body.age, 10, 100, 30);
  const intake = {
    age,
    experience: pick(body.experience, EXPERIENCE, "beginner"),
    daysPerWeek: num(body.daysPerWeek, 1, 7, 3),
    equipment: pick(body.equipment, EQUIPMENT, "full_gym"),
    limitation: pick(body.limitation, LIMITATION, "none"),
    goal: clean(body.goal, 60) || "General Fitness",
    parqFlags: PARQ_QUESTIONS.filter((q) => body.parq && body.parq[q.id] === true).map((q) => q.id),
  };

  // Store every answer, not only the flags — this is the record that screening
  // actually happened.
  const parqAnswers = {};
  for (const q of PARQ_QUESTIONS) parqAnswers[q.id] = !!(body.parq && body.parq[q.id]);

  const decision = assignSystem(intake);

  const db = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Already registered? Don't create a second account, and don't confirm to a
  // stranger that this address exists — just point them at signing in.
  const { data: existing } = await db.from("clients").select("id").ilike("email", email).limit(1);
  if (existing && existing.length) {
    return res.status(409).json({ error: "There is already an account for this email. Try signing in." });
  }

  const shared = {
    name, email,
    phone: clean(body.phone, 40),
    age,
    weight: num(body.weight, 20, 400),
    height: num(body.height, 80, 260),
    gender: clean(body.gender, 20),
    goal: intake.goal,
    experience: intake.experience,
    days_per_week: intake.daysPerWeek,
    equipment: intake.equipment,
    limitation: intake.limitation,
    parq_answers: parqAnswers,
  };

  // ── No automatic programme: file it for the trainer ─────────
  if (!decision.systemId) {
    const { error } = await db.from("registrations").insert([{
      ...shared,
      blocked_reason: decision.reason,
    }]);
    if (error) {
      console.error("signup: registration insert failed", error.message);
      return res.status(500).json({ error: "Could not complete your sign-up. Try again." });
    }
    return res.status(200).json({
      status: "needs_trainer",
      message:
        intake.parqFlags.length > 0
          ? `Thanks — a few of your health answers mean we won't start you on a plan automatically. ${SUPPORT.coach} will get in touch, and please speak to your doctor first.`
          : `Thanks — because of the discomfort you mentioned, ${SUPPORT.coach} will build your plan personally rather than the app guessing at it.`,
    });
  }

  // ── Account created, programme assigned ────────────────────
  const password = generatePassword(10);
  const password_hash = await hashPassword(password);
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await db.from("clients").insert([{
    ...shared,
    password_hash,
    password: null,
    join_date: today,
    status: "Active",
    workout_system_id: decision.systemId,
    progress: [{ date: today, weight: shared.weight }],
    parq_cleared_at: new Date().toISOString(),
    assigned_reason: decision.reason,
    needs_review: !!decision.needsTrainerContact,
    signup_source: "self_serve",
  }]).select("id, name, email").single();

  if (error) {
    console.error("signup: client insert failed", error.message);
    return res.status(500).json({ error: "Could not complete your sign-up. Try again." });
  }

  return res.status(200).json({
    status: "ready",
    email: data.email,
    password,                       // shown once, never stored readable
    systemId: decision.systemId,
    needsReview: !!decision.needsTrainerContact,
  });
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
