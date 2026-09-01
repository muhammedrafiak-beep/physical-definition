// POST /api/admin-media   { action, ... }
// Authorization: Bearer <admin session token>
//
// Which photo, which clip and which model sprite belong to which exercise —
// and how Rafi changes that without a developer.
//
// Before this, the answer lived in three hardcoded substring ladders in three
// source files (ExerciseIllustration.jsx, App.jsx VM_LIST, and WorkoutPlayer.jsx
// M — the last two identical copies of each other, free to drift). Adding one
// photo meant a commit, a push, and a deploy. Substring matching also cannot
// tell "close enough" from "wrong": every squat variant resolved to the barbell
// back squat photo, including the chair-assisted mini squats an 80-year-old is
// shown, while "Dumbbell Curl" got nothing at all even though the right file
// was sitting in the bucket.
//
// THE FILE DOES NOT PASS THROUGH THIS FUNCTION. `sign_upload` mints a
// single-use, path-scoped, short-lived signed upload URL and the browser PUTs
// the bytes straight to Supabase Storage. Two reasons:
//
//   1. A Vercel function body caps around 4.5 MB. The demo videos are bigger
//      than that. (`client-data`'s photos.add takes a data URL through the
//      function; that works for a phone snapshot and would not for these.)
//   2. A signed upload URL is a plain HTTP PUT with a token in the query
//      string, so no Supabase client and no key enter the browser bundle. The
//      property that `src/` never talks to the database survives intact.

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { requireAdmin, missingEnv } from "./_lib/admin.js";

const PHOTO_BUCKET  = "exercise-photos";
const VIDEO_BUCKET  = "exercise-videos";
const SPRITE_BUCKET = "exercise-sprites";

// Extension allowlist, not a MIME allowlist: the extension is what ends up in
// the public URL and what the browser sniffs. Anything not listed is refused
// rather than stored under a name nothing will play.
const KINDS = {
  photo:  { bucket: PHOTO_BUCKET,  column: "photo_path",  verified: "photo_verified",
            ext: ["jpg", "jpeg", "png", "webp"], maxBytes: 8 * 1024 * 1024 },
  video:  { bucket: VIDEO_BUCKET,  column: "video_path",  verified: "video_verified",
            ext: ["mp4", "webm", "mov", "m4v"], maxBytes: 60 * 1024 * 1024 },
  // One image holding a grid of frames of the PD Anatomy Model — the same
  // character the Flow clips are generated from — stepped through in order.
  // It is what an exercise shows when there is no clip and no photo, so the
  // library is never a dashed rectangle; and being one cached image, it costs
  // a fraction of a video on a gym's mobile data.
  sprite: { bucket: SPRITE_BUCKET, column: "sprite_path", verified: "sprite_verified",
            ext: ["webp", "png", "jpg", "jpeg", "avif"], maxBytes: 25 * 1024 * 1024,
            grid: true },
};

const KIND_NAMES = Object.keys(KINDS);
const kindError = () => `kind must be one of: ${KIND_NAMES.join(", ")}`;

// The grid the two sheets built so far use: 6 across, 4 down, 24 frames of
// 360x640. Stored per row rather than assumed, because a longer movement will
// want more frames and nothing should break when it does.
const DEFAULT_GRID = { cols: 6, rows: 4, frames: 24 };

// A grid has to be whole and positive, and the frames have to fit the cells
// it claims — a zero column count divides by zero in the client's frame maths,
// and a frame count past the grid scrubs into empty space.
function readGrid(body) {
  const n = (v, d) => {
    const x = Math.trunc(Number(v));
    return Number.isFinite(x) && x > 0 ? x : d;
  };
  const cols = n(body.cols, DEFAULT_GRID.cols);
  const rows = n(body.rows, DEFAULT_GRID.rows);
  const frames = n(body.frames, Math.min(DEFAULT_GRID.frames, cols * rows));
  if (cols > 24 || rows > 24) return { error: "A sprite grid can be at most 24 by 24." };
  if (frames > cols * rows) {
    return { error: `${frames} frames do not fit a ${cols} by ${rows} grid.` };
  }
  return { cols, rows, frames };
}

const COLUMNS =
  "exercise_name, photo_path, video_path, sprite_path, " +
  "photo_verified, video_verified, sprite_verified, " +
  "sprite_cols, sprite_rows, sprite_frames, display, " +
  "brief, brief_reviewed, updated_at, updated_by";

function toMedia(r) {
  return {
    name: r.exercise_name,
    photo: r.photo_path || null,
    video: r.video_path || null,
    sprite: r.sprite_path || null,
    photoVerified: !!r.photo_verified,
    videoVerified: !!r.video_verified,
    spriteVerified: !!r.sprite_verified,
    spriteGrid: r.sprite_path
      ? { cols: r.sprite_cols, rows: r.sprite_rows, frames: r.sprite_frames }
      : null,
    // Which of the three the client shows. "auto" resolves at render time;
    // anything else is Rafi overriding that for this one exercise.
    display: r.display || "auto",
    // Admin only. This is how to SHOOT the clip, and it never leaves this
    // endpoint — `media-map`, which is public, does not select it.
    brief: r.brief || null,
    briefReviewed: !!r.brief_reviewed,
    updatedAt: r.updated_at || null,
    updatedBy: r.updated_by || null,
  };
}

// Every write here targets one exercise by name, and the name is the primary
// key — so a name that is not in the table matches no row, `.single()` reports
// that as an error, and it used to surface as the catch-all 500: "That didn't
// work. Try again." for something that will never work however many times it
// is tried. `sign_upload` already answers this case properly; the writes that
// follow it did not.
//
// Returns null having already answered, so the caller returns immediately.
async function writeRow(db, res, name, patch) {
  const { data, error } = await db
    .from("exercise_media").update(patch).eq("exercise_name", name).select(COLUMNS).single();

  if (error) {
    // PGRST116 is PostgREST for "one row requested, none came back".
    if (error.code === "PGRST116") {
      res.status(404).json({ error: `No exercise called "${name}" in the library.` });
      return null;
    }
    throw error;
  }
  return data;
}

// A filename Storage and a CDN can both live with, derived from the exercise
// name so the bucket stays readable to a human browsing it.
function slug(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "exercise";
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
    console.error("admin-media: missing env vars:", missing.join(", "));
    return res.status(500).json({ error: `Server is not configured — missing: ${missing.join(", ")}` });
  }

  const admin = requireAdmin(req, process.env.SESSION_SECRET);
  if (!admin) return res.status(401).json({ error: "Not signed in as admin" });

  const body = typeof req.body === "string" ? safeJson(req.body) : (req.body || {});
  const { action } = body;

  const db = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    switch (action) {
      // Every exercise the library knows about, with what it currently shows.
      case "list": {
        const { data, error } = await db
          .from("exercise_media").select(COLUMNS).order("exercise_name");
        if (error) throw error;
        return res.status(200).json({
          media: (data || []).map(toMedia),
          buckets: { photo: PHOTO_BUCKET, video: VIDEO_BUCKET, sprite: SPRITE_BUCKET },
          storageUrl: `${SUPABASE_URL.replace(/\/+$/, "")}/storage/v1`,
        });
      }

      // Mint the upload URL. Nothing is written to the table here — the row
      // moves only once the browser reports the bytes landed, so a failed or
      // abandoned upload leaves the exercise showing what it showed before.
      case "sign_upload": {
        const kind = KINDS[String(body.kind || "")];
        if (!kind) return res.status(400).json({ error: kindError() });

        const name = String(body.exercise_name || "").trim();
        if (!name) return res.status(400).json({ error: "exercise_name is required" });

        // The exercise has to already exist. The library is defined in code;
        // a name that is not in the table is a typo, and accepting it would
        // create a row nothing will ever read.
        const { data: row, error: rowErr } = await db
          .from("exercise_media").select("exercise_name").eq("exercise_name", name).maybeSingle();
        if (rowErr) throw rowErr;
        if (!row) return res.status(404).json({ error: `No exercise called "${name}" in the library.` });

        const ext = String(body.filename || "").split(".").pop()?.toLowerCase() || "";
        if (!kind.ext.includes(ext)) {
          return res.status(400).json({ error: `A ${body.kind} has to be one of: ${kind.ext.join(", ")}` });
        }

        const size = Number(body.size);
        if (Number.isFinite(size) && size > kind.maxBytes) {
          return res.status(413).json({
            error: `That ${body.kind} is ${(size / 1048576).toFixed(1)} MB. The limit is ${kind.maxBytes / 1048576} MB.`,
          });
        }

        // A fresh path every time, never a fixed one per exercise. Both buckets
        // are public and sit behind a CDN, so re-uploading to the same path
        // would leave the old picture cached at the edge and Rafi would swear
        // the upload had not worked.
        const path = `${slug(name)}-${randomBytes(4).toString("hex")}.${ext}`;

        const { data, error } = await db.storage.from(kind.bucket).createSignedUploadUrl(path);
        if (error) throw error;

        // supabase-js returns `signedUrl` ALREADY absolute. Prefixing the
        // storage origin onto it — which this did on the first attempt —
        // produces "https://…/storage/v1https://…/storage/v1/object/upload/…"
        // and a request that goes nowhere. Handle both shapes rather than
        // depending on which one a future version of the client returns.
        const signed = String(data.signedUrl || "");
        const url = /^https?:\/\//i.test(signed)
          ? signed
          : `${SUPABASE_URL.replace(/\/+$/, "")}/storage/v1${signed.startsWith("/") ? "" : "/"}${signed}`;

        return res.status(200).json({ path, url, token: data.token });
      }

      // The bytes are up. Point the exercise at them.
      case "commit": {
        const kind = KINDS[String(body.kind || "")];
        if (!kind) return res.status(400).json({ error: kindError() });

        const name = String(body.exercise_name || "").trim();
        const path = String(body.path || "").trim();
        if (!name || !path) return res.status(400).json({ error: "exercise_name and path are required" });

        // Confirm the object is really there before pointing an exercise at
        // it. Otherwise a browser that lies — or an upload that 200s and then
        // fails — turns a working photo into a broken image for every client.
        const { data: found, error: findErr } = await db.storage
          .from(kind.bucket).list("", { search: path, limit: 1 });
        if (findErr) throw findErr;
        if (!found?.some((o) => o.name === path)) {
          return res.status(409).json({ error: "That upload did not land. Try it again." });
        }

        const patch = {
          [kind.column]: path,
          [kind.verified]: true,
          updated_at: new Date().toISOString(),
          updated_by: admin.sub || admin.email || "admin",
        };

        // A sprite is meaningless without its grid: the client has to know how
        // to cut the sheet up. Stored with the path, in the same write, so a
        // row can never hold one without the other.
        if (kind.grid) {
          const g = readGrid(body);
          if (g.error) return res.status(400).json({ error: g.error });
          patch.sprite_cols = g.cols;
          patch.sprite_rows = g.rows;
          patch.sprite_frames = g.frames;
        }

        const data = await writeRow(db, res, name, patch);
        if (!data) return;

        return res.status(200).json({ media: toMedia(data) });
      }

      // Point an exercise at an object that is already in the bucket — the
      // same photo serving several exercises, which is most of the library.
      case "reuse": {
        const kind = KINDS[String(body.kind || "")];
        if (!kind) return res.status(400).json({ error: kindError() });

        const name = String(body.exercise_name || "").trim();
        const path = String(body.path || "").trim();
        if (!name || !path) return res.status(400).json({ error: "exercise_name and path are required" });

        const { data: found, error: findErr } = await db.storage
          .from(kind.bucket).list("", { search: path, limit: 1 });
        if (findErr) throw findErr;
        if (!found?.some((o) => o.name === path)) {
          return res.status(404).json({ error: "There is no such file in the bucket." });
        }

        const patch = {
          [kind.column]: path,
          [kind.verified]: true,
          updated_at: new Date().toISOString(),
          updated_by: admin.sub || admin.email || "admin",
        };
        if (kind.grid) {
          const g = readGrid(body);
          if (g.error) return res.status(400).json({ error: g.error });
          patch.sprite_cols = g.cols;
          patch.sprite_rows = g.rows;
          patch.sprite_frames = g.frames;
        }

        const data = await writeRow(db, res, name, patch);
        if (!data) return;

        return res.status(200).json({ media: toMedia(data) });
      }

      // Stop showing it. The file stays in the bucket — unlinking is
      // reversible and deleting is not, and the same file usually serves
      // several other exercises.
      case "clear": {
        const kind = KINDS[String(body.kind || "")];
        if (!kind) return res.status(400).json({ error: kindError() });

        const name = String(body.exercise_name || "").trim();
        if (!name) return res.status(400).json({ error: "exercise_name is required" });

        const patch = {
          [kind.column]: null,
          [kind.verified]: false,
          updated_at: new Date().toISOString(),
          updated_by: admin.sub || admin.email || "admin",
        };
        // The grid describes a sheet that is no longer there. Leaving it
        // behind would fail the row's own check constraint on the next write.
        if (kind.grid) {
          patch.sprite_cols = null;
          patch.sprite_rows = null;
          patch.sprite_frames = null;
        }

        const data = await writeRow(db, res, name, patch);
        if (!data) return;

        return res.status(200).json({ media: toMedia(data) });
      }

      // "This one is right" — without uploading anything. Everything seeded
      // from the old ladders starts unverified, so this is how the list of
      // things to check gets shorter.
      case "confirm": {
        const kind = KINDS[String(body.kind || "")];
        if (!kind) return res.status(400).json({ error: kindError() });

        const name = String(body.exercise_name || "").trim();
        if (!name) return res.status(400).json({ error: "exercise_name is required" });

        const data = await writeRow(db, res, name, {
          [kind.verified]: true,
          updated_at: new Date().toISOString(),
          updated_by: admin.sub || admin.email || "admin",
        });
        if (!data) return;

        return res.status(200).json({ media: toMedia(data) });
      }

      // Which of the three sources this exercise shows.
      //
      // "auto" is the default and is what almost every row should stay on: the
      // client picks the best thing present. The three named values are for
      // the cases where the best thing present is not the right thing — a
      // clip that came out badly, or a movement where the model reads more
      // clearly than the footage. Naming a source that is missing is allowed
      // and is not a trap: the client falls through the same chain rather than
      // showing nothing, so this can never strand an exercise blank.
      case "display.set": {
        const name = String(body.exercise_name || "").trim();
        if (!name) return res.status(400).json({ error: "exercise_name is required" });

        const want = String(body.display || "").trim();
        if (!["auto", ...KIND_NAMES].includes(want)) {
          return res.status(400).json({ error: `display must be auto, ${KIND_NAMES.join(", ")}` });
        }

        const data = await writeRow(db, res, name, {
          display: want,
          updated_at: new Date().toISOString(),
          updated_by: admin.sub || admin.email || "admin",
        });
        if (!data) return;

        return res.status(200).json({ media: toMedia(data) });
      }

      // The shooting brief. Rafi edits it, and marking it reviewed is his
      // signature on the form guidance — everything seeded starts unreviewed.
      case "brief.save": {
        const name = String(body.exercise_name || "").trim();
        if (!name) return res.status(400).json({ error: "exercise_name is required" });

        const b = body.brief;
        if (b !== null && (typeof b !== "object" || Array.isArray(b))) {
          return res.status(400).json({ error: "brief must be an object, or null to clear it" });
        }

        const patch = {
          brief: b || null,
          updated_at: new Date().toISOString(),
          updated_by: admin.sub || admin.email || "admin",
        };
        if (typeof body.reviewed === "boolean") patch.brief_reviewed = body.reviewed;

        const data = await writeRow(db, res, name, patch);
        if (!data) return;

        return res.status(200).json({ media: toMedia(data) });
      }

      // Remove a file from the bucket for good — and ONLY one that nothing
      // points at any more. The guard is not politeness: one photo usually
      // serves several exercises, and deleting is the one action here that
      // cannot be undone. Unlinking is what `clear` is for.
      case "delete_file": {
        const kind = KINDS[String(body.kind || "")];
        if (!kind) return res.status(400).json({ error: kindError() });

        const path = String(body.path || "").trim();
        if (!path) return res.status(400).json({ error: "path is required" });

        const { data: users, error: useErr } = await db
          .from("exercise_media").select("exercise_name").eq(kind.column, path).limit(3);
        if (useErr) throw useErr;
        if (users?.length) {
          return res.status(409).json({
            error: `Still in use by ${users.map((u) => u.exercise_name).join(", ")}. Remove it from those first.`,
          });
        }

        const { error } = await db.storage.from(kind.bucket).remove([path]);
        if (error) throw error;
        return res.status(200).json({ ok: true, path });
      }

      // What is already in the buckets, so a photo can be reused rather than
      // uploaded twice.
      case "files": {
        const kind = KINDS[String(body.kind || "")];
        if (!kind) return res.status(400).json({ error: kindError() });

        const { data, error } = await db.storage
          .from(kind.bucket).list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
        if (error) throw error;

        const files = (data || [])
          .filter((o) => o.name && o.name !== ".emptyFolderPlaceholder" && o.id)
          .map((o) => ({ name: o.name, size: o.metadata?.size ?? null }));
        return res.status(200).json({ files });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${String(action)}` });
    }
  } catch (e) {
    console.error("admin-media:", action, "-", e?.message || e);
    return res.status(500).json({ error: "That didn't work. Try again." });
  }
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
