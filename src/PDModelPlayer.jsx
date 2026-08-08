import { useEffect, useMemo, useRef, useState } from "react";

/**
 * PDModelPlayer
 * ----------------------------------------------------------------------------
 * Shows the PD Anatomy model as a POSITION-SCRUBBED sprite sheet.
 * There is no clock, no playback, no video element — so it cannot drift.
 * You feed it `position` (0 → 1) from the client's movement and it picks
 * the matching frame. Client stops, model stops. Client reverses, model
 * reverses.
 *
 * Sprite sheet layout must be a grid, filled left→right, top→bottom.
 * The glute-bridge sheet is 6 cols x 4 rows = 24 frames, 360x640 per frame.
 *
 * PROPS
 *   src            sprite sheet URL (required)
 *   position       0..1 movement position (required unless debug=true)
 *   frames         total frames in the sheet          default 24
 *   cols / rows    grid shape                         default 6 / 4
 *   reverse        true if frame 0 is the END of the movement
 *                  (our glute-bridge sheet starts at the TOP, so the
 *                   client's start-of-rep = last frame → reverse)
 *   aspect         frame aspect ratio, w/h            default 9/16
 *   debug          render a slider + frame readout for testing
 *   label          small caption under the model (optional)
 */
export default function PDModelPlayer({
  src,
  position,
  frames = 24,
  cols = 6,
  rows = 4,
  reverse = false,
  aspect = 9 / 16,
  debug = false,
  label,
}) {
  const [manual, setManual] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // preload so the first scrub doesn't flash
  useEffect(() => {
    if (!src) return;
    let alive = true;
    setLoaded(false);
    setFailed(false);
    const img = new Image();
    img.onload = () => alive && setLoaded(true);
    img.onerror = () => alive && setFailed(true);
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);

  const pos = debug ? manual : position;

  // ---- the whole trick is these three lines ----
  const { bgPos, frameIndex } = useMemo(() => {
    const p = Math.min(1, Math.max(0, Number(pos) || 0));
    const raw = Math.round(p * (frames - 1));
    const i = reverse ? frames - 1 - raw : raw;
    const col = i % cols;
    const row = Math.floor(i / cols);
    // with background-size at cols*100% / rows*100%, each step is a full
    // fraction of the *remaining* travel, hence the (n-1) divisor
    const x = cols > 1 ? (col / (cols - 1)) * 100 : 0;
    const y = rows > 1 ? (row / (rows - 1)) * 100 : 0;
    return { bgPos: `${x}% ${y}%`, frameIndex: i };
  }, [pos, frames, cols, rows, reverse]);

  return (
    <div style={S.wrap}>
      <div style={{ ...S.stage, aspectRatio: String(aspect) }}>
        {loaded && !failed && (
          <div
            style={{
              ...S.sprite,
              backgroundImage: `url(${src})`,
              backgroundSize: `${cols * 100}% ${rows * 100}%`,
              backgroundPosition: bgPos,
            }}
          />
        )}

        {!loaded && !failed && <div style={S.msg}>Loading model…</div>}
        {failed && (
          <div style={{ ...S.msg, color: "#E0A94A" }}>
            Sprite sheet not found
            <div style={S.msgSub}>{src}</div>
          </div>
        )}

        {label && <div style={S.label}>{label}</div>}
      </div>

      {debug && (
        <div style={S.panel}>
          <div style={S.panelTop}>
            <span style={S.panelTitle}>Movement position</span>
            <span style={S.readout}>
              {String(frameIndex + 1).padStart(2, "0")} / {frames}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(manual * 1000)}
            onChange={(e) => setManual(Number(e.target.value) / 1000)}
            style={S.range}
          />
          <div style={S.hint}>
            Drag slowly, then stop mid-rep — the model stops with you. Drag
            back and it runs backwards.
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper: turn a MediaPipe-style joint angle into a 0..1 position.
 * Pass the angle you already compute for rep counting.
 *   openAngle  = angle at the start of the rep (e.g. 170 for a straight leg)
 *   closedAngle = angle at the end of the rep  (e.g. 80 at the bottom)
 * Returns 0 at openAngle, 1 at closedAngle, clamped.
 */
export function angleToPosition(angle, openAngle, closedAngle) {
  if (angle == null || Number.isNaN(angle)) return 0;
  const t = (openAngle - angle) / (openAngle - closedAngle);
  return Math.min(1, Math.max(0, t));
}

const S = {
  wrap: { width: "100%", maxWidth: 420, margin: "0 auto" },
  stage: {
    position: "relative",
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    background:
      "radial-gradient(120% 70% at 50% 15%, #141B24, #0A0E13 65%, #06080B)",
    boxShadow: "0 0 0 1px rgba(224,169,74,.16), 0 24px 60px -20px #000",
  },
  sprite: {
    position: "absolute",
    inset: 0,
    backgroundRepeat: "no-repeat",
    // no transition — we want the frame to land instantly, not ease
  },
  msg: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    color: "rgba(234,242,247,.45)",
    fontSize: 13,
    fontFamily: "system-ui, -apple-system, sans-serif",
    textAlign: "center",
    padding: 20,
  },
  msgSub: {
    fontSize: 10.5,
    color: "rgba(234,242,247,.28)",
    wordBreak: "break-all",
  },
  label: {
    position: "absolute",
    left: 14,
    bottom: 12,
    fontSize: 11,
    letterSpacing: ".16em",
    textTransform: "uppercase",
    color: "rgba(224,169,74,.85)",
    fontWeight: 600,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  panel: {
    marginTop: 14,
    padding: "13px 15px 15px",
    borderRadius: 14,
    background: "#0C1117",
    border: "1px solid rgba(224,169,74,.14)",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  panelTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  panelTitle: {
    fontSize: 11,
    letterSpacing: ".15em",
    textTransform: "uppercase",
    color: "#E0A94A",
    fontWeight: 600,
  },
  readout: {
    fontSize: 15,
    fontWeight: 700,
    color: "#EAF2F7",
    fontVariantNumeric: "tabular-nums",
  },
  range: { width: "100%", accentColor: "#E0A94A", height: 26 },
  hint: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 1.5,
    color: "rgba(234,242,247,.32)",
  },
};
