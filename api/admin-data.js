// POST /api/admin-data   { action, ... }
// Authorization: Bearer <admin session token>
//
// Every admin read and write of the clients / registrations tables goes
// through here. Before this, the admin screens queried Supabase straight from
// the browser with the anon key, which meant the whole clients table — names,
// emails, phone numbers — was readable by anyone who opened devtools.
//
// One endpoint with an `action` rather than a file per operation: a single
// place where the admin token is checked, and no chance of adding a new
// operation that forgets to check it.
//
// Passwords are never returned by any action here. They cannot be — only the
// hash is stored. A new password comes back exactly once, from create_client,
// and from /api/admin-reset-password.

import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "./_lib/password.js";
import { requireAdmin, missingEnv, generatePassword } from "./_lib/admin.js";

// Columns the browser may see. `password` and `password_hash` are absent by
// design — do not add them.
const CLIENT_COLUMNS =
  "id, name, email, age, weight, height, gender, goal, pal, phone, join_date, " +
  "status, workout_plan, nutrition_plan, workout_system_id, meal_plan_id, " +
  "progress, dob, trainer_notes";

function toClient(r) {
  return {
    id: r.id, name: r.name, email: r.email,
    age: r.age, weight: r.weight, height: r.height, gender: r.gender,
    goal: r.goal, pal: r.pal, phone: r.phone,
    joinDate: r.join_date, status: r.status,
    workoutPlan: r.workout_plan, nutritionPlan: r.nutrition_plan,
    workoutSystemId: r.workout_system_id, mealPlanId: r.meal_plan_id,
    progress: r.progress || [],
    dob: r.dob || "",
    trainer_notes: r.trainer_notes || "",
  };
}

// Only these fields can be written from the browser. Anything else in the
// payload — password_hash above all — is ignored.
function toRow(c) {
  return {
    name: c.name, email: c.email,
    age: c.age, weight: c.weight, height: c.height, gender: c.gender,
    goal: c.goal, pal: c.pal, phone: c.phone,
    status: c.status,
    workout_plan: c.workoutPlan, nutrition_plan: c.nutritionPlan,
    workout_system_id: c.workoutSystemId, meal_plan_id: c.mealPlanId,
    progress: c.progress || [],
    dob: c.dob || "",
    trainer_notes: c.trainer_notes || "",
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const missing = missingEnv(["SUPABASE_SERVICE_ROLE_KEY", "SESSION_SECRET"]);
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (missing.length) {
    console.error("admin-data: missing env vars:", missing.join(", "));
    return res.status(500).json({ error: `Server is not configured — missing: ${missing.join(", ")}` });
  }

  if (!requireAdmin(req, process.env.SESSION_SECRET)) {
    return res.status(401).json({ error: "Not signed in as admin" });
  }

  const body = typeof req.body === "string" ? safeJson(req.body) : (req.body || {});
  const { action } = body;

  const db = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    switch (action) {
      case "list_clients": {
        const { data, error } = await db.from("clients").select(CLIENT_COLUMNS).order("id");
        if (error) throw error;
        return res.status(200).json({ clients: (data || []).map(toClient) });
      }

      case "create_client": {
        const c = body.client || {};
        if (!c.name || !c.email) {
          return res.status(400).json({ error: "Name and email are required" });
        }
        // The password is generated here unless the trainer typed one. Either
        // way only its hash is stored; the plaintext is returned once below.
        const plain = (c.password && String(c.password)) || generatePassword(10);
        const password_hash = await hashPassword(plain);

        const { data, error } = await db.from("clients").insert([{
          ...toRow(c),
          join_date: c.joinDate,
          password_hash,
          password: null,
        }]).select(CLIENT_COLUMNS).single();
        if (error) throw error;

        return res.status(200).json({ client: toClient(data), password: plain });
      }

      case "update_client": {
        const c = body.client || {};
        if (!c.id) return res.status(400).json({ error: "id is required" });

        const patch = toRow(c);
        // A typed password is a deliberate override: hash it and drop any
        // leftover plaintext, so login uses the new one immediately.
        if (c.password) {
          patch.password_hash = await hashPassword(String(c.password));
          patch.password = null;
        }

        const { error } = await db.from("clients").update(patch).eq("id", c.id);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      case "delete_client": {
        if (!body.id) return res.status(400).json({ error: "id is required" });
        const { error } = await db.from("clients").delete().eq("id", body.id);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      case "list_registrations": {
        const { data, error } = await db.from("registrations").select("*").order("id");
        if (error) throw error;
        return res.status(200).json({
          registrations: (data || []).map((r) => ({ ...r, submittedAt: r.submitted_at })),
        });
      }

      case "delete_registration": {
        if (!body.id) return res.status(400).json({ error: "id is required" });
        const { error } = await db.from("registrations").delete().eq("id", body.id);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${String(action)}` });
    }
  } catch (e) {
    console.error("admin-data:", action, "-", e?.message || e);
    return res.status(500).json({ error: "That didn't work. Try again." });
  }
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
