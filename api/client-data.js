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
import { PARQ_QUESTIONS, EXPERIENCE, EQUIPMENT, LIMITATION } from "./_lib/assign.js";
import { defaultTargets, cleanTargets, NUTRIENTS, offByBarcode, offSearch, portion } from "./_lib/nutrition.js";
import { foodWriteBlocked } from "./_lib/preview-food-guard.js";

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
  // The explicit null check is load-bearing. Number(null) is 0, and 0 sits
  // inside most of the ranges here — so without this, "this field does not
  // apply" arrived as a real zero. That is how a Wall Sit ended up recorded as
  // "0 reps" and a Glute Bridge as "0.00 kg" instead of leaving both blank.
  if (v === null || v === undefined || v === "") return null;
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

  // Before any database access: a Preview must not write a real diary.
  if (foodWriteBlocked(action)) {
    return res.status(403).json({ error: "Preview build: diary changes are not saved.", preview_blocked: true, env: process.env.VERCEL_ENV || "unset" });
  }

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

      // When the client was last measured. The programme block runs FROM the
      // last assessment, so this is what decides when the app says it is time
      // to be measured again — and reassessing is what resets it. Without it
      // the prompt would appear once and never go away, including to somebody
      // who had just been assessed that morning.
      //
      // Only the date leaves the server. The levels and test results are the
      // trainer's working notes and the client sees them on the Progress
      // screen, which has its own path.
      case "assessment.last": {
        const { data, error } = await db
          .from("assessments")
          .select("assessed_at")
          .eq("client_id", me.id)
          .order("assessed_at", { ascending: false })
          .limit(1);
        if (error) throw error;
        return res.status(200).json({ assessed_at: data && data[0] ? data[0].assessed_at : null });
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
          // Reps in reserve — how many more the person could have done. 0 means
          // nothing left, which is a real answer and not a missing one, so it
          // has to survive num()'s null guard rather than be filtered out.
          rir: num(body.rir, 0, 10),
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

      // ── Health screening, answered by the client ──────────
      //
      // PAR-Q+ is designed to be self-administered — that is what makes it
      // usable at all. Seven clients predate the signup flow and were never
      // screened; asking each of them once, at their own login, closes that
      // without the trainer chasing anybody.
      //
      // The answers are written to the CALLER'S row, taken from the token.
      // Nothing about which client is being screened comes from the browser.
      // -- Food -------------------------------------------------
      //
      // Everything here is scoped to me.id like the rest of this file: the
      // day's log, the day's targets, and the two lookups that fill them in.

      case "food.day": {
        const day = isoDate(body.date);

        const [logs, tg] = await Promise.all([
          db.from("food_logs")
            .select("id, eaten_at, meal, name, brand, barcode, grams, source, " + NUTRIENTS.join(", "))
            .eq("client_id", me.id)
            .eq("eaten_on", day)
            .order("eaten_at", { ascending: true }),
          getTargets(db, me.id),
        ]);
        if (logs.error) throw logs.error;
        const rows = logs.data || [];

        return res.status(200).json({ date: day, targets: tg, entries: rows, totals: sumRows(rows) });
      }

      case "food.add": {
        // A hundred and twenty items in a day is far past any real amount of
        // logging. This is here so a retry loop cannot fill the table, not to
        // police anybody's eating.
        const rule = [{ key: rlBucket("food", "client", me.id), limit: 120, windowSec: 24 * 60 * 60 }];
        const limited = await checkLimit(db, rule);
        if (!limited.ok) return res.status(429).json({ error: "That's a lot of entries for one day." });

        const name = clean(body.name, 120);
        if (!name) return res.status(400).json({ error: "What was it? Give it a name." });

        // Two ways in. A scanned or searched product arrives per 100g and is
        // scaled here; something typed by hand arrives already totalled.
        let vals;
        if (body.per100) {
          vals = portion(body.per100, body.grams);
          if (!vals) return res.status(400).json({ error: "How much of it? Enter the weight in grams." });
        } else {
          vals = { grams: num(body.grams, 0, 5000) };
          for (const k of NUTRIENTS) vals[k] = num(body[k], 0, 100000);
        }

        // A planned meal (source "plan:<plan>@<time>", set by the Meal plan
        // view) can be logged once per day. The button is already disabled
        // once it is logged; this is the check that survives a double tap or
        // a second device.
        const src = clean(body.source, 20) || "manual";
        if (src.startsWith("plan:")) {
          const dup = await db.from("food_logs").select("id").eq("client_id", me.id)
            .eq("eaten_on", isoDate(body.date)).eq("source", src).limit(1);
          if (dup.error) throw dup.error;
          if ((dup.data || []).length) return res.status(409).json({ error: "That meal is already logged for this day.", duplicate: true });
        }

        const row = {
          client_id: me.id,
          eaten_on: isoDate(body.date),
          meal: clean(body.meal, 20),
          name,
          brand: clean(body.brand, 60),
          barcode: clean(body.barcode, 32),
          source: src,
          ...vals,
        };

        const { data, error } = await db.from("food_logs").insert([row]).select("id").single();
        if (error) throw error;
        await recordHit(db, rule);

        return res.status(200).json({ ok: true, id: data.id });
      }

      case "food.delete": {
        const id = num(body.id, 1, Number.MAX_SAFE_INTEGER);
        if (!id) return res.status(400).json({ error: "Which entry?" });

        // The client_id filter is the whole security model here: without it an
        // id typed into devtools deletes somebody else's dinner.
        const { error } = await db.from("food_logs").delete().eq("id", id).eq("client_id", me.id);
        if (error) throw error;

        return res.status(200).json({ ok: true });
      }

      case "food.lookup": {
        const code = (clean(body.barcode, 32) || "").replace(/[^0-9]/g, "");
        if (code.length < 6) return res.status(400).json({ error: "That barcode did not scan properly." });

        // Cache first. The same tub of yoghurt gets scanned by every client in
        // the gym, and Open Food Facts is a free service run on donations.
        const { data: hit } = await db.from("food_barcodes").select("*").eq("barcode", code).maybeSingle();
        if (hit) return res.status(200).json({ food: stripCache(hit), cached: true });

        const rule = [{ key: rlBucket("offlookup", "client", me.id), limit: 200, windowSec: 24 * 60 * 60 }];
        const limited = await checkLimit(db, rule);
        if (!limited.ok) return res.status(429).json({ error: "Too many lookups today. Add it by hand for now." });
        await recordHit(db, rule);

        let food = null;
        try { food = await offByBarcode(code); }
        catch (e) { console.error("client-data: openfoodfacts lookup failed -", e?.message || e); }

        // Not an error. Plenty of real products are simply not in the
        // database, and the screen offers to add it by hand instead.
        if (!food) return res.status(200).json({ food: null });

        await db.from("food_barcodes").upsert([{
          barcode: code, name: food.name, brand: food.brand, serving_g: food.serving_g,
          kcal_100g: food.kcal_100g, protein_100g: food.protein_100g, carbs_100g: food.carbs_100g,
          fat_100g: food.fat_100g, sugar_100g: food.sugar_100g, fibre_100g: food.fibre_100g,
          sodium_100mg: food.sodium_100mg, sat_fat_100g: food.sat_fat_100g,
          cholesterol_100mg: food.cholesterol_100mg, fetched_at: new Date().toISOString(),
        }], { onConflict: "barcode" });

        return res.status(200).json({ food });
      }

      case "food.search": {
        const q = clean(body.q, 60);
        if (!q || q.length < 2) return res.status(200).json({ foods: [] });

        // OUR OWN SHELF FIRST.
        //
        // Everything anybody has ever scanned is in food_barcodes, and that
        // table is shared - it is not per client. So the moment one person in
        // the gym scans a tub of laban, every other client can find it by
        // typing the name, instantly, without going out to Open Food Facts at
        // all. That matters most for exactly the products Open Food Facts is
        // worst at: the ones on a shelf in Doha.
        // PostgREST reads `.or()` as a comma-separated list, so a comma or a
        // quote inside what somebody typed would tear the filter in half.
        // Quoting the value closes that, and % and _ are escaped so a search
        // for "50%" does not turn into a wildcard.
        const term = q.replace(/["\\]/g, "").replace(/[%_]/g, (m) => "\\" + m);
        const like = `"%${term}%"`;
        const { data: mine } = await db
          .from("food_barcodes")
          .select("*")
          .or(`name.ilike.${like},brand.ilike.${like}`)
          .not("kcal_100g", "is", null)
          .order("fetched_at", { ascending: false })
          .limit(8);

        const ours = (mine || []).map(stripCache);
        const seen = new Set(ours.map((f) => f.barcode));

        const rule = [{ key: rlBucket("offsearch", "client", me.id), limit: 200, windowSec: 24 * 60 * 60 }];
        const limited = await checkLimit(db, rule);

        // A full local shelf is a good enough answer on its own. Only reach
        // out when we are short, or when the day's lookups are used up.
        let theirs = [];
        if (ours.length < 8 && limited.ok) {
          await recordHit(db, rule);
          try { theirs = await offSearch(q); }
          catch (e) { console.error("client-data: openfoodfacts search failed -", e?.message || e); }
        }

        const foods = [
          ...ours.map((f) => ({ ...f, known: true })),
          ...theirs.filter((f) => !seen.has(f.barcode)),
        ].slice(0, 16);

        return res.status(200).json({ foods });
      }

      case "food.targets.save": {
        const patch = cleanTargets(body.targets);
        if (!Object.keys(patch).length) return res.status(400).json({ error: "Nothing to save." });

        // Any edit at all makes the row custom. From here on, the profile
        // changing - a new weight, a new goal - stops rewriting these numbers
        // underneath the person who set them.
        const row = {
          client_id: me.id, ...patch,
          source: "custom", updated_at: new Date().toISOString(), updated_by: "client",
        };
        const { error } = await db.from("nutrition_targets").upsert([row], { onConflict: "client_id" });
        if (error) throw error;

        return res.status(200).json({ targets: await getTargets(db, me.id) });
      }

      case "food.targets.reset": {
        const { error } = await db.from("nutrition_targets").delete().eq("client_id", me.id);
        if (error) throw error;
        return res.status(200).json({ targets: await getTargets(db, me.id) });
      }

      case "parq.submit": {
        const answers = body.answers;
        if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
          return res.status(400).json({ error: "Answer every question first." });
        }
        // Every question, or none. A half-answered screening recorded as a
        // screening is worse than no screening, because it looks done.
        // Named `answered` rather than `clean` on purpose: there is already a
        // clean() helper in this file, and shadowing it here would be a trap
        // for whoever edits this case next.
        const answered = {};
        for (const q of PARQ_QUESTIONS) {
          const v = answers[q.id];
          if (v !== true && v !== false) {
            return res.status(400).json({ error: "Answer every question first." });
          }
          answered[q.id] = v;
        }

        // The four intake answers, when the client is being asked for them
        // too. Every existing client predates the signup flow, so none of
        // them has an experience level, a days-a-week, an equipment answer or
        // a pain answer on file — and without those the app is choosing
        // programmes from a birthday and a guess.
        //
        // They are collected here rather than by re-registering these people,
        // because a new registration means a new row: their sets, sessions and
        // photos all hang off the id they already have.
        const intake = body.intake;
        if (intake !== undefined) {
          if (!intake || typeof intake !== "object" || Array.isArray(intake)) {
            return res.status(400).json({ error: "Answer every question first." });
          }
          const days = num(intake.daysPerWeek, 1, 7);
          if (!EXPERIENCE.includes(intake.experience) ||
              !EQUIPMENT.includes(intake.equipment) ||
              !LIMITATION.includes(intake.limitation) ||
              days === null) {
            return res.status(400).json({ error: "Answer every question first." });
          }
        }

        const anyYes = Object.values(answered).some(Boolean);
        const patch = { parq_answers: answered };

        if (intake !== undefined) {
          patch.experience = intake.experience;
          patch.equipment = intake.equipment;
          patch.limitation = intake.limitation;
          patch.days_per_week = num(intake.daysPerWeek, 1, 7);
        }

        // Reported pain is not a PAR-Q red flag and does not stop anybody
        // training — they are already training, with a trainer who knows them.
        // It does need a person to look at it, which is what needs_review
        // means. See the limitation branch in assign.js.
        //
        // Decided here, in one place, and never twice: an earlier draft set it
        // in the intake block above and then had the all-clear branch below
        // set it straight back to false, quietly losing the reported pain.
        const painReported = intake !== undefined && intake.limitation !== "none";
        if (anyYes) {
          // A clearance belongs to the answers it was given for. Somebody
          // cleared last month who reports chest pain today is NOT cleared,
          // and leaving the old timestamp standing let exactly that person
          // walk straight past the gate — the app read them as safe because
          // they had been safe once. Void it with the answers it was about.
          patch.parq_cleared_at = null;
          patch.parq_cleared_by = null;
          patch.parq_clear_note = null;
          patch.needs_review = true;
        } else {
          patch.parq_cleared_at = new Date().toISOString();
          patch.parq_cleared_by = "self";
          patch.needs_review = painReported;
        }

        const { error } = await db.from("clients").update(patch).eq("id", me.id);
        if (error) throw error;

        return res.status(200).json({
          parq_answers: answered,
          cleared: !anyYes,
          flagged: Object.entries(answered).filter(([, v]) => v).map(([k]) => k),
          intake: intake === undefined ? null : {
            experience: patch.experience,
            equipment: patch.equipment,
            limitation: patch.limitation,
            days_per_week: patch.days_per_week,
          },
        });
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

// The client's own calendar day. Sent by the browser, because a person in
// Doha logging supper at 00:30 means today as they see it, not whatever UTC
// thinks. Anything unparseable falls back to the server's date.
function isoDate(v) {
  const s = typeof v === "string" ? v.trim() : "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + "T00:00:00Z");
    if (!Number.isNaN(d.getTime())) return s;
  }
  return new Date().toISOString().slice(0, 10);
}

function sumRows(rows) {
  const t = {};
  for (const k of NUTRIENTS) t[k] = 0;
  for (const r of rows) {
    for (const k of NUTRIENTS) {
      const v = Number(r[k]);
      if (Number.isFinite(v)) t[k] += v;
    }
  }
  for (const k of NUTRIENTS) t[k] = Math.round(t[k] * 10) / 10;
  return t;
}

// The stored row if there is one, otherwise the numbers worked out from the
// profile. Nothing is written on a read: a client who never opens this screen
// does not need a row, and one who does gets the same answer every time until
// they change it themselves.
async function getTargets(db, clientId) {
  const { data } = await db.from("nutrition_targets").select("*").eq("client_id", clientId).maybeSingle();
  if (data) return data;

  const { data: c } = await db.from("clients")
    .select("weight, height, age, gender, goal, pal").eq("id", clientId).maybeSingle();
  return { client_id: clientId, ...defaultTargets(c || {}) };
}

// A cached barcode row, handed back in the same shape the live lookup returns.
function stripCache(r) {
  return {
    barcode: r.barcode, name: r.name, brand: r.brand, serving_g: r.serving_g, image: null,
    kcal_100g: r.kcal_100g, protein_100g: r.protein_100g, carbs_100g: r.carbs_100g,
    fat_100g: r.fat_100g, sugar_100g: r.sugar_100g, fibre_100g: r.fibre_100g,
    sodium_100mg: r.sodium_100mg, sat_fat_100g: r.sat_fat_100g, cholesterol_100mg: r.cholesterol_100mg,
  };
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
