// P1 shared primitives (premium V7). Small on purpose: screens adopt them in
// P2–P5 as they are restyled. All colours come from theme tokens, so every
// primitive works in Light, Dark and System.
import { G } from "./theme";

// Segmented control: role=radiogroup, 44 px targets.
export function Segmented({ label, value, options, onChange }) {
  return (
    <div role="radiogroup" aria-label={label}
      style={{ display: "grid", gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 4, background: G.surf2,
        border: `1px solid ${G.border}`, borderRadius: 14, padding: 4 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} role="radio" aria-checked={on} onClick={() => onChange(o.value)} className="btn"
            // P2: the selected option is an accent-soft chip with a 1.5 px
            // accent outline (>= 3:1 against the track in both themes) and
            // accent-strong text, so the choice reads clearly in dark too.
            style={{ minHeight: 44, borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: on ? G.accentSoft : "transparent", color: on ? G.accentStrong : G.muted,
              border: on ? `1.5px solid ${G.accent}` : "1.5px solid transparent" }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Pill({ tone = "accent", children, ltr = false }) {
  const t = { accent: [G.accentSoft, G.accentStrong], green: [G.greenSoft, G.green], red: [G.redSoft, G.red], amber: [G.amberSoft, G.amber] }[tone] || [G.surf2, G.muted];
  return <span dir={ltr ? "ltr" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: t[0], color: t[1], fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap" }}>{children}</span>;
}

export function Button({ variant = "primary", children, style, ...rest }) {
  const v = variant === "primary"
    ? { background: G.accent, color: G.onAccent, border: "none" }
    : { background: G.surf, color: G.accent, border: `1.5px solid ${G.accentLine}` };
  return <button className="btn" {...rest} style={{ minHeight: 48, borderRadius: 12, padding: "0 18px", fontSize: 15, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, ...v, ...style }}>{children}</button>;
}
