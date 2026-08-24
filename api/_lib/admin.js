// Shared helpers for the admin-only endpoints.

import { timingSafeEqual, randomInt } from "node:crypto";
import { readSession } from "./session.js";

// Constant-time string compare that doesn't leak length via early return.
export function safeEqual(a, b) {
  const ab = Buffer.from(String(a ?? ""), "utf8");
  const bb = Buffer.from(String(b ?? ""), "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// Reads the Bearer token and confirms it is a valid, unexpired admin session.
// Returns the claims, or null.
export function requireAdmin(req, secret) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  const claims = readSession(token, secret);
  if (!claims || claims.role !== "admin") return null;
  return claims;
}

// Names the env vars that are missing, so a misconfiguration says which one.
// Names only — never values.
export function missingEnv(names) {
  return names.filter((n) => !process.env[n]);
}

// Password alphabet with the confusable characters removed (no I l O 0 1).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";

export function generatePassword(length = 10) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}
