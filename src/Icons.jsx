// One drawn icon set, shared by every screen.
//
// It replaces the emoji, which were the loudest thing in the old design and
// none of which were ours: a trophy renders as a different picture on every
// phone, carries a cartoon register a health service should not have, and is
// read aloud by a screen reader as "trophy" where the word "PD-100" was
// wanted. These are 24px on a 1.7 stroke, they inherit their colour, and they
// are hidden from assistive technology — the word beside them is the label,
// and saying it twice helps nobody.
//
// Its own module because both the app shell and the player need it, and
// importing one from the other would close the loop App -> Player -> App.

const SOLID = new Set(["play", "check", "dot"]);
const ICONS = {
  train: <path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" />,
  food: <path d="M6 3v8a3 3 0 0 0 6 0V3M9 11v10M18 3c-1.6 1.4-2.5 3.4-2.5 5.5 0 1.7 1 2.9 2.5 2.9V21" />,
  score: <><path d="M8 4h8v4a4 4 0 0 1-8 0Z" /><path d="M16 5h3v2a3 3 0 0 1-3 3M8 5H5v2a3 3 0 0 0 3 3" /><path d="M10 20h4M12 12v8" /></>,
  progress: <><path d="M4 18 9.5 12l3.5 3.5L20 7" /><path d="M15 7h5v5" /></>,
  history: <><path d="M12 7.5V12l3 1.8" /><path d="M3.6 12a8.4 8.4 0 1 0 2.3-5.8" /><path d="M3 4.2v4h4" /></>,
  you: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  whatsapp: <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 20.5l1.6-4.9a8.4 8.4 0 0 1-1-4.1 8.4 8.4 0 0 1 8.4-8.4 8.4 8.4 0 0 1 9 8.4Z" />,
  play: <path d="M8 5.5v13l11-6.5z" />,
  check: <path d="M20.3 6.3 9.6 17l-5.9-5.9 1.4-1.4 4.5 4.5 9.3-9.3z" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  alert: <><path d="M12 8.5v4.5" /><path d="M12 16.6h.01" /><path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20.2h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>,
  heart: <path d="M12 20.3 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 1 1 19.4 13Z" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 1.8" /></>,
  scale: <><path d="M12 4.5v3" /><circle cx="12" cy="4" r="1.4" /><path d="M4.5 20h15" /><path d="M7 8h10l3 6a4 4 0 0 1-8 0l3-6" /></>,
  flame: <path d="M12 3s5 4.2 5 8.6a5 5 0 0 1-10 0c0-1.6.7-3 1.6-4.1.2 1.3.9 2.2 1.8 2.2 1.2 0 1.9-1.1 1.9-2.8 0-1.4-.5-2.6-1.3-3.9Z" />,
  camera: <><path d="M4 8h3l1.6-2h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13.5" r="3.4" /></>,
  leaf: <><path d="M20 4c0 9-5.6 13-10 13a5 5 0 0 1 0-10c4.4 0 7.5-1 10-3Z" /><path d="M11 13c-2.6 1.6-4.4 4-5 7" /></>,
  medal: <><circle cx="12" cy="14.5" r="5.5" /><path d="M8.5 9.2 6 3h5l1.6 3.6M15.5 9.2 18 3h-5" /></>,
  book: <><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5Z" /><path d="M4 19.5A1.5 1.5 0 0 1 5.5 18H19v3H5.5A1.5 1.5 0 0 1 4 19.5Z" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3.5v3M16 3.5v3" /></>,
  trash: <><path d="M4.5 7h15" /><path d="M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" /><path d="M6.5 7l.8 12.1A1.5 1.5 0 0 0 8.8 20.5h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" /></>,
  pause: <path d="M9.5 5.5v13M14.5 5.5v13" />,
  ai: <><path d="M12 3.5 13.4 8 18 9.4 13.4 10.8 12 15.3 10.6 10.8 6 9.4 10.6 8Z" /><path d="M18.5 15.5l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7Z" /></>,
  bars: <><path d="M4.5 20V11M9.8 20V4.5M15.2 20v-6M20.5 20V8" /></>,
  ruler: <><path d="M3.2 15.6 15.6 3.2a1.5 1.5 0 0 1 2.1 0l3.1 3.1a1.5 1.5 0 0 1 0 2.1L8.4 20.8a1.5 1.5 0 0 1-2.1 0l-3.1-3.1a1.5 1.5 0 0 1 0-2.1Z" /><path d="m8 11 2 2M11 8l2 2M14 5l2 2M5 14l2 2" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.4" /></>,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  share: <><circle cx="18" cy="5.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="18.5" r="2.5" /><path d="m8.2 10.8 7.6-4M8.2 13.2l7.6 4" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2.2" /><path d="M15 6.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h.5" /></>,
  spark: <path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9Z" />,
  dumbbell: <path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" />,
};
export const Icon = ({ n, s = 20, c = "currentColor", w = 1.7, sx = {} }) => {
  const g = ICONS[n];
  if (!g) return null;
  const solid = SOLID.has(n);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true" focusable="false"
      fill={solid ? c : "none"} stroke={solid ? "none" : c}
      strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: "block", ...sx }}>{g}</svg>
  );
};
