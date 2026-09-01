// GET /api/media-map
//
// Exercise name -> its photo and video. This is what replaced the three
// hardcoded substring ladders in the bundle; the admin Library screen writes
// the table, this reads it, and nobody edits a source file to change a photo.
//
// Deliberately unauthenticated. Both buckets are public-read already, and the
// exercise names ship to every browser inside workouts.js, so this adds no
// exposure — and being public is what lets Vercel's edge cache serve it
// without waking a function. There is no client data here of any kind.
//
// The base URLs come from the server rather than being written into the
// bundle. Three separate files each hardcoded the project ref before this.

import { createClient } from "@supabase/supabase-js";
import { missingEnv } from "./_lib/admin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const missing = missingEnv(["SUPABASE_SERVICE_ROLE_KEY"]);
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (missing.length) {
    console.error("media-map: missing env vars:", missing.join(", "));
    return res.status(500).json({ error: "Server is not configured" });
  }

  // Same-origin paths, not Supabase URLs.
  //
  // The public object endpoint returns `Cache-Control: no-cache` for most of
  // the bucket and sends no ETag, so a client re-downloaded every photo and
  // every clip on every page load — on mobile data, in a gym. Storage ignores
  // cacheControl on a signed upload (raw body and multipart form both tried)
  // and offers no way to set it afterwards, so `vercel.json` rewrites
  // /media/* to Storage and puts the cache header on the way out.
  const base = "/media";

  try {
    const db = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await db
      .from("exercise_media")
      .select("exercise_name, photo_path, video_path")
      .order("exercise_name");
    if (error) throw error;

    // [photo, video] rather than an object per row: ~200 entries, and the
    // shorter form roughly halves what goes over a Qatari mobile connection.
    const m = {};
    for (const r of data || []) {
      if (!r.photo_path && !r.video_path) continue;   // nothing to say
      m[r.exercise_name] = [r.photo_path || null, r.video_path || null];
    }

    // A minute at the edge. Long enough that this almost never wakes a
    // function, short enough that a photo Rafi uploads is live before he has
    // finished wondering whether it worked.
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=600");
    return res.status(200).json({
      photoBase: `${base}/photos`,
      videoBase: `${base}/videos`,
      m,
    });
  } catch (e) {
    console.error("media-map:", e?.message || e);
    // A failure here must not blank every illustration in the app: the client
    // treats an empty map as "no photos yet" and keeps working.
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ photoBase: `${base}/photos`, videoBase: `${base}/videos`, m: {} });
  }
}
