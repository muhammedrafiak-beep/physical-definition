// Password hashing for PD client accounts.
//
// Uses node's built-in scrypt — a real password KDF, no new dependency to
// install and nothing extra for Vercel to build. Stored format:
//
//   scrypt$<N>$<r>$<p>$<salt-base64>$<hash-base64>
//
// The parameters are stored alongside the hash so they can be raised later
// without invalidating existing passwords.

import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt);

const N = 16384; // CPU/memory cost
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 64 * 1024 * 1024;

export async function hashPassword(plain) {
  if (typeof plain !== "string" || plain.length === 0) {
    throw new Error("hashPassword: empty password");
  }
  const salt = randomBytes(16);
  const dk = await scrypt(plain, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${dk.toString("base64")}`;
}

export async function verifyPassword(plain, stored) {
  if (typeof plain !== "string" || typeof stored !== "string") return false;

  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  let salt, expected;
  try {
    salt = Buffer.from(parts[4], "base64");
    expected = Buffer.from(parts[5], "base64");
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;

  let dk;
  try {
    dk = await scrypt(plain, salt, expected.length, { N: n, r, p, maxmem: MAXMEM });
  } catch {
    return false;
  }
  return dk.length === expected.length && timingSafeEqual(dk, expected);
}

// True if a stored value is already a scrypt hash rather than a legacy
// plaintext password. Used by migrate-on-login.
export function isHashed(value) {
  return typeof value === "string" && value.startsWith("scrypt$");
}
