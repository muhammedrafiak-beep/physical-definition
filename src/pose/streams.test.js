import { test } from "node:test";
import assert from "node:assert/strict";
import { stopStreams, trackStates } from "./streams.js";

const track = () => ({ readyState: "live", stop() { this.readyState = "ended"; } });
const stream = (n) => { const ts = Array.from({ length: n }, track); return { getTracks: () => ts }; };

test("stops every track of both streams (regression: device check found PDScore's own stream live)", () => {
  const own = stream(1), cam = stream(2);
  assert.equal(stopStreams(own, cam), 3);
  assert.deepEqual(trackStates(own), ["ended"]);
  assert.deepEqual(trackStates(cam), ["ended", "ended"]);
});

test("null, duplicates and already-ended tracks are safe", () => {
  const s = stream(1);
  assert.equal(stopStreams(null, undefined, s, s), 1);
  assert.equal(stopStreams(s), 0);
  assert.deepEqual(trackStates(null), []);
});
