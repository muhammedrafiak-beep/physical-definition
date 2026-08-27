// POST /api/admin-media   { action, ... }
// Authorization: Bearer <admin session token>
//
// Which photo and which video belong to which exercise — and how Rafi changes
// that without a developer.
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

const PHOTO_BUCKET = "exercise-photos";
const VIDEO_BUCKET = "exercise-videos";

// Extension allowlist, not a MIME allowlist: the extension is what ends up in
// the public URL and what the browser sniffs. Anything not listed is refused
// rather than stored under a name nothing will play.
const KINDS = {
  photo: { bucket: PHOTO_BUCKET, column: "photo_path", verified: "photo_verified",
           ext: ["jpg", "jpeg", "png", "webp"], maxBytes: 8 * 1024 * 1024 },
  video: { bucket: VIDEO_BUCKET, column: "video_path", verified: "video_verified",
           ext: ["mp4", "webm", "mov", "m4v"], maxBytes: 60 * 1024 * 1024 },
};

const COLUMNS =
  "exercise_name, photo_path, video_path, photo_verified, video_verified, updated_at, updated_by";

function toMedia(r) {
  return {
    name: r.exercise_name,
    photo: r.photo_path || null,
    video: r.video_path || null,
    photoVerified: !!r.photo_verified,
    videoVerified: !!r.video_verified,
    updatedAt: r.updated_at || null,
    updatedBy: r.updated_by || null,
  };
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
          buckets: { photo: PHOTO_BUCKET, video: VIDEO_BUCKET },
          storageUrl: `${SUPABASE_URL.replace(/\/+$/, "")}/storage/v1`,
        });
      }

      // Mint the upload URL. Nothing is written to the table here — the row
      // moves only once the browser reports the bytes landed, so a failed or
      // abandoned upload leaves the exercise showing what it showed before.
      case "sign_upload": {
        const kind = KINDS[String(body.kind || "")];
        if (!kind) return res.status(400).json({ error: "kind must be photo or video" });

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
        if (!kind) return res.status(400).json({ error: "kind must be photo or video" });

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
        const { data, error } = await db
          .from("exercise_media").update(patch).eq("exercise_name", name).select(COLUMNS).single();
        if (error) throw error;

        return res.status(200).json({ media: toMedia(data) });
      }

      // Point an exercise at an object that is already in the bucket — the
      // same photo serving several exercises, which is most of the library.
      case "reuse": {
        const kind = KINDS[String(body.kind || "")];
        if (!kind) return res.status(400).json({ error: "kind must be photo or video" });

        const name = String(body.exercise_name || "").trim();
        const path = String(body.path || "").trim();
        if (!name || !path) return res.status(400).json({ error: "exercise_name and path are required" });

        const { data: found, error: findErr } = await db.storage
          .from(kind.bucket).list("", { search: path, limit: 1 });
        if (findErr) throw findErr;
        if (!found?.some((o) => o.name === path)) {
          return res.status(404).json({ error: "There is no such file in the bucket." });
        }

        const { data, error } = await db.from("exercise_media").update({
          [kind.column]: path,
          [kind.verified]: true,
          updated_at: new Date().toISOString(),
          updated_by: admin.sub || admin.email || "admin",
        }).eq("exercise_name", name).select(COLUMNS).single();
        if (error) throw error;

        return res.status(200).json({ media: toMedia(data) });
      }

      // Stop showing it. The file stays in the bucket — unlinking is
      // reversible and deleting is not, and the same file usually serves
      // several other exercises.
      case "clear": {
        const kind = KINDS[String(body.kind || "")];
        if (!kind) return res.status(400).json({ error: "kind must be photo or video" });

        const name = String(body.exercise_name || "").trim();
        if (!name) return res.status(400).json({ error: "exercise_name is required" });

        const { data, error } = await db.from("exercise_media").update({
          [kind.column]: null,
          [kind.verified]: false,
          updated_at: new Date().toISOString(),
          updated_by: admin.sub || admin.email || "admin",
        }).eq("exercise_name", name).select(COLUMNS).single();
        if (error) throw error;

        return res.status(200).json({ media: toMedia(data) });
      }

      // "This one is right" — without uploading anything. Everything seeded
      // from the old ladders starts unverified, so this is how the list of
      // things to check gets shorter.
      case "confirm": {
        const kind = KINDS[String(body.kind || "")];
        if (!kind) return res.status(400).json({ error: "kind must be photo or video" });

        const name = String(body.exercise_name || "").trim();
        if (!name) return res.status(400).json({ error: "exercise_name is required" });

        const { data, error } = await db.from("exercise_media").update({
          [kind.verified]: true,
          updated_at: new Date().toISOString(),
          updated_by: admin.sub || admin.email || "admin",
        }).eq("exercise_name", name).select(COLUMNS).single();
        if (error) throw error;

        return res.status(200).json({ media: toMedia(data) });
      }

      // What is already in the buckets, so a photo can be reused rather than
      // uploaded twice.
      case "files": {
        const kind = KINDS[String(body.kind || "")];
        if (!kind) return res.status(400).json({ error: "kind must be photo or video" });

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
