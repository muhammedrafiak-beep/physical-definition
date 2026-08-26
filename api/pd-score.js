// POST /api/pd-score   { action: "board" | "submit", ... }
// Authorization: Bearer <client session token>
//
// The PD Score leaderboard. Until now `PDScore.jsx` read and wrote this table
// straight from the browser with the anon key — the last file in src/ that
// still did — which had two separate problems:
//
//   1. The anon key ships inside the bundle, so the table was open to anyone.
//   2. The browser sent `client_id` and `client_name` with the score. Anyone
//      could therefore post any number under any name, and a leaderboard that
//      can be written by hand is not a leaderboard.
//
// Both are fixed the same way: the identity comes from the signed token, and
// the score is worked out here rather than accepted from the caller.

import { createClient } from "@supabase/supabase-js";
import { requireClient } from "./_lib/client-auth.js";
import { rateLimit, bucket, tooMany } from "./_lib/ratelimit.js";

// Must match the formula the app shows on screen. It lives here because this
// is the copy that decides what is stored; PDScore.jsx displays the same
// number so the person sees their result immediately, without waiting.
const scoreFor = (totalSeconds) => Math.max(0, Math.round(1000 - totalSeconds / 0.6));

// A five-station circuit that a person physically performs. Under a minute is
// not possible; over two hours is not the same test any more. Both ends are
// rejected rather than clamped — a clamped number would enter the board as if
// it had been earned.
const MIN_SECONDS = 60;
const MAX_SECONDS = 2 * 60 * 60;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const missing = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.SESSION_SECRET) missing.push("SESSION_SECRET");
  if (missing.length) {
    console.error("pd-score: missing env vars:", missing.join(", "));
    return res.status(500).json({ error: `Server is not configured — missing: ${missing.join(", ")}` });
  }

  const session = requireClient(req, process.env.SESSION_SECRET);
  if (!session) return res.status(401).json({ error: "Not signed in" });

  const db = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const body = typeof req.body === "string" ? safeJson(req.body) : (req.body || {});
  const action = String(body.action || "");

  try {
    switch (action) {
      case "board": {
        const { data, error } = await db
          .from("pd_scores")
          .select("id, client_id, client_name, total_seconds, pd_score, scaled, station_times, completed_at")
          .order("pd_score", { ascending: false })
          .limit(50);
        if (error) throw error;

        const rows = data || [];
        const me = String(session.id);

        // A leaderboard is meant to show other people's names — that is the
        // whole point of it. Their client ids are not, so the row is rebuilt
        // with `mine` in place of the id.
        const board = rows.map((r) => ({
          id: r.id,
          client_name: r.client_name,
          total_seconds: r.total_seconds,
          pd_score: r.pd_score,
          scaled: !!r.scaled,
          completed_at: r.completed_at,
          mine: String(r.client_id) === me,
        }));

        return res.status(200).json({ board });
      }

      case "submit": {
        // A score is a real effort, so a person produces very few of them.
        // Tight limits cost an honest client nothing.
        const limited = await rateLimit(db, [
          { key: bucket("pd-score", "client", String(session.id)), limit: 10, windowSec: 60 * 60 },
        ]);
        if (!limited.ok) return tooMany(res, limited.retryAfter);

        const total = Number(body.totalSeconds);
        if (!Number.isFinite(total) || total < MIN_SECONDS || total > MAX_SECONDS) {
          return res.status(400).json({ error: "That time is not a valid circuit result." });
        }

        // The name on the board is the name on the account. It is read here
        // and never taken from the request.
        const { data: who, error: whoErr } = await db
          .from("clients")
          .select("id, name, status")
          .eq("id", session.id)
          .single();
        if (whoErr || !who) return res.status(401).json({ error: "Not signed in" });
        if (who.status && who.status !== "Active") {
          return res.status(403).json({ error: "This account is disabled. Contact your trainer." });
        }

        const seconds = Math.round(total);
        const { data, error } = await db.from("pd_scores").insert([{
          client_id: String(who.id),
          client_name: who.name,
          total_seconds: seconds,
          // Worked out here, from the time. Accepting the caller's own score
          // would make every other number on the board meaningless.
          pd_score: scoreFor(seconds),
          scaled: body.scaled === true,
          station_times: cleanStationTimes(body.stationTimes),
        }]).select("id, pd_score, total_seconds, completed_at").single();
        if (error) throw error;

        return res.status(200).json({ score: data });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (e) {
    console.error("pd-score:", action, "-", e?.message || e);
    return res.status(500).json({ error: "That didn't work. Try again." });
  }
}

// The app records one entry per station: { name, at } — the station's name and
// the elapsed seconds when it was finished. Whatever the browser actually
// sent, only that shape, bounded and trimmed, reaches the jsonb column.
function cleanStationTimes(v) {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, 10)
    .map((x) => {
      if (!x || typeof x !== "object") return null;
      const at = Number(x.at);
      if (!Number.isFinite(at) || at < 0 || at > MAX_SECONDS) return null;
      return { name: String(x.name || "").slice(0, 60), at: Math.round(at) };
    })
    .filter(Boolean);
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
