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
  "progress, dob, trainer_notes, " +
  // Intake answers. The trainer needs these to understand why someone got the
  // programme they got — and, for an approved registration, they are the only
  // surviving record that PAR-Q screening happened at all.
  "experience, days_per_week, equipment, limitation, parq_answers, " +
  "assigned_reason, needs_review, signup_source, capability_levels";

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
    experience: r.experience || null,
    days_per_week: r.days_per_week || null,
    equipment: r.equipment || null,
    limitation: r.limitation || null,
    parq_answers: r.parq_answers || null,
    assigned_reason: r.assigned_reason || null,
    needs_review: !!r.needs_review,
    signup_source: r.signup_source || null,
    capability_levels: r.capability_levels || null,
  };
}

// Only these fields can be written from the browser. Anything else in the
// payload — password_hash above all — is ignored.
function toRow(c) {
  const row = {
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

  // Intake answers ride along only when the caller actually has them —
  // approving a registration does, editing a client's weight does not. Writing
  // them unconditionally would wipe a client's PAR-Q record every time the
  // trainer saved an unrelated edit.
  const intake = {
    experience: c.experience,
    days_per_week: c.daysPerWeek,
    equipment: c.equipment,
    limitation: c.limitation,
    parq_answers: c.parqAnswers,
    assigned_reason: c.assignedReason,
    needs_review: c.needsReview,
    signup_source: c.signupSource,
  };
  for (const [k, v] of Object.entries(intake)) if (v !== undefined) row[k] = v;

  return row;
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

      case "list_workout_logs": {
        // The trainer's view of everyone's training. Read-only: logs are
        // written by clients through /api/client-data, never from here.
        const { data, error } = await db
          .from("workout_logs")
          .select("*")
          .order("completed_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        return res.status(200).json({ logs: data || [] });
      }

      // ── Assessments ───────────────────────────────────────
      //
      // Append only. An assessment is what a person could do on a given day;
      // overwriting one destroys the only thing that makes the number worth
      // taking, because progression is two rows compared.

      case "list_assessments": {
        const clientId = Number(body.clientId);
        if (!Number.isFinite(clientId)) return res.status(400).json({ error: "clientId is required" });
        const { data, error } = await db
          .from("assessments")
          .select("id, assessed_at, assessed_by, levels, tests, parq_answers, notes")
          .eq("client_id", clientId)
          .order("assessed_at", { ascending: false });
        if (error) throw error;
        return res.status(200).json({ assessments: data || [] });
      }

      case "save_assessment": {
        const clientId = Number(body.clientId);
        if (!Number.isFinite(clientId)) return res.status(400).json({ error: "clientId is required" });

        const levels = isPlainObject(body.levels) ? body.levels : {};
        const tests  = isPlainObject(body.tests)  ? body.tests  : {};
        const parq   = isPlainObject(body.parqAnswers) ? body.parqAnswers : null;

        const { data, error } = await db.from("assessments").insert([{
          client_id: clientId,
          assessed_at: /^\d{4}-\d{2}-\d{2}$/.test(body.assessedAt || "")
            ? body.assessedAt
            : new Date().toISOString().split("T")[0],
          // Recorded by the trainer, because this endpoint requires his token.
          assessed_by: "trainer",
          levels,
          tests,
          parq_answers: parq,
          notes: body.notes ? String(body.notes).slice(0, 2000) : null,
        }]).select("id, assessed_at").single();
        if (error) throw error;

        // The assessment row is the record of the day. The client row carries
        // the CURRENT state, which is what the rest of the app reads — the
        // workout player included, so a session built after this one reflects
        // what the person was just measured doing.
        {
          const patch = {};
          if (Object.keys(levels).length) patch.capability_levels = levels;
          if (Object.keys(patch).length) {
            const { error: lErr } = await db.from("clients").update(patch).eq("id", clientId);
            if (lErr) console.error("save_assessment: levels patch failed -", lErr.message);
          }
        }

        if (parq) {
          const anyYes = Object.values(parq).some(Boolean);
          const patch = { parq_answers: parq };
          // parq_cleared_at means "screened and clear", not "screened". A YES
          // must not set it, or a flagged client would look cleared.
          if (!anyYes) patch.parq_cleared_at = new Date().toISOString();
          else patch.needs_review = true;
          const { error: cErr } = await db.from("clients").update(patch).eq("id", clientId);
          if (cErr) console.error("save_assessment: client patch failed -", cErr.message);
        }

        return res.status(200).json({ assessment: data });
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

// Arrays are objects too, and an array reaching a jsonb column that the app
// reads back as a map is a bug that only shows up much later.
function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
