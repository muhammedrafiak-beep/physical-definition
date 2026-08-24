// POST /api/register   { name, email, phone, age, weight, height, gender, goal, pal }
//
// PUBLIC on purpose — this is the sign-up form at /register, filled in by
// people who do not have an account yet. It is the one write that cannot
// require a token.
//
// It is deliberately narrow: it can only INSERT into `registrations`, it
// accepts a fixed list of fields, and it never touches `clients`. A
// registration is a request; the trainer reviews it and creates the client.

import { createClient } from "@supabase/supabase-js";
import { missingEnv } from "./_lib/admin.js";

const MAX_LEN = 200;

function clean(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, MAX_LEN);
}

function num(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n < 1000 ? n : null;
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
    console.error("register: missing env vars:", missing.join(", "));
    return res.status(500).json({ error: `Server is not configured — missing: ${missing.join(", ")}` });
  }

  const body = typeof req.body === "string" ? safeJson(req.body) : (req.body || {});

  const name = clean(body.name);
  const email = clean(body.email);
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  if (!email.includes("@")) {
    return res.status(400).json({ error: "That email address doesn't look right" });
  }

  const db = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await db.from("registrations").insert([{
    name,
    email,
    phone: clean(body.phone),
    age: num(body.age),
    weight: num(body.weight),
    height: num(body.height),
    gender: clean(body.gender),
    goal: clean(body.goal),
    pal: clean(body.pal),
  }]);

  if (error) {
    console.error("register: insert failed", error.message);
    return res.status(500).json({ error: "Could not send your registration. Try again." });
  }

  // Slow down anyone scripting the form. Not real rate limiting — add that
  // before opening sign-ups to strangers at any volume.
  await new Promise((r) => setTimeout(r, 300));

  return res.status(200).json({ ok: true });
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
