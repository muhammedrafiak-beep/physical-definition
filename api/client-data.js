// POST /api/client-data   { action, ... }
// Authorization: Bearer <client session token>
//
// Everything a signed-in client reads or writes about themselves: progress
// photos and workout logs.
//
// Before this, the browser talked to Supabase directly with the anon key for
// both. That key is public — it ships inside the JavaScript bundle — so in
// practice ANY person on the internet could read every client's progress
// photos, weights and notes, and write workout logs in anyone's name. For
// photographs of people's bodies that is not a small thing.
//
// THE ONE RULE THAT MAKES THIS SAFE
// The client id is read from the signed session token and from nowhere else.
// No action takes an id from the request body. Editing a number in devtools
// gets you your own row, every time.
//
// Photos additionally rely on the `progress-photos` bucket being PRIVATE (see
// sql/07_client_data_lockdown.sql). Locking the table alone would not be
// enough: while the bucket is public, every file stays readable by URL no
// matter what the table says. Reads here hand back a short-lived signed URL.

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { requireClient } from "./_lib/client-auth.js";
import { missingEnv } from "./_lib/admin.js";
import { checkLimit, recordHit, bucket as rlBucket } from "./_lib/ratelimit.js";

const BUCKET = "progress-photos";
const SIGNED_URL_TTL_SEC = 60 * 60; // an hour is plenty for one screen

// Resized on the client to ~1000px before it gets here, which lands around
// 150 KB. Two megabytes is far above that on purpose — it is an abuse ceiling,
// not a target — while staying under Vercel's request body limit.
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const PHOTO_COLUMNS = "id, photo_url, weight, notes, taken_at";

const LOG_COLUMNS =
  "id, client_id, client_name, day_name, workout_system_id, exercises_completed, " +
  "total_exercises, duration_minutes, estimated_calories, completed_at";

// Old rows hold a full public URL; new rows hold a bare storage path. Accept
// both so nobody's existing photos disappear the moment the bucket goes
// private.
function storagePath(photoUrl) {
  if (!photoUrl) return null;
  const marker = `/${BUCKET}/`;
  const i = photoUrl.indexOf(marker);
  if (i !== -1) return photoUrl.slice(i + marker.length);
  return photoUrl.startsWith("http") ? null : photoUrl;
}

function parseDataUrl(image) {
  if (typeof image !== "string") return { error: "No image was sent." };
  const m = /^data:([a-z/+.-]+);base64,(.+)$/i.exec(image.trim());
  if (!m) return { error: "That image could not be read." };

  const ext = ALLOWED_IMAGE_TYPES[m[1].toLowerCase()];
  if (!ext) return { error: "Photos must be JPEG, PNG or WebP." };

  let buf;
  try { buf = Buffer.from(m[2], "base64"); } catch { return { error: "That image could not be read." }; }
  if (!buf.length) return { error: "That image could not be read." };
  if (buf.length > MAX_IMAGE_BYTES) return { error: "That photo is too large. Try taking it again." };

  return { buf, ext, contentType: m[1].toLowerCase() };
}

function num(v, lo, hi) {
  const n = Number(v);
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
}

// workout_logs.id is a uuid. Validating it as a number — which an earlier
// draft of this file did — silently rejected every real session id.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function uuid(v) {
  const s = typeof v === "string" ? v.trim() : "";
  return UUID_RE.test(s) ? s : null;
}
function clean(v, max) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
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
    console.error("client-data: missing env vars:", missing.join(", "));
    return res.status(500).json({ error: `Server is not configured — missing: ${missing.join(", ")}` });
  }

  const me = requireClient(req, process.env.SESSION_SECRET);
  if (!me) return res.status(401).json({ error: "Please sign in again." });

  const body = typeof req.body === "string" ? safeJson(req.body) : (req.body || {});
  const { action } = body;

  const db = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    switch (action) {
      // ── Progress photos ───────────────────────────────────
      case "photos.list": {
        const { data, error } = await db
          .from("progress_photos")
          .select(PHOTO_COLUMNS)
          .eq("client_id", me.id)
          .order("taken_at", { ascending: false });
        if (error) throw error;

        return res.status(200).json({ photos: await withSignedUrls(db, data || []) });
      }

      case "photos.add": {
        // A cap on uploads per client per day. Storage is the tightest limit
        // on the free tier, and one person with a stuck finger should not be
        // able to spend all of it.
        const rule = [{ key: rlBucket("photos", "client", me.id), limit: 20, windowSec: 24 * 60 * 60 }];
        const limited = await checkLimit(db, rule);
        if (!limited.ok) {
          return res.status(429).json({ error: "That's a lot of photos for one day. Try again tomorrow." });
        }

        const img = parseDataUrl(body.image);
        if (img.error) return res.status(400).json({ error: img.error });

        // Random suffix as well as the timestamp: two photos in the same
        // millisecond would otherwise collide, and a guessable path is one
        // misconfigured bucket policy away from being a leak.
        const path = `${me.id}/${Date.now()}-${randomBytes(6).toString("hex")}.${img.ext}`;

        const { error: upErr } = await db.storage
          .from(BUCKET)
          .upload(path, img.buf, { contentType: img.contentType, upsert: false });
        if (upErr) throw upErr;

        const { data, error } = await db.from("progress_photos").insert([{
          client_id: me.id,
          photo_url: path,                 // a path, not a URL — the bucket is private
          weight: num(body.weight, 20, 400),
          notes: clean(body.notes, 300),
          taken_at: new Date().toISOString().split("T")[0],
        }]).select(PHOTO_COLUMNS).single();

        if (error) {
          // The row failed but the file is already up there. Take it back out
          // rather than leaving an orphan nothing points at.
          await db.storage.from(BUCKET).remove([path]).catch(() => {});
          throw error;
        }

        await recordHit(db, rule);

        const [photo] = await withSignedUrls(db, [data]);
        return res.status(200).json({ photo });
      }

      case "photos.delete": {
        const id = num(body.id, 1, Number.MAX_SAFE_INTEGER);
        if (!id) return res.status(400).json({ error: "id is required" });

        // Scoped by client_id as well as id. Without that, any client could
        // delete any other client's photo by guessing a number.
        const { data, error } = await db
          .from("progress_photos")
          .select("id, photo_url")
          .eq("id", id)
          .eq("client_id", me.id)
          .maybeSingle();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: "That photo is not there." });

        const path = storagePath(data.photo_url);
        if (path) await db.storage.from(BUCKET).remove([path]);

        const { error: delErr } = await db
          .from("progress_photos").delete().eq("id", id).eq("client_id", me.id);
        if (delErr) throw delErr;

        return res.status(200).json({ ok: true });
      }

      // ── Workout logs ──────────────────────────────────────
      case "logs.list": {
        const { data, error } = await db
          .from("workout_logs")
          .select(LOG_COLUMNS)
          .eq("client_id", String(me.id))
          .order("completed_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        return res.status(200).json({ logs: data || [] });
      }

      // ── Per-set logging ───────────────────────────────────
      //
      // This is the part of the app that gives someone a reason to open it a
      // second time. A session row says "you trained on Tuesday"; these rows
      // say "you pressed 42.5 kg for 10, and last month it was 37.5".

      case "sets.last": {
        // "What did I lift last time?" — asked once when the player opens, for
        // every exercise in the workout, so the answer is already on screen
        // when the set is over.
        const names = (Array.isArray(body.exercises) ? body.exercises : [])
          .filter((n) => typeof n === "string" && n.trim())
          .map((n) => n.trim().slice(0, 120))
          .slice(0, 80);
        if (!names.length) return res.status(200).json({ last: {} });

        const { data, error } = await db
          .from("workout_sets")
          .select("exercise_name, session_id, set_no, weight_kg, reps_done, duration_sec, created_at")
          .eq("client_id", String(me.id))
          .in("exercise_name", names)
          .eq("is_warmup", false)
          .order("created_at", { ascending: false })
          .limit(600);
        if (error) throw error;

        // Keep only the most recent SESSION per exercise. Mixing sets from two
        // different days would read as one workout that never happened.
        const last = {};
        for (const row of data || []) {
          const cur = last[row.exercise_name];
          if (!cur) { last[row.exercise_name] = { session_id: row.session_id, when: row.created_at, sets: [row] }; continue; }
          if (cur.session_id === row.session_id) cur.sets.push(row);
        }
        for (const k of Object.keys(last)) {
          last[k].sets.sort((a, b) => a.set_no - b.set_no);
        }
        return res.status(200).json({ last });
      }

      case "logs.start": {
        // Created lazily, on the first set actually logged — not when the
        // player opens. Otherwise every abandoned tap leaves a phantom session
        // in the client's history.
        const { data: who, error: whoErr } = await db
          .from("clients").select("name").eq("id", me.id).maybeSingle();
        if (whoErr) throw whoErr;
        if (!who) return res.status(404).json({ error: "Please sign in again." });

        const { data, error } = await db.from("workout_logs").insert([{
          client_id: String(me.id),
          client_name: who.name,
          day_name: clean(body.day_name, 80) || "Full Workout",
          workout_system_id: clean(body.workout_system_id, 40),
          exercises_completed: 0,
          total_exercises: num(body.total_exercises, 0, 500) ?? 0,
          duration_minutes: 0,
          estimated_calories: 0,
        }]).select("id").single();
        if (error) throw error;

        return res.status(200).json({ sessionId: data.id });
      }

      case "sets.add": {
        const sessionId = uuid(body.sessionId);
        const name = clean(body.exercise_name, 120);
        const setNo = num(body.set_no, 1, 30);
        if (!sessionId || !name || !setNo) {
          return res.status(400).json({ error: "sessionId, exercise_name and set_no are required" });
        }

        // The session must belong to whoever is signed in. Without this check a
        // client could write sets into someone else's workout.
        const { data: owns, error: ownErr } = await db
          .from("workout_logs").select("id")
          .eq("id", sessionId).eq("client_id", String(me.id)).maybeSingle();
        if (ownErr) throw ownErr;
        if (!owns) return res.status(403).json({ error: "That workout is not yours." });

        // upsert, not insert: a flaky phone connection retrying the same set
        // should correct the row, not fail on the unique constraint.
        const { error } = await db.from("workout_sets").upsert([{
          session_id: sessionId,
          client_id: String(me.id),
          exercise_name: name,
          set_no: setNo,
          weight_kg: num(body.weight_kg, 0, 999),
          reps_done: num(body.reps_done, 0, 500),
          duration_sec: num(body.duration_sec, 0, 100000),
          is_warmup: !!body.is_warmup,
        }], { onConflict: "session_id,exercise_name,set_no" });
        if (error) throw error;

        return res.status(200).json({ ok: true });
      }

      case "logs.finish": {
        const sessionId = uuid(body.sessionId);
        if (!sessionId) return res.status(400).json({ error: "sessionId is required" });

        const { error } = await db.from("workout_logs").update({
          exercises_completed: num(body.exercises_completed, 0, 500) ?? 0,
          total_exercises: num(body.total_exercises, 0, 500) ?? 0,
          duration_minutes: num(body.duration_minutes, 0, 600) ?? 0,
          estimated_calories: num(body.estimated_calories, 0, 20000) ?? 0,
        }).eq("id", sessionId).eq("client_id", String(me.id));
        if (error) throw error;

        return res.status(200).json({ ok: true });
      }

      case "logs.add": {
        // The name is read from the database, not taken from the browser.
        // Otherwise a client could file a workout under someone else's name.
        const { data: who, error: whoErr } = await db
          .from("clients").select("name").eq("id", me.id).maybeSingle();
        if (whoErr) throw whoErr;
        if (!who) return res.status(404).json({ error: "Please sign in again." });

        const { error } = await db.from("workout_logs").insert([{
          client_id: String(me.id),
          client_name: who.name,
          day_name: clean(body.day_name, 80) || "Full Workout",
          workout_system_id: clean(body.workout_system_id, 40),
          exercises_completed: num(body.exercises_completed, 0, 500) ?? 0,
          total_exercises: num(body.total_exercises, 0, 500) ?? 0,
          duration_minutes: num(body.duration_minutes, 0, 600) ?? 0,
          estimated_calories: num(body.estimated_calories, 0, 20000) ?? 0,
        }]);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${String(action)}` });
    }
  } catch (e) {
    console.error("client-data:", action, "for client", me.id, "-", e?.message || e);
    return res.status(500).json({ error: "That didn't work. Try again." });
  }
}

// Swaps each stored path for a signed URL the browser can actually load. The
// field keeps the name `photo_url` so the screens that render it do not care
// that anything changed.
async function withSignedUrls(db, rows) {
  const paths = rows.map((r) => storagePath(r.photo_url));
  const wanted = paths.filter(Boolean);
  if (!wanted.length) return rows.map((r) => ({ ...r, photo_url: null }));

  const { data, error } = await db.storage.from(BUCKET).createSignedUrls(wanted, SIGNED_URL_TTL_SEC);
  if (error) {
    console.error("client-data: could not sign photo urls -", error.message);
    return rows.map((r) => ({ ...r, photo_url: null }));
  }

  const byPath = new Map();
  for (const s of data || []) if (s.path) byPath.set(s.path, s.signedUrl || null);

  return rows.map((r, i) => ({ ...r, photo_url: paths[i] ? byPath.get(paths[i]) || null : null }));
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
