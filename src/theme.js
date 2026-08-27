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

export const G = {
  bg: "#F3F6FA", surf: "#FFFFFF", surf2: "#F3F6FA",
  border: "#E4E9F0", borderHi: "#CBD6E6",
  // `line` is the same hairline as `border`, under the name the night palette
  // uses for it. Both spellings appear across the app.
  line: "#E4E9F0",
  gold: "#21509B",
  grad: "linear-gradient(180deg,#16304F,#0E2035)",
  text: "#0E2035", muted: "#5C6D84", dim: "#93A2B7",
  green: "#12795A", red: "#A63A3A", amber: "#9A6212", blue: "#21509B",

  // Additive. A dark theme can wash a colour over the page at 10% alpha and
  // get a tint; over white the same wash goes grey. Light themes need the
  // tint mixed properly, so each status colour gets a companion fill.
  ink: "#0E2035", paper: "#FCFCFD", soft: "#F3F6FA",
  // `dim` is decorative only — empty-state icons, hairlines, the chevron in a
  // select. Anything a person has to READ uses `muted`, which is measured.
  accent: "#21509B", accentSoft: "#E8EEF8", accentLine: "#D3E0F2",
  greenSoft: "#E6F2ED", greenLine: "#C9E3D8",
  amberSoft: "#FBF2E3", amberLine: "#EFE0C2",
  redSoft: "#FBECEC", redLine: "#F0D6D6",

  // NIGHT — the player and the camera views.
  nBg: "#0E2035", nSurf: "#152B45", nSurf2: "#1B3350", nLine: "#24405F",
  nText: "#FCFCFD", nMuted: "#8FA3BE", nAccent: "#8FB4EA",
  // Status colours that still read over the night background, where the day
  // green and red are too dark to see.
  nGreen: "#4ADE80", nRed: "#F87171",
};
