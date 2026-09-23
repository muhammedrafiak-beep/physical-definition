// Camera stream cleanup. PDScore opens its own getUserMedia stream and the
// MediaPipe camera_utils Camera opens a second one (confirmed on a phone during
// PR-1). Every track of every stream must be stopped on Quit,
// completion, error and unmount, or the camera stays on.

export function trackStates(stream) {
  try { return (stream?.getTracks?.() || []).map((t) => t.readyState); }
  catch { return []; }
}

// Stops every track of every distinct stream given. Returns how many tracks
// were stopped. Safe with null/undefined and with the same stream twice.
export function stopStreams(...streams) {
  const seen = new Set();
  let n = 0;
  for (const s of streams) {
    if (!s || seen.has(s)) continue;
    seen.add(s);
    for (const t of s.getTracks?.() || []) {
      try { if (t.readyState !== "ended") { t.stop(); n += 1; } } catch { /* ignore */ }
    }
  }
  return n;
}
