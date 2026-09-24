// P0 coverage check: every API action that writes to the database or storage
// must be refused on non-production deployments.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { writeBlocked, isProduction, CLIENT_WRITES, ADMIN_DATA_WRITES, ADMIN_MEDIA_WRITES } from "./preview-writes.js";
import { FOOD_WRITE_ACTIONS } from "./preview-food-guard.js";

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const WRITE_CALL = /\.(insert|update|upsert|delete)\(|\.storage\s*\.from\([^)]*\)\s*\.(remove|upload|createSignedUploadUrl|move|copy)\(|recordLog\(|\.rpc\(/;

// Split a handler into its `case "x":` blocks.
function caseBlocks(src) {
  const out = {}; const re = /case "([^"]+)":/g; const idx = [];
  let m; while ((m = re.exec(src))) idx.push([m[1], m.index]);
  idx.forEach(([name, at], i) => { out[name] = src.slice(at, i + 1 < idx.length ? idx[i + 1][1] : src.length); });
  return out;
}

for (const [file, guarded] of [["client-data.js", new Set([...CLIENT_WRITES, ...FOOD_WRITE_ACTIONS])], ["admin-data.js", ADMIN_DATA_WRITES], ["admin-media.js", ADMIN_MEDIA_WRITES]]) {
  test(`${file}: every action with a DB/storage write is guarded`, () => {
    const blocks = caseBlocks(read(file));
    const writers = Object.entries(blocks).filter(([, b]) => WRITE_CALL.test(b)).map(([n]) => n);
    assert.ok(writers.length > 0);
    // food.lookup only writes the shared barcode cache, and only in production.
    const allowedIfProdOnly = (n) => n === "food.lookup" && /if \(isProduction\(\)\) await db\.from\("food_barcodes"\)\.upsert/.test(blocks[n]);
    const missing = writers.filter((n) => !guarded.has(n) && !allowedIfProdOnly(n));
    assert.deepEqual(missing, [], "unguarded write actions: " + missing.join(", "));
  });
}

test("guard sets block on preview/development/unset and pass in production", () => {
  for (const set of [CLIENT_WRITES, ADMIN_DATA_WRITES, ADMIN_MEDIA_WRITES]) for (const a of set) {
    assert.equal(writeBlocked(set, a, { VERCEL_ENV: "production" }), false);
    for (const env of [{ VERCEL_ENV: "preview" }, { VERCEL_ENV: "development" }, {}]) assert.equal(writeBlocked(set, a, env), true);
  }
  assert.equal(isProduction({ VERCEL_ENV: "production" }), true);
});

test("each guard runs before the database client is created", () => {
  for (const [f, needle] of [["client-data.js", "writeBlocked(CLIENT_WRITES, action)"], ["admin-data.js", "writeBlocked(ADMIN_DATA_WRITES, action)"],
    ["admin-media.js", "writeBlocked(ADMIN_MEDIA_WRITES, action)"], ["admin-reset-password.js", "if (!isProduction()) return sendPreviewBlocked(res);"],
    ["signup.js", "if (!isProduction()) return sendPreviewBlocked(res);"]]) {
    const src = read(f); const g = src.indexOf(needle);
    assert.ok(g > 0 && g < src.indexOf("createClient("), f);
  }
});
