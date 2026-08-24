// POST /api/admin-reset-password   { clientId }
// Authorization: Bearer <admin session token>
//
// Issues a NEW password for a client, stores only its hash, and returns the
// plaintext exactly once so the trainer can pass it on.
//
// This replaces the old "share credentials" flow, which read the client's
// stored password back out of the database. That only worked because the
// password was sitting there in plaintext. Now that passwords are hashed,
// nobody — including the trainer — can read an existing one. Resetting is
// the correct operation, and it is what every real system does.

import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "./_lib/password.js";
import { requireAdmin, missingEnv, generatePassword } from "./_lib/admin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const missing = missingEnv(["SUPABASE_SERVICE_ROLE_KEY", "SESSION_SECRET"]);
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");

  if (missing.length) {
    console.error("admin-reset-password: missing env vars:", missing.join(", "));
    return res.status(500).json({
      error: `Server is not configured — missing: ${missing.join(", ")}`,
    });
  }

  const admin = requireAdmin(req, process.env.SESSION_SECRET);
  if (!admin) {
    return res.status(401).json({ error: "Not signed in as admin" });
  }

  const body = typeof req.body === "string" ? safeJson(req.body) : req.body;
  const clientId = body?.clientId;
  if (clientId === undefined || clientId === null || clientId === "") {
    return res.status(400).json({ error: "clientId is required" });
  }

  const db = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rows, error: findErr } = await db
    .from("clients")
    .select("id, name, email, phone")
    .eq("id", clientId)
    .limit(1);

  if (findErr) {
    console.error("admin-reset-password: lookup failed", findErr.message);
    return res.status(500).json({ error: "Could not reset the password. Try again." });
  }
  if (!rows || rows.length === 0) {
    return res.status(404).json({ error: "Client not found" });
  }
  const row = rows[0];

  const newPassword = generatePassword(10);
  const password_hash = await hashPassword(newPassword);

  // Write the hash and clear any legacy plaintext in one go. Unlike
  // migrate-on-login this MUST be atomic: if only half of it landed, the
  // trainer would hand out a password that does not work.
  const { error: upErr } = await db
    .from("clients")
    .update({ password_hash, password: null })
    .eq("id", row.id);

  if (upErr) {
    console.error("admin-reset-password: update failed for client", row.id, "-", upErr.message);
    return res.status(500).json({ error: "Could not reset the password. Try again." });
  }

  // The plaintext is returned here and nowhere else. It is never stored.
  return res.status(200).json({
    client: { id: row.id, name: row.name, email: row.email, phone: row.phone },
    password: newPassword,
  });
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
