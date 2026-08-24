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

  // Evaluate both comparisons before branching, so the response time does not
  // reveal whether it was the username or the password that was wrong.
  const userOk = safeEqual(username, process.env.ADMIN_USERNAME);
  const passOk = safeEqual(password, process.env.ADMIN_PASSWORD);

  if (!userOk || !passOk) {
    await new Promise((r) => setTimeout(r, 250 + Math.floor(Math.random() * 150)));
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
