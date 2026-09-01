// Which photo, which clip and which model sprite belong to which exercise.
//
// This replaced three hardcoded substring ladders that lived in three
// different files — the photo one in the old ExerciseIllustration.jsx, and two
// identical copies of the video one in App.jsx and WorkoutPlayer.jsx. They
// could not be edited without a deploy, and substring matching cannot tell
// "close enough" from "wrong": every squat variant resolved to the barbell
// back squat photo, the chair-assisted mini squats in the senior programme
// included, while "Dumbbell Curl" got nothing at all with the right file
// sitting in the bucket the whole time.
//
// Now the answer is a table, the admin Library screen writes it, and this
// module reads it once per page load from /api/media-map.

import { useSyncExternalStore } from "react";

const CACHE_KEY = "pd_media_map_v1";

let state = { photoBase: "", videoBase: "", spriteBase: "", m: {}, loaded: false };
const subs = new Set();
let inflight = null;

function emit(next) {
  state = next;
  for (const fn of subs) fn();
}

// A copy of the last map that worked, used only if the fetch fails. The player
// runs in a gym on mobile data; losing every demo video to one dropped request
// is worse than showing a map that is a few minutes stale.
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && v.m && typeof v.m === "object" ? v : null;
  } catch { return null; }
}
function writeCache(v) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(v)); } catch { /* private mode, full quota */ }
}

export function loadMedia() {
  if (inflight) return inflight;

  // Paint from the cache immediately, then correct it when the map arrives.
  const cached = readCache();
  if (cached && !state.loaded) emit({ ...cached, loaded: true });

  inflight = fetch("/api/media-map")
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((data) => {
      const next = {
        photoBase: data.photoBase || "",
        videoBase: data.videoBase || "",
        spriteBase: data.spriteBase || "",
        m: data.m || {},
        loaded: true,
      };
      writeCache({
        photoBase: next.photoBase,
        videoBase: next.videoBase,
        spriteBase: next.spriteBase,
        m: next.m,
      });
      emit(next);
      return next;
    })
    .catch(() => {
      // Keep whatever the cache gave us. An exercise with no entry shows the
      // "No photo yet" placeholder, which is a state the app already handles.
      if (!state.loaded) emit({ ...state, loaded: true });
      return state;
    });

  return inflight;
}

function subscribe(fn) {
  subs.add(fn);
  loadMedia();
  return () => subs.delete(fn);
}
function getSnapshot() { return state; }

// For code that is not a component. The PDF builder is a plain function, and
// by the time anybody clicks Download the map loaded at startup is long since
// in. If it somehow is not, the exercise prints without a picture.
export function getMedia() { return state; }

export function useMedia() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// The row shape `api/media-map.js` sends, by index:
//
//   0 photo   1 video   2 sprite   3 display   4 cols   5 rows   6 frames
//
// Trailing nulls are trimmed there, so read defensively — a row with only a
// photo really is length 2. These two files are the only ones that know this
// shape; change one and change the other.
const PHOTO = 0, VIDEO = 1, SPRITE = 2, DISPLAY = 3, COLS = 4, ROWS = 5, FRAMES = 6;

// Exact name only — no substring guessing, ever again. If an exercise has no
// entry it has no photo, and saying so is more useful than showing the wrong
// movement.
export function photoUrl(media, name) {
  const e = media?.m?.[name];
  return e && e[PHOTO] && media.photoBase ? `${media.photoBase}/${e[PHOTO]}` : null;
}

export function videoUrl(media, name) {
  const e = media?.m?.[name];
  return e && e[VIDEO] && media.videoBase ? `${media.videoBase}/${e[VIDEO]}` : null;
}

// The PD Anatomy Model sheet, with the grid needed to cut it up. Both or
// neither: a sheet without its grid cannot be drawn, so it is treated as
// absent rather than rendered as one enormous frozen frame.
export function spriteFor(media, name) {
  const e = media?.m?.[name];
  if (!e || !e[SPRITE] || !media.spriteBase) return null;

  const cols = Number(e[COLS]) || 0;
  const rows = Number(e[ROWS]) || 0;
  const frames = Number(e[FRAMES]) || 0;
  if (cols < 1 || rows < 1 || frames < 1) return null;

  return { url: `${media.spriteBase}/${e[SPRITE]}`, cols, rows, frames: Math.min(frames, cols * rows) };
}

// What this exercise should show, in one place, so the player, the printed
// plan and the admin preview can never disagree about it.
//
// Rafi's choice comes first. If what he chose is not there, we fall THROUGH
// rather than showing nothing — a named source that is missing is a gap to
// fill, not a reason to hand a client an empty box. After that the order is
// clip, then model, then photo: the clip shows the movement, the model shows
// the movement, and a still photo only implies it.
export function resolveMedia(media, name) {
  const video = videoUrl(media, name);
  const sprite = spriteFor(media, name);
  const photo = photoUrl(media, name);

  const e = media?.m?.[name];
  const want = (e && e[DISPLAY]) || "auto";

  if (want === "video" && video) return { kind: "video", url: video };
  if (want === "sprite" && sprite) return { kind: "sprite", ...sprite };
  if (want === "photo" && photo) return { kind: "photo", url: photo };

  if (video) return { kind: "video", url: video };
  if (sprite) return { kind: "sprite", ...sprite };
  if (photo) return { kind: "photo", url: photo };
  return { kind: "none" };
}
