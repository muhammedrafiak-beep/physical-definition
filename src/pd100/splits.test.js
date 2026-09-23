import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { addSplit } from "./splits.js";

const STATIONS = ["Jump Squats", "Pull-ups", "Push-ups", "Burpees", "Plank Hold"].map((name) => ({ name }));

test("five splits, names in station order (regression: missing splits, shifted names)", () => {
  let list = [];
  const at = [40, 75, 110, 160, 220];             // invented times
  for (let i = 0; i < 5; i++) list = addSplit(list, STATIONS, i, at[i]);
  assert.deepEqual(list, STATIONS.map((s, i) => ({ name: s.name, at: at[i] })));
});

test("name is fixed at the time of the split, not read later", () => {
  let idx = 0;
  const list = addSplit([], STATIONS, idx, 40);
  idx += 1;                                       // what nextStation does right after
  assert.equal(list[0].name, "Jump Squats");
});

test("PDScore source: submit and dry-run read timesRef, splits use addSplit with the current index", () => {
  const src = readFileSync(new URL("../PDScore.jsx", import.meta.url), "utf8");
  assert.ok(!/stationTimes:\s*times\b/.test(src), "stationTimes must not come from React state");
  assert.equal((src.match(/stationTimes:\s*completedSplits/g) || []).length, 2);
  assert.ok(/finish\(timesRef\.current\); return; \}/.test(src), "final station finishes with the complete list before stationRef changes");
  assert.ok(/timesRef\.current = addSplit\(timesRef\.current, STATIONS, stationRef\.current, now\)/.test(src));
  assert.ok(!/setTimes\(p => \[\.\.\.p/.test(src), "old lazy updater must be gone");
});

test("synthetic fixture: old-code payload shows both defects; addSplit reproduces the true splits", () => {
  const fx = JSON.parse(readFileSync(new URL("./fixtures/splits-defect-synthetic.json", import.meta.url), "utf8"));
  const real = fx.splitEvents.map((e) => ({ name: e.name, at: e.at }));
  assert.equal(real.length, 5);
  assert.equal(fx.oldCodePayload.length, 3);                          // defect (a): splits missing
  assert.equal(fx.oldCodePayload[0].name, "Pull-ups");                // defect (b): name shifted
  assert.equal(fx.oldCodePayload[0].at, real[0].at);
  let fixed = []; fx.splitEvents.forEach((e) => { fixed = addSplit(fixed, STATIONS, e.station, e.at); });
  assert.deepEqual(fixed, real);
  assert.notDeepEqual(fixed, fx.oldCodePayload);
});
