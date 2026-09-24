// Preview deployments share the production Supabase credentials, so any write
// from a preview lands in the real database. PD-100 score submissions are
// refused unless the function runs in the production environment.
// VERCEL_ENV is set by Vercel on every deployment: "production", "preview"
// or "development". Unset is treated as not production (fail closed).
export function previewWriteBlocked(action, env = process.env) {
  return action === "submit" && env.VERCEL_ENV !== "production";
}
