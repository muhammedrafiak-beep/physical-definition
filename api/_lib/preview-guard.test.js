import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { previewWriteBlocked } from "./preview-guard.js";

test("submit is blocked everywhere except production (fail closed)", () => {
  assert.equal(previewWriteBlocked("submit", { VERCEL_ENV: "production" }), false);
  for (const env of [{ VERCEL_ENV: "preview" }, { VERCEL_ENV: "development" }, {}]) assert.equal(previewWriteBlocked("submit", env), true);
  assert.equal(previewWriteBlocked("board", { VERCEL_ENV: "preview" }), false);
});

test("guard runs before auth, env checks, rate limit and any DB call in api/pd-score.js", () => {
  const src = readFileSync(new URL("../pd-score.js", import.meta.url), "utf8");
  const g = src.indexOf("previewWriteBlocked(String(");
  assert.ok(g > 0);
  for (const later of ["missing.push(", "requireClient(req", "createClient(", "rateLimit(db", '.from("pd_scores").insert']) {
    assert.ok(src.indexOf(later) > g, later + " must come after the guard");
  }
});
