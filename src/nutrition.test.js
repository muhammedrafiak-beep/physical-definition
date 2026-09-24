import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./FoodDiary.jsx", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const planKeySrc = src.match(/export const planKey = \(planId, time\) => `plan:\$\{planId\}@\$\{time\}`\.slice\(0, 20\);/);

test("planKey fits the 20-char source column limit for every shipped plan", async () => {
  assert.ok(planKeySrc, "planKey definition changed");
  const { MEALS } = await import("./meals.js");
  const planKey = (id, t) => `plan:${id}@${t}`.slice(0, 20);
  const keys = new Set();
  for (const p of MEALS) for (const m of p.meals) {
    const full = `plan:${p.id}@${m.time}`;
    assert.ok(full.length <= 20, full);
    const k = planKey(p.id, m.time);
    assert.ok(!keys.has(k), "duplicate key " + k);   // times unique within a plan
    keys.add(k);
  }
});

test("the Meal plan view logs through the existing food.add with the plan key, and never on a view switch", () => {
  assert.match(src, /action: "food\.add", date, meal: m\.label, name: m\.items \|\| m\.label, source: m\.key,/);
  const tabs = src.slice(src.indexOf('role="tablist"'), src.indexOf("{err && <div style={errBox} role=\"alert\">"));
  assert.ok(!/post\(/.test(tabs), "the Diary/Meal plan switch must not call the API");
});

test("no sample nutrition data in production code", () => {
  assert.ok(!/Test Client|example\.invalid|synthetic/i.test(src));
});
