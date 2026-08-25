// Shared helper for the endpoints a signed-in CLIENT calls.
//
// The mirror of _lib/admin.js. Kept separate on purpose: an admin token must
// not open a client endpoint and a client token must not open an admin one,
// and two small functions that each check one role are much harder to get
// wrong than one function with a flag.

import { readSession } from "./session.js";

// Reads the Bearer token and confirms it is a valid, unexpired CLIENT session.
// Returns { id }, or null.
//
// The id comes from the signed token and from nowhere else. Every handler that
// uses this must take the client id from here rather than from the request
// body — otherwise anyone could ask for someone else's photos by editing a
// number, which is exactly the hole this endpoint exists to close.
export function requireClient(req, secret) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  const claims = readSession(token, secret);
  if (!claims || claims.role !== "client") return null;

  const id = Number(claims.sub);
  if (!Number.isFinite(id) || id <= 0) return null;

  return { id };
}
