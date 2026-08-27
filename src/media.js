// Which photo and which video belong to which exercise.
//
// This replaced three hardcoded substring ladders that lived in three
// different files — the photo one in ExerciseIllustration.jsx, and two
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

let state = { photoBase: "", videoBase: "", m: {}, loaded: false };
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
        m: data.m || {},
        loaded: true,
      };
      writeCache({ photoBase: next.photoBase, videoBase: next.videoBase, m: next.m });
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

export function useMedia() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// Exact name only — no substring guessing, ever again. If an exercise has no
// entry it has no photo, and saying so is more useful than showing the wrong
// movement.
export function photoUrl(media, name) {
  const e = media?.m?.[name];
  return e && e[0] && media.photoBase ? `${media.photoBase}/${e[0]}` : null;
}

export function videoUrl(media, name) {
  const e = media?.m?.[name];
  return e && e[1] && media.videoBase ? `${media.videoBase}/${e[1]}` : null;
}
