// The trainer's assessment screen — filled in with the client in the room.
//
// This is the thing that replaces guessing a body from a birthday. Everything
// else about a person's programme should follow from what gets recorded here.
//
// Three things happen on one screen, on purpose: they are one conversation.
//   PAR-Q        — the screening that should have happened before any
//                  programme was ever handed out, and for the existing
//                  clients never did.
//   Capabilities — what they can do, graded. "With support" and "without" are
//                  rungs of one ladder, not pass and fail.
//   Tests        — the numbers, taken to protocol, that show progression.
//
// Then it shows what those levels unlock and what they do not, so the trainer
// sees the consequence of the assessment before he saves it.

import { useState, useMemo } from "react";
import {
  CAPABILITIES, TESTS, describeChairStand, chairStandAgeEquivalent,
  meetsRequirement, blockedBy,
} from "./assessment";
import { getExerciseRequirement } from "./exerciseMeta";

const adminToken = () => {
  try { return sessionStorage.getItem("pd_admin_token") || ""; } catch { return ""; }
};

async function post(action, payload) {
  const r = await fetch("/api/admin-data", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken()}` },
    body: JSON.stringify({ action, ...payload }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "That didn't work. Try again.");
  return d;
}

export function AssessmentForm({
  client, G, parq: PARQ = [], exercises = [], onClose, onSaved,
  // How to spell a programme id for a human. App.jsx knows the list; this
  // screen only needs the name.
  systemName = (id) => id,
}) {
  const [levels, setLevels] = useState({});
  const [tests, setTests] = useState({});
  const [parqAns, setParqAns] = useState({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  // Set when the saved measurement disagrees with the programme the client is
  // on. The server never acts on this — it is put in front of the trainer.
  const [suggestion, setSuggestion] = useState(null);

  const setLevel = (id, v) => setLevels(p => ({ ...p, [id]: v }));
  const setTest = (id, v) => setTests(p => ({ ...p, [id]: v }));

  const chair = Number(tests.chair_stand_30s);
  const chairSays = describeChairStand(chair, client?.age, client?.gender);
  const physicalAge = chairStandAgeEquivalent(chair, client?.gender);

  // Live consequence of the levels chosen so far, against the exercises this
  // client's programme actually contains.
  const verdict = useMemo(() => {
    const allowed = [], blocked = [];
    for (const name of exercises) {
      const req = getExerciseRequirement(name);
      if (meetsRequirement(levels, req)) allowed.push(name);
      else blocked.push({ name, reasons: blockedBy(levels, req) });
    }
    return { allowed, blocked };
  }, [levels, exercises]);

  const parqFlags = PARQ.filter(q => parqAns[q.id] === true);
  const parqAnswered = PARQ.every(q => parqAns[q.id] === true || parqAns[q.id] === false);

  const save = async () => {
    setErr(""); setSaving(true);
    try {
      const cleanTests = {};
      for (const [k, v] of Object.entries(tests)) {
        const n = Number(v);
        if (v !== "" && v !== null && v !== undefined && Number.isFinite(n)) cleanTests[k] = n;
      }
      const out = await post("save_assessment", {
        clientId: client.id,
        levels,
        tests: cleanTests,
        // Only send a PAR-Q if the whole thing was answered. A half-filled
        // screening recorded as a screening is worse than none.
        parqAnswers: parqAnswered ? Object.fromEntries(PARQ.map(q => [q.id, !!parqAns[q.id]])) : null,
        notes,
      });
      // Refresh the list either way — the assessment is saved by this point.
      onSaved?.();
      if (out.suggestion) setSuggestion(out.suggestion);
      else onClose?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const H = ({ children, sub }) => (
    <div style={{ marginTop: 22, marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: G.muted, letterSpacing: ".09em", textTransform: "uppercase", fontWeight: 600 }}>{children}</div>
      {sub && <div style={{ fontSize: 11, color: G.muted, marginTop: 4, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );

  if (suggestion) {
    return (
      <div>
        <div className="sf" style={{ fontSize: 26, lineHeight: 1.15, color: G.text }}>Saved</div>
        <div style={{ fontSize: 12, color: G.muted, marginTop: 3 }}>{client?.name}</div>

        <div style={{ marginTop: 18, padding: "14px 15px", background: G.surf2, border: `1px solid ${G.borderHi}`, borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: G.muted, letterSpacing: ".09em", textTransform: "uppercase", fontWeight: 600 }}>
            What you measured does not match the programme
          </div>
          <div style={{ fontSize: 13, color: G.text, marginTop: 10, lineHeight: 1.7 }}>
            On: <b>{systemName(suggestion.current) || "no programme"}</b>
            <br />
            Suggested: <b style={{ color: G.gold }}>{systemName(suggestion.systemId)}</b>
          </div>
          <div style={{ fontSize: 12, color: G.muted, marginTop: 10, lineHeight: 1.6 }}>{suggestion.reason}</div>
          {(suggestion.warnings || []).map((w, i) => (
            <div key={i} style={{ fontSize: 11, color: G.amber, marginTop: 6, lineHeight: 1.55 }}>• {w}</div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: G.dim, marginTop: 12, lineHeight: 1.6 }}>
          Nothing has been changed. You saw them do it; the app only did the
          arithmetic. If the measurement was taken on a bad day, or you know
          something the six ladders do not, keep them where they are.
        </div>

        {err && (
          <div style={{ marginTop: 12, padding: "9px 11px", border: `1px solid ${G.red}`, borderRadius: 8, color: G.red, fontSize: 12 }}>{err}</div>
        )}

        <div style={{ display: "flex", gap: 9, marginTop: 18 }}>
          <button type="button" className="btn" disabled={saving}
            onClick={async () => {
              setErr(""); setSaving(true);
              try {
                await post("set_workout_system", {
                  clientId: client.id,
                  systemId: suggestion.systemId,
                  reason: suggestion.reason,
                });
                onSaved?.();
                onClose?.();
              } catch (e) {
                setErr(e.message);
              } finally {
                setSaving(false);
              }
            }}
            style={{ flex: 1, padding: "12px", borderRadius: 12, background: G.grad, color: "#FCFCFD", fontWeight: 700, fontSize: 13 }}>
            {saving ? "Changing…" : `Move to ${systemName(suggestion.systemId)}`}
          </button>
          <button type="button" className="btn" onClick={onClose} disabled={saving}
            style={{ padding: "12px 16px", borderRadius: 12, background: G.surf2, color: G.muted, border: `1px solid ${G.border}`, fontSize: 13 }}>
            Keep as is
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sf" style={{ fontSize: 26, lineHeight: 1.15, color: G.text }}>Assessment</div>
      <div style={{ fontSize: 12, color: G.muted, marginTop: 3 }}>
        {client?.name} · {client?.age}y
      </div>

      {/* ── PAR-Q ─────────────────────────────────────────── */}
      <H sub="Ask these with them, not about them. Any yes means no programme until a doctor has cleared it.">
        Health screening
      </H>
      {PARQ.map(q => {
        const v = parqAns[q.id];
        return (
          // Full-width answers on a phone, stacked under the question. These
          // used to be 41x26 with five pixels between them — the smallest
          // buttons in the app, recording the answers that decide whether
          // somebody trains at all. See the .parq-* rules in App.jsx.
          <div key={q.id} className="parq-row" style={{ padding: "11px 0", borderBottom: `1px solid ${G.border}` }}>
            <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.55, color: v === true ? G.red : G.text }}>{q.en}</div>
            <div className="parq-btns">
              {[["No", false], ["Yes", true]].map(([label, val]) => (
                <button key={label} type="button" className="btn parq-btn"
                  onClick={() => setParqAns(p => ({ ...p, [q.id]: val }))}
                  style={{
                    background: v === val ? (val ? G.red : G.green) : G.surf2,
                    color: v === val ? "#FCFCFD" : G.muted,
                    border: `1px solid ${v === val ? "transparent" : G.border}`,
                  }}>{label}</button>
              ))}
            </div>
          </div>
        );
      })}
      {parqFlags.length > 0 && (
        <div style={{ marginTop: 10, padding: "10px 12px", background: "#FBECEC", border: `1px solid ${G.red}`, borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: G.red, fontWeight: 700 }}>⚠ {parqFlags.length} flagged</div>
          <div style={{ fontSize: 11, color: G.muted, marginTop: 5, lineHeight: 1.5 }}>
            Saving this records the answers and marks them for review. It does not clear them to train.
          </div>
        </div>
      )}

      {/* ── Capabilities ──────────────────────────────────── */}
      <H sub="Watch them do it. Pick the highest rung they reach cleanly — not the one they can scrape.">
        What they can do
      </H>
      {CAPABILITIES.map(cap => (
        <div key={cap.id} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{cap.name}</div>
          <div style={{ fontSize: 10, color: G.muted, marginTop: 2, marginBottom: 7, lineHeight: 1.5 }}>{cap.why}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {cap.levels.map(l => {
              const on = levels[cap.id] === l.level;
              return (
                <button key={l.level} type="button" className="btn"
                  onClick={() => setLevel(cap.id, l.level)}
                  style={{
                    textAlign: "left", padding: "8px 11px", borderRadius: 8, fontSize: 11.5,
                    background: on ? "#E8EEF8" : G.surf2,
                    color: on ? G.gold : G.muted,
                    border: `1px solid ${on ? G.borderHi : G.border}`,
                    fontWeight: on ? 700 : 500,
                  }}>
                  <span style={{ opacity: 0.5, marginRight: 8 }}>L{l.level}</span>{l.label}
                </button>
              );
            })}
          </div>
          {cap.note && <div style={{ fontSize: 10, color: G.dim, marginTop: 6, lineHeight: 1.5 }}>{cap.note}</div>}
        </div>
      ))}

      {/* ── Tests ─────────────────────────────────────────── */}
      <H sub="Taken any other way, these cannot be compared to the published ranges — so the protocol is on screen, not in a manual.">
        Measurements
      </H>
      {TESTS.map(t => (
        <div key={t.id} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{t.name}</div>
          <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{t.unit}</div>
          {/* The protocol is the most important text on this screen and must
              not be the faintest. A chair-stand count taken from the wrong
              chair, or with hands pushing off, cannot be compared to the
              published ranges at all — the number becomes decoration. */}
          <ul style={{
            margin: "7px 0 9px", padding: "8px 12px 8px 26px", listStyle: "disc",
            background: G.surf2, borderRadius: 8, border: `1px solid ${G.border}`,
          }}>
            {t.protocol.map((line, i) => (
              <li key={i} style={{ fontSize: 11, color: G.text, lineHeight: 1.65, opacity: 0.85 }}>{line}</li>
            ))}
          </ul>
          <input className="inp" type="number" inputMode="decimal" placeholder="—"
            value={tests[t.id] ?? ""} onChange={e => setTest(t.id, e.target.value)} />
          {t.id === "chair_stand_30s" && chairSays && (
            <div style={{ marginTop: 7, fontSize: 11, lineHeight: 1.6 }}>
              <div style={{ color: chairSays.below ? G.amber : G.green }}>{chairSays.text}</div>
              {physicalAge && (
                <div style={{ color: G.gold, fontWeight: 700, marginTop: 3 }}>
                  Chair stand {physicalAge.text}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* ── Consequence ───────────────────────────────────── */}
      {exercises.length > 0 && (
        <>
          <H sub="What these levels mean for the programme they are on. Check this before you save.">
            What this allows
          </H>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1, textAlign: "center", background: G.surf2, borderRadius: 8, padding: "9px 6px" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: G.green }}>{verdict.allowed.length}</div>
              <div style={{ fontSize: 9, color: G.muted }}>ALLOWED</div>
            </div>
            <div style={{ flex: 1, textAlign: "center", background: G.surf2, borderRadius: 8, padding: "9px 6px" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: verdict.blocked.length ? G.red : G.muted }}>{verdict.blocked.length}</div>
              <div style={{ fontSize: 9, color: G.muted }}>NOT YET</div>
            </div>
          </div>
          {verdict.blocked.map(b => (
            <div key={b.name} style={{ padding: "7px 10px", background: "#FBECEC", border: `1px solid ${G.border}`, borderRadius: 7, marginBottom: 5 }}>
              <div style={{ fontSize: 11.5, color: G.text }}>{b.name}</div>
              {b.reasons.map(r => (
                <div key={r.id} style={{ fontSize: 10, color: G.red, marginTop: 2 }}>
                  needs {r.name} — {r.neededLabel}
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {/* ── Notes ─────────────────────────────────────────── */}
      <H>Notes</H>
      <textarea className="inp" rows={3} value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Anything the numbers do not carry." style={{ resize: "vertical" }} />

      {err && (
        <div style={{ marginTop: 12, padding: "9px 11px", border: `1px solid ${G.red}`, borderRadius: 8, color: G.red, fontSize: 12 }}>{err}</div>
      )}

      <div style={{ display: "flex", gap: 9, marginTop: 18 }}>
        <button type="button" className="btn" onClick={save} disabled={saving}
          style={{ flex: 1, minHeight: 52, borderRadius: 12, background: G.grad, color: "#FCFCFD", fontWeight: 600, fontSize: 15 }}>
          {saving ? "Saving…" : "Save assessment"}
        </button>
        <button type="button" className="btn" onClick={onClose}
          style={{ padding: "12px 18px", borderRadius: 12, background: G.surf2, color: G.muted, border: `1px solid ${G.border}`, fontSize: 13 }}>
          Cancel
        </button>
      </div>
      <div style={{ fontSize: 10, color: G.dim, marginTop: 9, lineHeight: 1.5 }}>
        Saved assessments are never edited or deleted — progression is one compared against the next. Take a new one rather than correcting an old one.
      </div>
    </div>
  );
}
