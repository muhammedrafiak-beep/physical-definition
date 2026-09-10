import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { G } from "./theme";
import { Icon } from "./Icons";

// Today's food, against today's targets.
//
// The meal plan below this says what the client SHOULD eat. This says what
// they DID, and it is the half that was missing: a plan nobody records against
// is a document, not a habit.
//
// The nine numbers are the ones a food label carries, so a barcode fills all
// of them. Vitamins are deliberately absent — Open Food Facts has them for a
// minority of products, and a screen that says "no data" on most days teaches
// people to ignore it.

const post = async (payload) => {
  const token = (() => { try { return sessionStorage.getItem("pd_token") || ""; } catch { return ""; } })();
  const r = await fetch("/api/client-data", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "That didn't work. Try again.");
  return d;
};

// `dir` is what the number means, not how big it is. Protein and fibre are
// floors to reach; sugar, salt and saturated fat are ceilings to stay under.
// Colouring them the same way would tell somebody they are failing at fibre
// and succeeding at sugar with the same bar.
const ROWS = [
  { k: "kcal", label: "Calories", unit: "", dir: "aim", lead: true },
  { k: "protein_g", label: "Protein", unit: "g", dir: "floor" },
  { k: "carbs_g", label: "Carbs", unit: "g", dir: "aim" },
  { k: "fat_g", label: "Fat", unit: "g", dir: "aim" },
  { k: "fibre_g", label: "Fibre", unit: "g", dir: "floor" },
  { k: "sugar_g", label: "Sugar", unit: "g", dir: "cap" },
  { k: "sat_fat_g", label: "Saturated fat", unit: "g", dir: "cap" },
  { k: "sodium_mg", label: "Sodium", unit: "mg", dir: "cap" },
  { k: "cholesterol_mg", label: "Cholesterol", unit: "mg", dir: "cap" },
];

const MEALS = ["Breakfast", "Snack", "Lunch", "Pre-workout", "Dinner"];

const localDay = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const show = (v, unit) => {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return (n >= 100 ? Math.round(n) : Math.round(n * 10) / 10) + unit;
};

function Bar({ row, eaten, target }) {
  const has = Number.isFinite(Number(target)) && Number(target) > 0;
  const pct = has ? Math.min(100, (eaten / target) * 100) : 0;
  const over = has && eaten > target;

  // A ceiling that has been passed is the only red on this screen. A floor not
  // yet reached is not a failure at 11am, so it stays neutral until it is met.
  const colour = row.dir === "cap"
    ? (over ? G.red : G.accent)
    : row.dir === "floor"
      ? (has && eaten >= target ? G.green : G.accent)
      : (over ? G.amber : G.accent);

  return (
    <div style={{ marginBottom: row.lead ? 14 : 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: row.lead ? 13 : 11.5, fontWeight: row.lead ? 700 : 600, color: row.lead ? G.text : G.muted }}>
          {row.label}
        </span>
        <span style={{ fontSize: row.lead ? 14 : 11.5, fontWeight: 700, color: over && row.dir === "cap" ? G.red : G.text, fontVariantNumeric: "tabular-nums" }}>
          {show(eaten, row.unit)}
          <span style={{ color: G.dim, fontWeight: 500 }}> / {has ? show(target, row.unit) : "—"}</span>
        </span>
      </div>
      <div style={{ height: row.lead ? 8 : 5, background: G.surf2, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: colour, borderRadius: 4, transition: "width .25s" }} />
      </div>
    </div>
  );
}

export function FoodDiary() {
  const [date, setDate] = useState(localDay());
  const [day, setDay] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingTargets, setEditingTargets] = useState(false);

  const load = useCallback(async (d) => {
    setBusy(true); setErr("");
    try { setDay(await post({ action: "food.day", date: d })); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  const totals = day?.totals || {};
  const targets = day?.targets || {};
  const entries = day?.entries || [];
  const isToday = date === localDay();

  const shiftDay = (delta) => {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + delta);
    const next = localDay(d);
    if (next <= localDay()) setDate(next);
  };

  const remove = async (id) => {
    try { await post({ action: "food.delete", id }); load(date); }
    catch (e) { setErr(e.message); }
  };

  return (
    <div className="card" style={{ padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
        <div>
          <div className="sf" style={{ fontSize: 19, lineHeight: 1.2 }}>Food diary</div>
          <div style={{ fontSize: 11.5, color: G.muted, marginTop: 2 }}>
            {isToday ? "Today" : new Date(date + "T12:00:00").toDateString()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => shiftDay(-1)} aria-label="Previous day" style={navBtn}>‹</button>
          <button onClick={() => shiftDay(1)} aria-label="Next day" disabled={isToday}
            style={{ ...navBtn, opacity: isToday ? 0.35 : 1 }}>›</button>
        </div>
      </div>

      {err && <div style={errBox}>{err}</div>}

      {busy && !day ? (
        <div style={{ padding: "26px 0", textAlign: "center", color: G.muted, fontSize: 12.5 }}>Loading…</div>
      ) : (
        <>
          {ROWS.map((row) => (
            <Bar key={row.k} row={row} eaten={Number(totals[row.k]) || 0} target={targets[row.k]} />
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={() => setAdding(true)} style={primaryBtn}>
              <Icon n="plus" s={14} c="#FCFCFD" w={2.2} /> Add food
            </button>
            <button onClick={() => setEditingTargets((v) => !v)} style={ghostBtn}>Targets</button>
          </div>

          {editingTargets && (
            <TargetEditor targets={targets} onSaved={() => { setEditingTargets(false); load(date); }} onError={setErr} />
          )}

          {entries.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={sectionLabel}>Eaten</div>
              {entries.map((e) => (
                <div key={e.id} style={entryRow}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: G.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.name}
                    </div>
                    <div style={{ fontSize: 10.5, color: G.muted, marginTop: 1 }}>
                      {[e.meal, e.brand, e.grams ? `${Math.round(e.grams)} g` : null].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: G.text, fontVariantNumeric: "tabular-nums" }}>
                    {show(e.kcal, "")}
                  </div>
                  <button onClick={() => remove(e.id)} aria-label={`Remove ${e.name}`} style={trashBtn}>
                    <Icon n="trash" s={13} c={G.dim} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {adding && (
        <AddFood
          date={date}
          onClose={() => setAdding(false)}
          onAdded={() => { setAdding(false); load(date); }}
        />
      )}
    </div>
  );
}

// ── Targets ────────────────────────────────────────────────
function TargetEditor({ targets, onSaved, onError }) {
  const [form, setForm] = useState(() => {
    const f = {};
    for (const r of ROWS) f[r.k] = targets[r.k] ?? "";
    return f;
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try { await post({ action: "food.targets.save", targets: form }); onSaved(); }
    catch (e) { onError(e.message); }
    finally { setBusy(false); }
  };

  const reset = async () => {
    setBusy(true);
    try { await post({ action: "food.targets.reset" }); onSaved(); }
    catch (e) { onError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ marginTop: 14, padding: 14, background: G.surf2, borderRadius: 12 }}>
      <div style={sectionLabel}>Your daily targets</div>
      <div style={{ fontSize: 11, color: G.muted, marginBottom: 10, lineHeight: 1.5 }}>
        Worked out from your weight, age and goal. Change any of them and they stay as you set them.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8 }}>
        {ROWS.map((r) => (
          <label key={r.k} style={{ display: "block", minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 10, color: G.muted, marginBottom: 3 }}>
              {r.label}{r.unit ? ` (${r.unit})` : ""}
            </span>
            <input className="inp" type="number" inputMode="numeric" value={form[r.k]}
              onChange={(e) => setForm((f) => ({ ...f, [r.k]: e.target.value }))}
              style={{ width: "100%", minWidth: 0, height: 40, fontSize: 14 }} />
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={save} disabled={busy} style={primaryBtn}>Save</button>
        <button onClick={reset} disabled={busy} style={ghostBtn}>Use the calculated ones</button>
      </div>
    </div>
  );
}

// ── Add ────────────────────────────────────────────────────
function AddFood({ date, onClose, onAdded }) {
  const [mode, setMode] = useState("search");   // search | scan | manual
  const [meal, setMeal] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(null);   // a per-100g product
  const [grams, setGrams] = useState("100");

  const [manual, setManual] = useState({ name: "", grams: "", kcal: "", protein_g: "", carbs_g: "", fat_g: "", sugar_g: "", fibre_g: "", sodium_mg: "", sat_fat_g: "", cholesterol_mg: "" });

  const search = async () => {
    if (q.trim().length < 2) return;
    setBusy(true); setErr("");
    try { setResults((await post({ action: "food.search", q })).foods || []); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const lookup = async (barcode) => {
    setBusy(true); setErr("");
    try {
      const d = await post({ action: "food.lookup", barcode });
      if (d.food) { setPicked(d.food); setGrams(String(d.food.serving_g || 100)); setMode("search"); }
      else setErr("That barcode is not in the database. Add it by hand below.");
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const addPicked = async () => {
    setBusy(true); setErr("");
    try {
      await post({
        action: "food.add", date, meal: meal || null,
        name: picked.name, brand: picked.brand, barcode: picked.barcode,
        grams, per100: picked, source: picked.barcode ? "barcode" : "search",
      });
      onAdded();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  const addManual = async () => {
    setBusy(true); setErr("");
    try {
      await post({ action: "food.add", date, meal: meal || null, source: "manual", ...manual });
      onAdded();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div style={sheetWrap} onClick={onClose}>
      <div className="card" style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div className="sf" style={{ fontSize: 19 }}>Add food</div>
          <button onClick={onClose} aria-label="Close" style={trashBtn}><Icon n="close" s={15} c={G.muted} w={2} /></button>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {MEALS.map((m) => (
            <button key={m} onClick={() => setMeal(meal === m ? "" : m)}
              style={{ ...chip, ...(meal === m ? chipOn : null) }}>{m}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {[["search", "Search"], ["scan", "Scan"], ["manual", "By hand"]].map(([id, label]) => (
            <button key={id} onClick={() => { setMode(id); setErr(""); }}
              style={{ ...tab, ...(mode === id ? tabOn : null) }}>{label}</button>
          ))}
        </div>

        {err && <div style={errBox}>{err}</div>}

        {mode === "scan" && <Scanner onCode={lookup} onError={setErr} busy={busy} />}

        {mode === "search" && !picked && (
          <>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="inp" placeholder="Yoghurt, oats, chicken…" value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                style={{ flex: 1, minWidth: 0 }} />
              <button onClick={search} disabled={busy} style={primaryBtn}>Find</button>
            </div>
            <div style={{ marginTop: 10 }}>
              {results.map((f) => (
                <button key={f.barcode || f.name} onClick={() => { setPicked(f); setGrams(String(f.serving_g || 100)); }}
                  style={resultRow}>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: G.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                    <span style={{ display: "block", fontSize: 10.5, color: G.muted }}>
                      {[f.brand, f.kcal_100g !== null ? `${Math.round(f.kcal_100g)} kcal / 100 g` : null].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {mode === "search" && picked && (
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: G.text }}>{picked.name}</div>
            <div style={{ fontSize: 11, color: G.muted, marginBottom: 12 }}>{picked.brand}</div>
            <label style={{ display: "block", fontSize: 10, color: G.muted, marginBottom: 3 }}>How much (grams)</label>
            <input className="inp" type="number" inputMode="decimal" value={grams}
              onChange={(e) => setGrams(e.target.value)} style={{ width: "100%", minWidth: 0 }} />
            <div style={{ fontSize: 11.5, color: G.muted, marginTop: 8 }}>
              {picked.kcal_100g !== null && Number(grams) > 0
                ? `${Math.round((picked.kcal_100g * Number(grams)) / 100)} kcal`
                : "No calories on file for this one."}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={addPicked} disabled={busy} style={primaryBtn}>Add it</button>
              <button onClick={() => setPicked(null)} style={ghostBtn}>Back</button>
            </div>
          </div>
        )}

        {mode === "manual" && (
          <div>
            <div style={{ fontSize: 11, color: G.muted, marginBottom: 10, lineHeight: 1.5 }}>
              For anything cooked at home. Fill in what you know and leave the rest blank —
              a blank stays blank rather than counting as zero.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8 }}>
              <label style={{ gridColumn: "1 / -1" }}>
                <span style={{ display: "block", fontSize: 10, color: G.muted, marginBottom: 3 }}>What was it</span>
                <input className="inp" value={manual.name} onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))}
                  style={{ width: "100%", minWidth: 0 }} />
              </label>
              {[["grams", "Grams"], ...ROWS.map((r) => [r.k, r.label + (r.unit ? ` (${r.unit})` : "")])].map(([k, label]) => (
                <label key={k}>
                  <span style={{ display: "block", fontSize: 10, color: G.muted, marginBottom: 3 }}>{label}</span>
                  <input className="inp" type="number" inputMode="decimal" value={manual[k]}
                    onChange={(e) => setManual((m) => ({ ...m, [k]: e.target.value }))}
                    style={{ width: "100%", minWidth: 0, height: 40 }} />
                </label>
              ))}
            </div>
            <button onClick={addManual} disabled={busy || !manual.name.trim()} style={{ ...primaryBtn, marginTop: 12 }}>Add it</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Barcode ────────────────────────────────────────────────
//
// `BarcodeDetector` is built into Chrome on Android, which is what most of
// these clients carry. iOS Safari does not have it, and no polyfill is worth
// shipping a WASM decoder for — so on those phones the camera is skipped
// entirely and the number is typed in. Both paths end in the same lookup.
function Scanner({ onCode, onError, busy }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [live, setLive] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const supported = typeof window !== "undefined" && "BarcodeDetector" in window;

  const stop = useCallback(() => {
    const s = streamRef.current;
    if (s) s.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  }, []);

  useEffect(() => stop, [stop]);

  const start = async () => {
    if (!supported) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setLive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new window.BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
      });

      let stopped = false;
      const tick = async () => {
        if (stopped || !videoRef.current) return;
        try {
          const found = await detector.detect(videoRef.current);
          if (found && found.length) {
            stopped = true;
            stop();
            onCode(found[0].rawValue);
            return;
          }
        } catch { /* a frame that will not decode is normal */ }
        setTimeout(tick, 350);
      };
      tick();
    } catch {
      onError("The camera could not be opened. Type the number under the barcode instead.");
      stop();
    }
  };

  return (
    <div>
      {supported ? (
        <>
          {live ? (
            <video ref={videoRef} muted playsInline
              style={{ width: "100%", borderRadius: 12, background: "#000", aspectRatio: "4 / 3", objectFit: "cover" }} />
          ) : (
            <button onClick={start} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>
              <Icon n="camera" s={15} c="#FCFCFD" /> Open the camera
            </button>
          )}
          <div style={{ fontSize: 11, color: G.muted, marginTop: 8 }}>
            Hold the barcode inside the frame. It reads by itself.
          </div>
        </>
      ) : (
        <div style={{ fontSize: 11.5, color: G.muted, marginBottom: 10, lineHeight: 1.5 }}>
          This phone's browser cannot use the camera for barcodes. Type the number printed
          under the barcode instead.
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input className="inp" inputMode="numeric" placeholder="Barcode number" value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onCode(manualCode)}
          style={{ flex: 1, minWidth: 0 }} />
        <button onClick={() => onCode(manualCode)} disabled={busy || manualCode.trim().length < 6} style={primaryBtn}>Look up</button>
      </div>
    </div>
  );
}

// ── styles ─────────────────────────────────────────────────
const navBtn = {
  width: 34, height: 34, borderRadius: 9, border: `1px solid ${G.border}`,
  background: G.surf, color: G.muted, fontSize: 18, lineHeight: 1, cursor: "pointer",
};
const primaryBtn = {
  display: "inline-flex", alignItems: "center", gap: 7, minHeight: 44, padding: "0 16px",
  borderRadius: 10, border: "none", background: G.accent, color: "#FCFCFD",
  fontSize: 13, fontWeight: 700, cursor: "pointer",
};
const ghostBtn = {
  display: "inline-flex", alignItems: "center", gap: 7, minHeight: 44, padding: "0 16px",
  borderRadius: 10, border: `1px solid ${G.border}`, background: G.surf, color: G.muted,
  fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const trashBtn = {
  width: 32, height: 32, flexShrink: 0, borderRadius: 8, border: "none",
  background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
const sectionLabel = {
  fontSize: 10, color: G.muted, letterSpacing: 1.2, textTransform: "uppercase",
  fontWeight: 700, marginBottom: 8,
};
const entryRow = {
  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
  borderTop: `1px solid ${G.border}`,
};
const errBox = {
  background: G.redSoft, border: `1px solid ${G.redLine}`, borderRadius: 10,
  padding: "9px 12px", color: G.red, fontSize: 12, marginBottom: 10,
};
const chip = {
  border: `1px solid ${G.border}`, background: G.surf, color: G.muted,
  borderRadius: 20, padding: "7px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer",
};
const chipOn = { background: G.accentSoft, borderColor: G.accentLine, color: G.accent };
const tab = {
  flex: 1, border: `1px solid ${G.border}`, background: G.surf, color: G.muted,
  borderRadius: 10, minHeight: 40, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
};
const tabOn = { background: G.accentSoft, borderColor: G.accentLine, color: G.accent };
const resultRow = {
  display: "block", width: "100%", textAlign: "left", border: "none",
  borderTop: `1px solid ${G.border}`, background: "none", padding: "9px 0", cursor: "pointer",
};
const sheetWrap = {
  position: "fixed", inset: 0, background: "rgba(14,32,53,0.45)", zIndex: 9999,
  display: "flex", alignItems: "flex-end", justifyContent: "center",
};
const sheet = {
  width: "100%", maxWidth: 520, maxHeight: "88dvh", overflowY: "auto",
  borderRadius: "18px 18px 0 0", padding: 18,
  paddingBottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
};
