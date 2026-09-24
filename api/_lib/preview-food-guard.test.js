import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { foodWriteBlocked, FOOD_WRITE_ACTIONS } from "./preview-food-guard.js";

test("food writes are refused everywhere except production (fail closed); reads pass", () => {
  for (const a of FOOD_WRITE_ACTIONS) {
    assert.equal(foodWriteBlocked(a, { VERCEL_ENV: "production" }), false);
    for (const env of [{ VERCEL_ENV: "preview" }, { VERCEL_ENV: "development" }, {}]) assert.equal(foodWriteBlocked(a, env), true);
  }
  for (const a of ["food.day", "food.search", "food.lookup", "photos.list"]) assert.equal(foodWriteBlocked(a, { VERCEL_ENV: "preview" }), false);
});

const src = readFileSync(new URL("../client-data.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("guard runs before any database client is created", () => {
  const g = src.indexOf("if (foodWriteBlocked(action))");
  assert.ok(g > 0 && g < src.indexOf("const db = createClient("));
});

test("food.day returns source, so the app can show which planned meals are logged", () => {
  assert.match(src, /\.select\("id, eaten_at, meal, name, brand, barcode, grams, source, " \+ NUTRIENTS\.join\(", "\)\)/);
});

test("food.add refuses a second log of the same planned meal on the same day, before inserting", () => {
  const add = src.slice(src.indexOf('case "food.add": {'), src.indexOf('case "food.delete": {'));
  const dup = add.indexOf('if (src.startsWith("plan:"))');
  assert.ok(dup > 0 && dup < add.indexOf('.insert([row])'));
  assert.match(add, /\.eq\("client_id", me\.id\)\s*\.eq\("eaten_on", isoDate\(body\.date\)\)\.eq\("source", src\)/);
  assert.match(add, /status\(409\)/);
  assert.match(add, /source: src,/);
});
