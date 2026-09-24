// Direction A, in one place.
//
// This lived inside App.jsx, and three other files had grown their own partial
// copies of it — PDScore, WorkoutHistory and AIFormCheck each re-declared a
// `G` with the handful of keys they needed. Every one of those copies was a
// place the palette could drift, and one of them already had: AIFormCheck's
// muted grey was #666 over the near-black player background, a contrast ratio
// no one can read.
//
// One object now. A screen that needs the dark treatment uses the n* keys
// rather than inventing its own dark.
//
// DAY is for the client screens and the admin. NIGHT is the player and the
// camera views — held over live video, so it has to be genuinely dark rather
// than a light theme with the lights turned down.

// P1 (premium V7): the DAY keys are CSS custom properties now, defined for
// light / dark / system in src/index.css. Every inline style keeps writing
// `G.text`, `G.surf`… and follows the chosen appearance automatically.
// Rules that come with it:
//   • a filled accent button's text is G.onAccent (white on light, near-black
//     on dark — white on the dark-mode accent is only 2.3:1);
//   • a dark hero / summary block is G.navy (or G.grad) with G.onNavy text; it
//     stays dark in both appearances;
//   • accent text on G.accentSoft uses G.accentStrong.
// The NIGHT keys (player and camera views) are fixed hex: those screens are
// dark in every appearance.
const v = (name) => `var(--pd-${name})`;

export const G = {
  bg: v("bg"), surf: v("surf"), surf2: v("surf2"),
  border: v("border"), borderHi: v("border-hi"),
  line: v("border"),
  gold: v("accent"),
  grad: v("grad"),
  text: v("text"), muted: v("muted"), dim: v("dim"), placeholder: v("placeholder"),
  green: v("green"), red: v("red"), amber: v("amber"), blue: v("accent"),

  // `ink` is text colour; a dark block behind light text is `navy`.
  ink: v("text"), paper: v("on-navy"), soft: v("surf2"),
  accent: v("accent"), accentStrong: v("accent-strong"), onAccent: v("on-accent"),
  accentSoft: v("accent-soft"), accentLine: v("accent-line"),
  greenSoft: v("green-soft"), greenLine: v("green-line"),
  amberSoft: v("amber-soft"), amberLine: v("amber-line"),
  redSoft: v("red-soft"), redLine: v("red-line"),
  navy: v("navy"), onNavy: v("on-navy"), onNavyMuted: v("on-navy-muted"),
  nav: v("nav"), shadow: v("shadow"),

  // NIGHT — the player and the camera views (fixed, not themed).
  nBg: "#0E2035", nSurf: "#152B45", nSurf2: "#1B3350", nLine: "#24405F",
  nText: "#FCFCFD", nMuted: "#8FA3BE", nAccent: "#8FB4EA",
  nGreen: "#4ADE80", nRed: "#F87171",
};

// ── Appearance: "light" | "dark" | "system" ───────────────────
const KEY = "pd_theme";
export function getAppearance() {
  try { const t = localStorage.getItem(KEY); return t === "dark" || t === "system" ? t : "light"; } catch { return "light"; }
}
export function applyAppearance(t) {
  const val = t === "dark" || t === "system" ? t : "light";
  try { document.documentElement.setAttribute("data-theme", val); } catch { /* no DOM */ }
  return val;
}
export function setAppearance(t) {
  const val = applyAppearance(t);
  try { localStorage.setItem(KEY, val); } catch { /* storage off */ }
  return val;
}
