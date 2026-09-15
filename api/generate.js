// DISABLED — 15 September 2026, security fix (handover finding A).
//
// This endpoint used to be an open proxy to the Gemini API:
//
//   * no authentication of any kind
//   * no rate limiting
//   * Access-Control-Allow-Origin: "*"
//   * it read GEMINI_API_KEY from the environment and forwarded an
//     arbitrary `prompt` from the request body to
//     generativelanguage.googleapis.com
//
// Nothing in this application ever called it — a search of src/ and api/
// for "/api/generate", "GEMINI", and "generativelanguage" found no
// reference outside this file. It was left behind from an early
// experiment, and it was reachable in production at
// https://www.physicaldefinition.com/api/generate, so anyone who found
// the URL could spend the project's Google quota without limit.
//
// The handler below reads no environment variable, calls nothing
// upstream, and sets no CORS header. It answers every method with 410
// Gone so the route is explicitly retired rather than silently missing.
//
// If an AI text endpoint is ever needed, do NOT restore this file.
// Write a new one that: verifies a session with requireClient() or
// requireAdmin() from api/_lib/, goes through rateLimit() in
// api/_lib/ratelimit.js, and keeps the default same-origin CORS
// behaviour of every other endpoint in this directory.
//
// To remove the route entirely instead: `git rm api/generate.js`.

export const config = { runtime: "edge" };

export default async function handler() {
  return new Response(
    JSON.stringify({ error: "This endpoint has been retired." }),
    { status: 410, headers: { "Content-Type": "application/json" } }
  );
}
