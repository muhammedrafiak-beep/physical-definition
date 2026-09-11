import { useCallback, useEffect, useState } from "react";
import { G } from "./theme";

// What this client has actually been eating, from the trainer's side.
//
// The client's own screen shows today. This shows a fortnight, because
// adherence is a pattern and one day of it says almost nothing: Friday at
// 2,900 kcal is noise, five days in a row at 2,900 is the conversation.
//
// THE DAYS WITH NOTHING IN THEM ARE THE POINT. An empty day is not missing
// data to be skipped over — it is somebody who did not log, and that is the
// first thing worth asking about. So every date in the range gets a row
// whether or not there is anything in it, and the average is taken over the
// days that WERE logged, with the count stated next to it. Averaging the
// blanks in as zeros would quietly report that a client eats 900 kcal a day.

const post = async (payload) => {
  const token = (() => { try { return sessionStorage.getItem("pd_admin_token") || ""; } catch { return ""; } })();
  const r = await fetch("/api/admin-data", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "That didn't work. Try again.");
  return d;
};

const round = (n) => (n >= 100 ? Math.round(n) : Math.round(n * 10) / 10);

const dayLabel = (iso) => {
  const d = new Date(iso + "T12:00:00");
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  return (isToday ? "Today · " : "") +
    d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
};

export function ClientFood({ clientId, clientName }) {
  const [span, setSpan] = useState(7);
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(true);

  const load = useCallback(async (days) => {
    setBusy(true); setErr("");
    try { setData(await post({ action: "client_food", client_id: clientId, days })); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }, [clientId]);

  useEffect(() => { load(span); }, [span, load]);

  const days = data?.days || [];
  const targets = data?.targets || {};
  const logged = days.filter((d) => d.entries.length > 0);
  const avgKcal = logged.length
    ? Math.round(logged.reduce((a, d) => a + (Number(d.totals.kcal) || 0), 0) / logged.length)
    : null;
  const avgProtein = logged.length
    ? Math.round(logged.reduce((a, d) => a + (Number(d.totals.protein_g) || 0), 0) / logged.length)
    : null;

  return (
    <div className="card" style={{ padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div className="sf" style={{ fontSize: 18 }}>🍽️ Food log</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[7, 14, 30].map((n) => (
            <button key={n} onClick={() => setSpan(n)}
              style={{ ...chip, ...(span === n ? chipOn : null) }}>{n} days</button>
          ))}
        </div>
      </div>

      {err && <div style={errBox}>{err}</div>}

      {busy && !data ? (
        <div style={{ padding: "20px 0", color: G.muted, fontSize: 12.5 }}>Loading…</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 14 }}>
            <Stat label="Days logged" value={`${logged.length} of ${days.length}`}
              tone={logged.length === 0 ? "bad" : logged.length >= days.length * 0.7 ? "good" : "warn"} />
            <Stat label="Average calories" value={avgKcal === null ? "—" : `${avgKcal}`}
              note={targets.kcal ? `target ${targets.kcal}` : null} />
            <Stat label="Average protein" value={avgProtein === null ? "—" : `${avgProtein}g`}
              note={targets.protein_g ? `target ${targets.protein_g}g` : null} />
          </div>

          {logged.length > 0 && (
            <div style={{ fontSize: 11, color: G.muted, marginBottom: 12, lineHeight: 1.5 }}>
              Averages are over the {logged.length} day{logged.length === 1 ? "" : "s"} that were
              logged, not over all {days.length}.
            </div>
          )}

          {days.map((d) => {
            const kcal = Number(d.totals.kcal) || 0;
            const has = d.entries.length > 0;
            const pct = targets.kcal ? Math.min(100, (kcal / targets.kcal) * 100) : 0;
            const over = targets.kcal && kcal > targets.kcal;
            const isOpen = open === d.date;

            return (
              <div key={d.date} style={{ borderTop: `1px solid ${G.border}` }}>
                <button
                  onClick={() => setOpen(isOpen ? null : d.date)}
                  disabled={!has}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%",
                    background: "none", border: "none", padding: "10px 0",
                    cursor: has ? "pointer" : "default", textAlign: "left",
                  }}
                >
                  <span style={{ width: 128, flexShrink: 0, fontSize: 12, color: has ? G.text : G.dim }}>
                    {dayLabel(d.date)}
                  </span>

                  <span style={{ flex: 1, minWidth: 40, height: 6, background: G.surf2, borderRadius: 3, overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${pct}%`, borderRadius: 3, background: over ? G.amber : G.accent }} />
                  </span>

                  <span style={{ width: 96, flexShrink: 0, textAlign: "right", fontSize: 12, fontVariantNumeric: "tabular-nums", color: has ? G.text : G.dim }}>
                    {has ? `${round(kcal)} kcal` : "not logged"}
                  </span>

                  <span style={{ width: 54, flexShrink: 0, textAlign: "right", fontSize: 11.5, fontVariantNumeric: "tabular-nums", color: G.muted }}>
                    {has ? `${round(Number(d.totals.protein_g) || 0)}g P` : ""}
                  </span>
                </button>

                {isOpen && (
                  <div style={{ padding: "2px 0 12px 128px" }}>
                    {d.entries.map((e) => (
                      <div key={e.id} style={{ display: "flex", gap: 10, padding: "4px 0", fontSize: 11.5 }}>
                        <span style={{ flex: 1, minWidth: 0, color: G.text }}>
                          {e.name}
                          <span style={{ color: G.muted }}>
                            {[e.meal, e.grams ? `${Math.round(e.grams)} g` : null].filter(Boolean).length
                              ? " · " + [e.meal, e.grams ? `${Math.round(e.grams)} g` : null].filter(Boolean).join(" · ")
                              : ""}
                          </span>
                        </span>
                        <span style={{ color: G.muted, fontVariantNumeric: "tabular-nums" }}>
                          {e.kcal === null || e.kcal === undefined ? "—" : `${round(Number(e.kcal))} kcal`}
                        </span>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8, fontSize: 11, color: G.muted }}>
                      <span>sugar {round(Number(d.totals.sugar_g) || 0)}g{targets.sugar_g ? ` / ${targets.sugar_g}` : ""}</span>
                      <span>sodium {round(Number(d.totals.sodium_mg) || 0)}mg{targets.sodium_mg ? ` / ${targets.sodium_mg}` : ""}</span>
                      <span>sat fat {round(Number(d.totals.sat_fat_g) || 0)}g{targets.sat_fat_g ? ` / ${targets.sat_fat_g}` : ""}</span>
                      <span>fibre {round(Number(d.totals.fibre_g) || 0)}g{targets.fibre_g ? ` / ${targets.fibre_g}` : ""}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {logged.length === 0 && (
            <div style={{ borderTop: `1px solid ${G.border}`, padding: "18px 0 4px", fontSize: 12.5, color: G.muted, lineHeight: 1.6 }}>
              {clientName ? `${clientName} has` : "This client has"} not logged any food in the last {span} days.
              The diary is on their Food tab, under the meal plan.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, note, tone }) {
  const colour = tone === "good" ? G.green : tone === "warn" ? G.amber : tone === "bad" ? G.red : G.text;
  return (
    <div>
      <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color: colour, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {note && <div style={{ fontSize: 10.5, color: G.muted, marginTop: 1 }}>{note}</div>}
    </div>
  );
}

const chip = {
  border: `1px solid ${G.border}`, background: G.surf, color: G.muted,
  borderRadius: 20, padding: "6px 11px", fontSize: 11.5, fontWeight: 600, cursor: "pointer",
};
const chipOn = { background: G.accentSoft, borderColor: G.accentLine, color: G.accent };
const errBox = {
  background: G.redSoft, border: `1px solid ${G.redLine}`, borderRadius: 10,
  padding: "9px 12px", color: G.red, fontSize: 12, marginBottom: 10,
};
