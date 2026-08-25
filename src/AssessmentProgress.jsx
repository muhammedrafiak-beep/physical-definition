// The screen the trainer turns around and shows the client.
//
// An assessment on its own is a starting point. Progression is one assessment
// held against the next — which is why assessments are never edited or
// deleted, and why this screen exists at all.
//
// WHAT IT SHOWS
//   Capabilities — the rung then, the rung now. A rung gained is the headline.
//   Measurements — the numbers, with the change since last time.
//   Chair stand  — the published range for this age, and the age band this
//                  score sits in. Read from the same table, backwards.
//   Newly allowed — movements that were held out of the sessions before and
//                  are in them now. This is the assessment changing the
//                  training, made visible.
//
// WHAT IT MUST NOT DO
// Turn a measurement into a verdict about a person. A chair stand measures
// lower-body strength and power. It says nothing about a heart, a memory, or
// how long anyone will live. Every line here names the test it came from, and
// a level that has gone DOWN is shown plainly and without alarm — that is
// information the trainer needs, not a failure to hide or to dramatise.

import { useEffect, useMemo, useState } from "react";
import {
  CAPABILITIES, CAPABILITY_BY_ID, TESTS,
  describeChairStand, chairStandAgeEquivalent, meetsRequirement,
} from "./assessment";
import { getExerciseRequirement } from "./exerciseMeta";

const adminToken = () => {
  try { return sessionStorage.getItem("pd_admin_token") || ""; } catch { return ""; }
};

async function listAssessments(clientId) {
  const r = await fetch("/api/admin-data", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken()}` },
    body: JSON.stringify({ action: "list_assessments", clientId }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Could not load assessments");
  // The endpoint returns newest first.
  return Array.isArray(d.assessments) ? d.assessments : [];
}

function levelLabel(capId, lv) {
  const cap = CAPABILITY_BY_ID[capId];
  if (!cap || !Number.isFinite(lv)) return null;
  const row = cap.levels.find((l) => l.level === lv);
  return row ? row.label : `level ${lv}`;
}

function daysBetween(a, b) {
  const t1 = Date.parse(a), t2 = Date.parse(b);
  if (!Number.isFinite(t1) || !Number.isFinite(t2)) return null;
  return Math.round(Math.abs(t2 - t1) / 86400000);
}

function fmtDate(s) {
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return s || "—";
  return new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const numOrNull = (v) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Number(v) : null);

export function AssessmentProgress({ client, G, exercises = [], onTakeNew }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  // Which earlier assessment the latest one is held against. Defaults to the
  // one immediately before it; a trainer comparing back to the very first
  // visit is a different and equally fair question.
  const [againstId, setAgainstId] = useState(null);

  useEffect(() => {
    let alive = true;
    listAssessments(client.id)
      .then((a) => { if (alive) setRows(a); })
      .catch((e) => { if (alive) setErr(e.message); });
    return () => { alive = false; };
  }, [client.id]);

  const now = rows && rows.length ? rows[0] : null;
  const older = rows ? rows.slice(1) : [];
  const prev = useMemo(() => {
    if (!older.length) return null;
    if (againstId) return older.find((r) => r.id === againstId) || older[0];
    return older[0];
  }, [older, againstId]);

  const nowLevels = now?.levels || {};
  const prevLevels = prev?.levels || {};
  const nowTests = now?.tests || {};
  const prevTests = prev?.tests || {};

  // Movements that were held out of the sessions before and are in them now.
  // Only exercises that carry a requirement can appear here — one with no
  // requirement was never held back, so it was never unlocked.
  const movement = useMemo(() => {
    if (!prev) return { gained: [], lost: [] };
    const gained = [], lost = [];
    for (const name of exercises) {
      const req = getExerciseRequirement(name);
      if (!req) continue;
      const before = meetsRequirement(prevLevels, req);
      const after = meetsRequirement(nowLevels, req);
      if (after && !before) gained.push(name);
      if (before && !after) lost.push(name);
    }
    return { gained, lost };
  }, [exercises, prevLevels, nowLevels, prev]);

  const chairNow = numOrNull(nowTests.chair_stand_30s);
  const chairPrev = numOrNull(prevTests.chair_stand_30s);
  const chairSays = describeChairStand(chairNow, client?.age, client?.gender);
  const ageNow = chairStandAgeEquivalent(chairNow, client?.gender);
  const agePrev = chairStandAgeEquivalent(chairPrev, client?.gender);

  const H = ({ children, sub }) => (
    <div style={{ marginTop: 22, marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: G.gold, letterSpacing: 1.6, textTransform: "uppercase", fontWeight: 700 }}>{children}</div>
      {sub && <div style={{ fontSize: 11, color: G.muted, marginTop: 4, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );

  if (err) {
    return <div style={{ padding: "12px 0", color: G.red, fontSize: 12 }}>{err}</div>;
  }
  if (rows === null) {
    return <div style={{ padding: "18px 0", color: G.muted, fontSize: 12 }}>Loading…</div>;
  }

  // ── Nothing recorded yet ──────────────────────────────────
  if (!now) {
    return (
      <div>
        <div className="sf gd" style={{ fontSize: 19, fontWeight: 700 }}>Progress</div>
        <div style={{ fontSize: 12, color: G.muted, marginTop: 3 }}>{client?.name}</div>
        <div style={{ marginTop: 20, padding: "16px 14px", background: G.surf2, border: `1px solid ${G.border}`, borderRadius: 10, fontSize: 12, color: G.text, lineHeight: 1.65 }}>
          No assessment recorded yet. Until there is one, this client's programme
          is chosen from age and intake answers alone — which is a guess about a
          body, and the thing the assessment exists to replace.
        </div>
        {onTakeNew && (
          <button type="button" className="btn" onClick={onTakeNew}
            style={{ width: "100%", marginTop: 14, padding: "12px", borderRadius: 10, background: G.grad, color: "#000", fontWeight: 700, fontSize: 14 }}>
            Take the first assessment
          </button>
        )}
      </div>
    );
  }

  // ── One assessment: a baseline, not progress ──────────────
  const gap = prev ? daysBetween(prev.assessed_at, now.assessed_at) : null;

  return (
    <div>
      <div className="sf gd" style={{ fontSize: 19, fontWeight: 700 }}>Progress</div>
      <div style={{ fontSize: 12, color: G.muted, marginTop: 3 }}>
        {client?.name} · {client?.age}y · {rows.length} assessment{rows.length === 1 ? "" : "s"}
      </div>

      {prev ? (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 11, color: G.muted }}>Comparing</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{fmtDate(prev.assessed_at)}</div>
          <div style={{ fontSize: 12, color: G.gold }}>→</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{fmtDate(now.assessed_at)}</div>
          {gap !== null && <div style={{ fontSize: 11, color: G.dim }}>({gap} days apart)</div>}
        </div>
      ) : (
        <div style={{ marginTop: 14, padding: "12px 14px", background: G.surf2, border: `1px solid ${G.border}`, borderRadius: 10, fontSize: 12, color: G.text, lineHeight: 1.65 }}>
          One assessment, taken {fmtDate(now.assessed_at)}. That is a starting
          point, not progress — there is nothing yet to hold it against. Take
          the next one and this screen fills in.
        </div>
      )}

      {older.length > 1 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 5 }}>COMPARE AGAINST</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {older.map((r) => {
              const on = (againstId || older[0].id) === r.id;
              return (
                <button key={r.id} type="button" className="btn" onClick={() => setAgainstId(r.id)}
                  style={{
                    padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                    background: on ? "rgba(212,175,55,0.14)" : G.surf2,
                    color: on ? G.gold : G.muted,
                    border: `1px solid ${on ? G.borderHi : G.border}`,
                  }}>{fmtDate(r.assessed_at)}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Capabilities ─────────────────────────────────── */}
      <H sub={prev ? "The rung then, the rung now." : "The rung recorded at this assessment."}>
        What they can do
      </H>
      {CAPABILITIES.map((cap) => {
        const a = Number.isFinite(prevLevels[cap.id]) ? prevLevels[cap.id] : null;
        const b = Number.isFinite(nowLevels[cap.id]) ? nowLevels[cap.id] : null;
        if (a === null && b === null) return null;
        const up = a !== null && b !== null && b > a;
        const down = a !== null && b !== null && b < a;
        const tone = up ? G.green : down ? G.amber : G.text;
        return (
          <div key={cap.id} style={{ padding: "10px 12px", background: G.surf2, border: `1px solid ${up ? "rgba(34,197,94,0.3)" : G.border}`, borderRadius: 9, marginBottom: 7 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: G.text }}>{cap.name}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: tone }}>
                {a !== null ? `L${a}` : "—"} <span style={{ opacity: 0.5 }}>→</span> {b !== null ? `L${b}` : "—"}
                {up && " ↑"}{down && " ↓"}
              </div>
            </div>
            <div style={{ fontSize: 11, color: G.muted, marginTop: 4, lineHeight: 1.5 }}>
              {b !== null ? levelLabel(cap.id, b) : "not recorded this time"}
            </div>
            {down && (
              <div style={{ fontSize: 10, color: G.amber, marginTop: 4, lineHeight: 1.5 }}>
                Lower than last time. Worth a reason before the next session — illness, a bad night, footwear, or the test taken differently.
              </div>
            )}
          </div>
        );
      })}

      {/* ── Measurements ─────────────────────────────────── */}
      <H sub="Numbers only compare when they were taken the same way.">Measurements</H>
      {TESTS.map((t) => {
        const a = numOrNull(prevTests[t.id]);
        const b = numOrNull(nowTests[t.id]);
        if (a === null && b === null) return null;
        const delta = a !== null && b !== null ? b - a : null;
        const better = delta === null ? null : t.higherIsBetter ? delta > 0 : delta < 0;
        return (
          <div key={t.id} style={{ padding: "10px 12px", background: G.surf2, border: `1px solid ${G.border}`, borderRadius: 9, marginBottom: 7 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{t.name}</div>
                <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{t.unit}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: G.text }}>
                  {a !== null ? a : "—"} <span style={{ opacity: 0.4, fontSize: 12 }}>→</span> {b !== null ? b : "—"}
                </div>
                {delta !== null && delta !== 0 && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: better ? G.green : G.amber, marginTop: 2 }}>
                    {delta > 0 ? "+" : ""}{Math.round(delta * 10) / 10}
                  </div>
                )}
                {delta === 0 && <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>no change</div>}
              </div>
            </div>

            {/* The chair stand is the one test with published norms behind it,
                so it is the only one that gets to say anything beyond its own
                number — and even then, only about itself. */}
            {t.id === "chair_stand_30s" && chairSays && (
              <div style={{ marginTop: 9, paddingTop: 9, borderTop: `1px solid ${G.border}`, fontSize: 11, lineHeight: 1.6 }}>
                <div style={{ color: chairSays.below ? G.amber : G.green }}>{chairSays.text}</div>
                {ageNow && (
                  <div style={{ color: G.gold, fontWeight: 700, marginTop: 4 }}>
                    Chair stand {ageNow.text}
                    {agePrev && agePrev.from !== ageNow.from && (
                      <span style={{ color: G.muted, fontWeight: 500 }}>
                        {" "}— last time, {agePrev.from}-{agePrev.to}
                      </span>
                    )}
                  </div>
                )}
                <div style={{ color: G.dim, marginTop: 4 }}>
                  That is this test against the published table for this test. It
                  is not a statement about the rest of him.
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ── What the assessment changed ──────────────────── */}
      {prev && (movement.gained.length > 0 || movement.lost.length > 0) && (
        <>
          <H sub="The assessment is not a record kept beside the training. It is what decides it.">
            What this changed in the sessions
          </H>
          {movement.gained.length > 0 && (
            <div style={{ padding: "11px 13px", background: "rgba(34,197,94,0.07)", border: `1px solid rgba(34,197,94,0.3)`, borderRadius: 9, marginBottom: 7 }}>
              <div style={{ fontSize: 11, color: G.green, fontWeight: 700, marginBottom: 6 }}>
                ✓ NOW IN THE SESSIONS ({movement.gained.length})
              </div>
              {movement.gained.map((n) => (
                <div key={n} style={{ fontSize: 12, color: G.text, lineHeight: 1.7 }}>{n}</div>
              ))}
            </div>
          )}
          {movement.lost.length > 0 && (
            <div style={{ padding: "11px 13px", background: "rgba(245,158,11,0.07)", border: `1px solid ${G.amber}`, borderRadius: 9, marginBottom: 7 }}>
              <div style={{ fontSize: 11, color: G.amber, fontWeight: 700, marginBottom: 6 }}>
                HELD BACK AGAIN ({movement.lost.length})
              </div>
              {movement.lost.map((n) => (
                <div key={n} style={{ fontSize: 12, color: G.text, lineHeight: 1.7 }}>{n}</div>
              ))}
              <div style={{ fontSize: 10, color: G.muted, marginTop: 6, lineHeight: 1.5 }}>
                Taken back out because the level they rest on was lower this time. They return when it does.
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Notes ────────────────────────────────────────── */}
      {(now.notes || prev?.notes) && (
        <>
          <H>Notes</H>
          {[now, prev].filter(Boolean).filter((r) => r.notes).map((r) => (
            <div key={r.id} style={{ padding: "10px 12px", background: G.surf2, border: `1px solid ${G.border}`, borderRadius: 9, marginBottom: 7 }}>
              <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>{fmtDate(r.assessed_at)}</div>
              <div style={{ fontSize: 12, color: G.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{r.notes}</div>
            </div>
          ))}
        </>
      )}

      {/* The honest scoping, kept on the screen rather than in a trainer's
          head — because this is the screen the client reads. */}
      <div style={{ marginTop: 20, padding: "12px 14px", border: `1px solid ${G.border}`, borderRadius: 10, fontSize: 11, color: G.muted, lineHeight: 1.7 }}>
        Each line above is one test on one day. A test measures what it measures
        and nothing more — strong legs are strong legs, not a promise about a
        heart or about years. What this screen is for is the direction of
        travel: keep the movement improving, and keep it free of injury.
      </div>

      {onTakeNew && (
        <button type="button" className="btn" onClick={onTakeNew}
          style={{ width: "100%", marginTop: 14, padding: "12px", borderRadius: 10, background: G.surf2, color: G.text, border: `1px solid ${G.borderHi}`, fontWeight: 700, fontSize: 13 }}>
          + Take a new assessment
        </button>
      )}
    </div>
  );
}
