// P0 (premium-ui-v7): Previews share the production Supabase credentials, so
// any write made while reviewing a Preview would change real data. Every
// write action below is refused unless the function runs in production.
// VERCEL_ENV is set by Vercel: "production" | "preview" | "development";
// unset counts as not production (fail closed). Reads are never blocked.
//
// Already guarded elsewhere and left as they are:
//   food.add / food.delete / food.targets.save / food.targets.reset  (preview-food-guard.js)
//   pd-score "submit"                                                   (preview-guard.js)
export const CLIENT_WRITES = new Set(["photos.add", "photos.delete", "logs.start", "sets.add", "logs.finish", "logs.add", "parq.submit"]);
export const ADMIN_DATA_WRITES = new Set(["create_client", "update_client", "delete_client", "save_assessment", "clear_parq_flag", "set_workout_system", "delete_registration"]);
export const ADMIN_MEDIA_WRITES = new Set(["sign_upload", "commit", "reuse", "clear", "confirm", "display.set", "brief.save", "delete_file"]);

export const isProduction = (env = process.env) => env.VERCEL_ENV === "production";

export function writeBlocked(set, action, env = process.env) {
  return set.has(String(action || "")) && !isProduction(env);
}

export function sendPreviewBlocked(res, env = process.env) {
  return res.status(403).json({ error: "Preview: changes are not saved.", preview_blocked: true, env: env.VERCEL_ENV || "unset" });
}
