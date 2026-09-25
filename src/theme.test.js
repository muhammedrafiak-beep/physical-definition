// P1: token contrast (WCAG) for light and dark, read from src/index.css.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("./index.css", import.meta.url), "utf8").replace(/\r\n/g, "\n");
function block(sel) {
  // the token block: selector line followed (possibly after color-scheme) by --pd-bg
  let i = -1;
  for (let at = css.indexOf(sel + " {"); at >= 0; at = css.indexOf(sel + " {", at + 1)) {
    const body = css.slice(at, css.indexOf("}", at));
    if (body.includes("--pd-bg:")) { i = at; break; }
  }
  const body = css.slice(i, css.indexOf("}", i));
  return Object.fromEntries([...body.matchAll(/--pd-([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}
const light = block(":root"), dark = block(':root[data-theme="dark"]');
const lum = (h) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const PAIRS = [
  ["text", "bg", 15], ["text", "surf", 7], ["muted", "surf", 4.5], ["muted", "bg", 4.5], ["accent", "surf", 4.5],
  ["accent-strong", "accent-soft", 5.7], ["on-accent", "accent", 4.5], ["green", "green-soft", 4.5], ["red", "red-soft", 4.5],
  ["amber", "amber-soft", 4.5], ["on-navy", "navy", 7], ["on-navy-muted", "navy", 4.5], ["placeholder", "surf", 4.5],
  // P2 segmented control: selected text on its chip, and the chip outline
  // against the track (non-text contrast, WCAG 1.4.11).
  ["accent-strong", "accent-soft", 4.5], ["accent", "surf2", 3],
  // P2 Train day chip: selected outline against the page.
  ["accent", "bg", 3],
  // P2 Train day chip (selected) and the muted text inside the hero.
  ["on-navy-muted", "navy", 4.5],
];
for (const [name, pal] of [["light", light], ["dark", dark]]) {
  test(`${name}: every token pair meets its contrast target`, () => {
    for (const [fg, bg, min] of PAIRS) assert.ok(cr(pal[fg], pal[bg]) >= min, `${name} ${fg} on ${bg}: ${cr(pal[fg], pal[bg]).toFixed(2)} < ${min}`);
  });
}
test("dark and light define the same token names; system mirrors dark", () => {
  assert.deepEqual(Object.keys(dark).sort(), Object.keys(light).sort());
  const sys = css.slice(css.indexOf(':root[data-theme="system"] {\n    color-scheme: dark;'));
  for (const [k, v] of Object.entries(dark)) assert.ok(sys.includes(`--pd-${k}: ${v};`), k);
});
