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

async function saveAssessment(payload) {
  const r = await fetch("/api/admin-data", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken()}` },
    body: JSON.stringify({ action: "save_assessment", ...payload }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Could not save the assessment");
  return d;
}

export function AssessmentForm({ client, G, parq: PARQ = [], exercises = [], onClose, onSaved }) {
  const [levels, setLevels] = useState({});
  const [tests, setTests] = useState({});
  const [parqAns, setParqAns] = useState({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

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
      await saveAssessment({
        clientId: client.id,
        levels,
        tests: cleanTests,
        // Only send a PAR-Q if the whole thing was answered. A half-filled
        // screening recorded as a screening is worse than none.
        parqAnswers: parqAnswered ? Object.fromEntries(PARQ.map(q => [q.id, !!parqAns[q.id]])) : null,
        notes,
      });
      onSaved?.();
      onClose?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const H = ({ children, sub }) => (
    <div style={{ marginTop: 22, marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: G.gold, letterSpacing: 1.6, textTransform: "uppercase", fontWeight: 700 }}>{children}</div>
      {sub && <div style={{ fontSize: 11, color: G.muted, marginTop: 4, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <div className="sf gd" style={{ fontSize: 19, fontWeight: 700 }}>Assessment</div>
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
          <div key={q.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderBottom: `1px solid ${G.border}` }}>
            <div style={{ flex: 1, fontSize: 12, lineHeight: 1.5, color: v === true ? G.red : G.text }}>{q.en}</div>
            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
              {[["No", false], ["Yes", true]].map(([label, val]) => (
                <button key={label} type="button" className="btn"
                  onClick={() => setParqAns(p => ({ ...p, [q.id]: val }))}
                  style={{
                    padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                    background: v === val ? (val ? G.red : G.green) : G.surf2,
                    color: v === val ? "#fff" : G.muted,
                    border: `1px solid ${v === val ? "transparent" : G.border}`,
                  }}>{label}</button>
              ))}
            </div>
          </div>
        );
      })}
      {parqFlags.length > 0 && (
        <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(239,68,68,0.08)", border: `1px solid ${G.red}`, borderRadius: 8 }}>
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
                    background: on ? "rgba(212,175,55,0.14)" : G.surf2,
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
            <div key={b.name} style={{ padding: "7px 10px", background: "rgba(239,68,68,0.06)", border: `1px solid ${G.border}`, borderRadius: 7, marginBottom: 5 }}>
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
          style={{ flex: 1, padding: "12px", borderRadius: 10, background: G.grad, color: "#000", fontWeight: 700, fontSize: 14 }}>
          {saving ? "Saving…" : "Save assessment"}
        </button>
        <button type="button" className="btn" onClick={onClose}
          style={{ padding: "12px 18px", borderRadius: 10, background: G.surf2, color: G.muted, border: `1px solid ${G.border}`, fontSize: 13 }}>
          Cancel
        </button>
      </div>
      <div style={{ fontSize: 10, color: G.dim, marginTop: 9, lineHeight: 1.5 }}>
        Saved assessments are never edited or deleted — progression is one compared against the next. Take a new one rather than correcting an old one.
      </div>
    </div>
  );
}
