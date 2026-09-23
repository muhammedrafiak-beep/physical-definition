// PD-100 measurement probe (PR-1). OFF unless the page URL contains ?pdprobe=1.
//
// Nothing here is sent anywhere. Logs live in memory on this device and leave
// it only if the person taps "Save log", which saves a file locally.
//
// What each timestamp measures (all performance.now() milliseconds):
//   t_capture  requestVideoFrameCallback metadata.captureTime of the most recent
//              camera frame presented to the <video> element, if the browser
//              provides it (null otherwise). Closest available estimate of when
//              the camera captured the frame. Not available for file replay.
//   t_vfc      requestVideoFrameCallback "now" for that frame: when the browser
//              made the frame available to the page.
//   t_send     just before pose.send(): the frame is handed to MediaPipe.
//   t_result   start of onResults: landmarks are available to PD code.
//   t_drawn    after the canvas frame + skeleton are drawn (still in onResults).
//   t_paint    first requestAnimationFrame after t_drawn: the next frame the
//              browser will paint. The pixels reach the glass later still.
// Derived intervals:
//   inference_ms  = t_result - t_send     MediaPipe processing only
//   draw_ms       = t_drawn  - t_result   PD drawing + analyze()
//   to_paint_ms   = t_paint  - t_result
//   partial_ms    = t_paint  - (t_capture ?? t_vfc)
// partial_ms is NOT camera-to-screen latency: it omits sensor exposure and
// camera processing before t_capture, and compositor / display scan-out /
// panel response after t_paint. Glass-to-glass needs an external high-speed
// video of the person and the screen.

// Size bounds. Once a cap is reached further records are DROPPED (newest
// discarded, oldest kept) and counted; the summary and panel report it.
// Size: ~1.5 KB per frame with landmarks (measured in the sandbox smoke run),
// timing-only frames are far smaller; worst case at the caps is roughly
// 10-12 MB (estimate, not measured on a phone).
const MAX_FRAMES = 3600;          // landmark log cap (~2 min at 30 fps)
const MAX_TIMING_FRAMES = 20000;  // timing records (~11 min at 30 fps)
const MAX_EVENTS = 4000;          // routine events (rep, plank_tick, gate)
// Always kept regardless of MAX_EVENTS (a handful per run):
const KEY_EVENTS = new Set(["split", "submit_dry_run", "stop", "stop_plus_1s", "replay_end"]);
const r4 = (v) => (typeof v === "number" ? Math.round(v * 1e4) / 1e4 : v);

export function probeEnabled() {
  try { return new URLSearchParams(window.location.search).get("pdprobe") === "1"; }
  catch { return false; }
}

export function probeShortRun() {
  try { return new URLSearchParams(window.location.search).get("short") === "1"; }
  catch { return false; }
}

export function quantile(xs, q) {
  const a = xs.filter((v) => Number.isFinite(v)).sort((x, y) => x - y);
  if (!a.length) return null;
  const i = (a.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i);
  return a[lo] + (a[hi] - a[lo]) * (i - lo);
}

export function stats(xs) {
  const a = xs.filter((v) => Number.isFinite(v));
  return {
    n: a.length,
    median: quantile(a, 0.5),
    p95: quantile(a, 0.95),
    max: a.length ? Math.max(...a) : null,
  };
}

const packLm = (arr) =>
  arr ? arr.map((p) => [r4(p.x), r4(p.y), r4(p.z), r4(p.visibility)]) : null;

export function createProbe({ now = () => performance.now() } = {}) {
  const meta = {
    started_at: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    device_label: "",           // typed by the tester
    source: "camera",           // "camera" | "file"
    video_settings: null,       // MediaStreamTrack.getSettings()
    capture_time_available: false,
    short_run: probeShortRun(),
  };
  const frames = [];            // timing + state per processed frame
  const events = [];            // reps, station changes, gate changes, submit payload
  let recordLandmarks = false;
  let landmarkFrames = 0;
  let pending = null;           // frame between t_send and t_result
  let lastVfc = null;
  let camFramesSeen = 0, sends = 0, dupSends = 0, lastSentVfc = null;
  let lastGate = null;
  let framesDropped = 0, eventsDropped = 0;
  const pushEvent = (e) => {
    if (events.length < MAX_EVENTS || KEY_EVENTS.has(e.type)) events.push(e);
    else eventsDropped += 1;
  };

  return {
    meta,
    get recording() { return recordLandmarks; },
    setRecording(on) { recordLandmarks = !!on; },
    setDeviceLabel(s) { meta.device_label = String(s || "").slice(0, 80); },

    // requestVideoFrameCallback: called once per camera/video frame.
    onVideoFrame(nowVfc, md) {
      camFramesSeen += 1;
      const cap = md && Number.isFinite(md.captureTime) ? md.captureTime : null;
      if (cap !== null) meta.capture_time_available = true;
      lastVfc = { t_vfc: nowVfc, t_capture: cap, presented: md?.presentedFrames ?? null };
    },

    beforeSend() {
      sends += 1;
      // Same camera frame sent again (rAF loop faster than the camera)?
      const vfcNow = lastVfc?.t_vfc ?? null;
      if (vfcNow !== null && vfcNow === lastSentVfc) dupSends += 1;
      lastSentVfc = vfcNow;
      pending = {
        seq: sends,
        t_send: now(),
        t_vfc: lastVfc?.t_vfc ?? null,
        t_capture: lastVfc?.t_capture ?? null,
        cam_frames_seen: camFramesSeen,
      };
    },

    onResult(res) {
      const f = pending || { seq: null, t_send: null, t_vfc: null, t_capture: null };
      pending = null;
      f.t_result = now();
      f.person = !!res?.poseLandmarks;
      if (recordLandmarks && f.person && landmarkFrames < MAX_FRAMES) {
        f.lm = packLm(res.poseLandmarks);          // raw, NOT mirrored
        f.wlm = packLm(res.poseWorldLandmarks);
        landmarkFrames += 1;
      }
      // Beyond the cap the record is still returned (so the caller's code
      // path is unchanged) but not stored.
      if (frames.length < MAX_TIMING_FRAMES) frames.push(f); else framesDropped += 1;
      return f;
    },

    afterDraw(f) {
      f.t_drawn = now();
      requestAnimationFrame(() => { f.t_paint = now(); });
    },

    // Read-only copy of PD-100 state after analyze() ran on this frame.
    state(f, s) {
      Object.assign(f, s);
      if (s.gate_ok !== lastGate) {
        pushEvent({ t: now(), type: "gate", ok: s.gate_ok, station: s.station });
        lastGate = s.gate_ok;
      }
    },

    event(type, data = {}) { pushEvent({ t: now(), type, ...data }); },

    summary() {
      const iv = (fn) => stats(frames.map(fn));
      const ts = frames.map((f) => f.t_result).filter(Number.isFinite);
      const dur = ts.length > 1 ? (ts[ts.length - 1] - ts[0]) / 1000 : 0;
      return {
        meta,
        processed_frames: frames.length,
        person_frames: frames.filter((f) => f.person).length,
        gated_out_frames: frames.filter((f) => f.person && f.gate_ok === false).length,
        processed_fps: dur > 0 ? (frames.length - 1) / dur : null,
        camera_frames_seen: camFramesSeen,
        frames_sent: sends,
        camera_frames_not_sent: Math.max(0, camFramesSeen - (sends - dupSends)),
        duplicate_sends: dupSends,   // same camera frame processed again
        camera_fps: (() => { const d = dur; return d > 0 ? camFramesSeen / d : null; })(),
        inference_ms: iv((f) => f.t_result - f.t_send),
        draw_ms: iv((f) => f.t_drawn - f.t_result),
        to_paint_ms: iv((f) => f.t_paint - f.t_result),
        partial_ms: iv((f) => f.t_paint - (f.t_capture ?? f.t_vfc)),
        landmark_frames_recorded: landmarkFrames,
        landmark_cap: MAX_FRAMES,
        events: events.length,
        timing_frames_dropped: framesDropped,
        events_dropped: eventsDropped,
        truncated: framesDropped > 0 || eventsDropped > 0,
        caps: { timing_frames: MAX_TIMING_FRAMES, events: MAX_EVENTS, landmark_frames: MAX_FRAMES },
      };
    },

    exportLog() {
      return { format: "pd100-probe/1", summary: this.summary(), events, frames };
    },
  };
}

// Save a JSON file on this device only. No network call.
export function saveLocal(obj, name) {
  const blob = new Blob([JSON.stringify(obj)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
