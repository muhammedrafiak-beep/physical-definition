// Preview deployments share the production Supabase credentials, so a food
// diary write made while reviewing a Preview would land in a real client's
// diary. These actions are refused unless the function runs in production.
// VERCEL_ENV is set by Vercel: "production" | "preview" | "development";
// unset counts as not production (fail closed). Reads are unaffected.
export const FOOD_WRITE_ACTIONS = new Set(["food.add", "food.delete", "food.targets.save", "food.targets.reset"]);

export function foodWriteBlocked(action, env = process.env) {
  return FOOD_WRITE_ACTIONS.has(action) && env.VERCEL_ENV !== "production";
}
