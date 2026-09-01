import { useEffect, useMemo, useRef, useState } from "react";
import { useMedia, resolveMedia } from "./media";
import { Icon } from "./Icons";

// One box, three possible things inside it, and nothing moves when it changes.
//
// Before this there were two different boxes: the clip filled a dark
// `flex: 1` container, and an exercise with no clip fell to
// `ExerciseIllustration`, which drew a `max-width: 396px, height: auto` image
// on a lighter ground with its own padding. So the frame changed size and
// colour between one exercise and the next, and again when a clip finished
// loading — the layout jumping mid-session, with the countdown chip drawn
// twice because each branch carried its own copy.
//
// Everything now renders into the same box at the same size with the same
// ground, `object-fit: contain`, so the only thing that changes between a
// clip, the model and a photo is the picture.
//
// WHY THE MODEL LOOPS BACK ON ITSELF. The sprite sheets are half a rep — the
// squat sheet runs from standing to the bottom and stops there. Playing one
// forward on a loop would teleport from the bottom back to standing every
// cycle. Running it forwards then backwards gives a full rep, ends where it
// began, and — this is the point — cannot produce a jump even on a sheet that
// does hold a whole rep. There is no per-sheet setting to get wrong.

const CYCLE_MS = 1500;   // one direction; a full down-and-up is twice this

export function MediaFrame({
  name,
  videoRef,            // the player drives play/pause through this
  paused = false,      // freezes the model; the clip is driven by videoRef
  skipVideo = false,   // the clip errored — fall through to the next source
  onVideoError,
  onVideoReady,
  loading = false,     // paint the spinner over whatever is there
  aspect,              // e.g. 9/16 to make its own box; omit to fill the parent
  rounded = 0,
  ground = "#0A1727",
  emptyLabel = "No demo yet",
  children,            // overlays that belong inside the frame
}) {
  const media = useMedia();
  const picked = resolveMedia(media, name);

  // A clip that will not load is not a choice any more, so re-resolve without
  // it rather than showing an empty player.
  const shown = skipVideo && picked.kind === "video"
    ? resolveMediaWithoutVideo(media, name)
    : picked;

  const box = {
    position: "relative",
    width: "100%",
    height: aspect ? "auto" : "100%",
    aspectRatio: aspect ? String(aspect) : undefined,
    background: ground,
    overflow: "hidden",
    borderRadius: rounded || undefined,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={box}>
      {shown.kind === "video" && (
        <video
          key={shown.url}
          ref={videoRef}
          src={shown.url}
          preload="auto"
          style={fill}
          loop muted playsInline autoPlay
          onError={onVideoError}
          onLoadedData={onVideoReady}
        />
      )}

      {shown.kind === "sprite" && <Sprite {...shown} paused={paused} />}

      {shown.kind === "photo" && (
        <img src={shown.url} alt={name} style={fill} draggable={false} />
      )}

      {shown.kind === "none" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 0.35, color: "currentColor" }}>
          <Icon n="dumbbell" s={24} />
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".03em" }}>
            {media.loaded ? emptyLabel : " "}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ position: "absolute", inset: 0, background: ground, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="sp" style={{ width: 26, height: 26, borderWidth: 2 }} />
        </div>
      )}

      {children}
    </div>
  );
}

const fill = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  display: "block",
  pointerEvents: "none",
};

// `resolveMedia` with the clip taken off the table.
function resolveMediaWithoutVideo(media, name) {
  const r = resolveMedia(media, name);
  if (r.kind !== "video") return r;
  const stripped = { ...media, m: { ...media.m } };
  const row = stripped.m[name];
  if (Array.isArray(row)) {
    const copy = row.slice();
    copy[1] = null;
    stripped.m[name] = copy;
  }
  return resolveMedia(stripped, name);
}

// The PD Anatomy Model sheet, one frame at a time.
//
// Drawn as a background rather than 24 stacked images: one request, one
// decode, and stepping is a `background-position` change the compositor
// handles without touching the DOM.
function Sprite({ url, cols, rows, frames, paused }) {
  const [i, setI] = useState(0);
  const [size, setSize] = useState(null);   // the sheet's natural pixels
  const [failed, setFailed] = useState(false);
  const raf = useRef(0);

  const reduced = usePrefersReducedMotion();

  // Preload, and measure — the frame's shape decides how the sheet is fitted
  // into the box, and it cannot be known before the image is in.
  useEffect(() => {
    let alive = true;
    setSize(null);
    setFailed(false);
    const img = new Image();
    img.onload = () => alive && setSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => alive && setFailed(true);
    img.src = url;
    return () => { alive = false; };
  }, [url]);

  // Forwards, then backwards, forever. `frames - 1` steps each way, so the
  // turning frames are not held twice as long as the rest.
  useEffect(() => {
    if (paused || reduced || !size || frames < 2) return;
    const span = frames - 1;
    const start = performance.now();

    const tick = (t) => {
      const p = ((t - start) / CYCLE_MS) % 2;          // 0..2
      const tri = p <= 1 ? p : 2 - p;                  // 0..1..0
      setI(Math.round(tri * span));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [paused, reduced, size, frames, url]);

  // Reduced motion holds the MIDDLE frame, not an end one. The sheets do not
  // agree on which end is which: the squat runs standing → bottom, and the
  // glute bridge runs hips-up → hips-down. Either end is the rest position on
  // one of them, and a still of somebody lying on the floor does not say what
  // the exercise is. The middle is mid-movement on both.
  useEffect(() => {
    if (reduced) setI(Math.floor((frames - 1) / 2));
  }, [reduced, frames, url]);

  const { bgPos, frameAspect } = useMemo(() => {
    const idx = Math.min(Math.max(i, 0), frames - 1);
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    // With background-size at cols*100% / rows*100%, each step is a fraction
    // of the *remaining* travel — hence the (n - 1) divisor, not n.
    const x = cols > 1 ? (col / (cols - 1)) * 100 : 0;
    const y = rows > 1 ? (row / (rows - 1)) * 100 : 0;
    const fa = size ? (size.w / cols) / (size.h / rows) : 9 / 16;
    return { bgPos: `${x}% ${y}%`, frameAspect: fa };
  }, [i, cols, rows, frames, size]);

  if (failed) return null;
  if (!size) return null;   // the caller's ground shows through; no flash

  return (
    <div
      style={{
        // `contain`, done by hand: the frame keeps its own shape and is capped
        // by whichever side of the box runs out first.
        aspectRatio: String(frameAspect),
        maxWidth: "100%",
        maxHeight: "100%",
        height: "100%",
        backgroundImage: `url(${url})`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: bgPos,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}
