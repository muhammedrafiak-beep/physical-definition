// npm test  (node --test)   (built-in runner, no dependency)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { quantile, stats, createProbe } from "./probe.js";

globalThis.requestAnimationFrame = (fn) => fn();

test("quantile/stats", () => {
  assert.equal(quantile([3, 1, 2], 0.5), 2);
  assert.equal(quantile([], 0.5), null);
  const s = stats([10, 20, 30, 40, NaN]);
  assert.equal(s.n, 4); assert.equal(s.median, 25); assert.equal(s.max, 40);
});

test("timestamps pair send->result and intervals are computed from them", () => {
  let t = 0; const P = createProbe({ now: () => t });
  P.onVideoFrame(90, { captureTime: 80, presentedFrames: 1 });
  t = 100; P.beforeSend();
  t = 130; const f = P.onResult({ poseLandmarks: [{ x: 0.5, y: 0.5, z: 0, visibility: 1 }] });
  t = 134; P.afterDraw(f);                 // rAF stub fires immediately -> t_paint = 134
  P.state(f, { gate_ok: true, station: 0 });
  const s = P.summary();
  assert.equal(s.inference_ms.median, 30);
  assert.equal(s.draw_ms.median, 4);
  assert.equal(s.partial_ms.median, 134 - 80);   // uses captureTime when present
  assert.equal(s.meta.capture_time_available, true);
});

test("partial falls back to t_vfc when captureTime is missing (file replay)", () => {
  let t = 0; const P = createProbe({ now: () => t });
  P.onVideoFrame(50, {});
  t = 60; P.beforeSend(); t = 70; const f = P.onResult({}); t = 75; P.afterDraw(f);
  assert.equal(P.summary().partial_ms.median, 25);
  assert.equal(P.summary().meta.capture_time_available, false);
});

test("landmarks are recorded only when opted in", () => {
  const P = createProbe({ now: () => 0 });
  const res = { poseLandmarks: [{ x: 0.123456, y: 0, z: 0, visibility: 1 }], poseWorldLandmarks: [{ x: 1, y: 2, z: 3, visibility: 1 }] };
  P.beforeSend(); assert.equal(P.onResult(res).lm, undefined);
  P.setRecording(true); P.beforeSend(); const f = P.onResult(res);
  assert.deepEqual(f.lm, [[0.1235, 0, 0, 1]]); assert.deepEqual(f.wlm, [[1, 2, 3, 1]]);
});

test("probe module contains no network calls", () => {
  const src = readFileSync(new URL("./probe.js", import.meta.url), "utf8");
  for (const bad of ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "supabase"]) assert.ok(!src.includes(bad), bad);
});
