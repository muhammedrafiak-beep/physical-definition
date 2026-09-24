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

// ── Nutrition tab ──────────────────────────────────────────
//
// One screen, two clearly separate things:
//   DIARY      what the client actually logged (food_logs, via food.day)
//   MEAL PLAN  what the trainer assigned (static plans in meals.js, scaled
//              to the client's target by App.jsx and passed in as `plan`)
// The dark summary card at the top only ever shows LOGGED food against the
// daily target. Switching between the two views never writes anything.
//
// Logging a planned meal goes through the ordinary food.add with
// source = planKey(plan, meal). That key is how the logged state is shown and
// how a second log of the same meal on the same day is refused (here and on
// the server). No new table or nutrition calculation is involved.

export const planKey = (planId, time) => `plan:${planId}@${time}`.slice(0, 20);

const TXT = {
  en: { today: "Today", prev: "Previous day", next: "Next day", logged: "kcal logged", of: "of",
    protein: "Protein", carbs: "Carbs", fat: "Fat", diary: "Diary", plan: "Meal plan", active: "Active",
    meals: "meals", log: "Log", loggedBtn: "Logged", logging: "Logging…", addFood: "Add food",
    prep: "How to prep", noPrep: "No preparation notes for this meal.", eaten: "Logged today",
    emptyDiary: "Nothing logged for this day yet.", more: "More nutrients", targets: "Targets",
    loading: "Loading…", planMeta: (n, k) => `${n} meals · ${k.toLocaleString()} kcal`,
    openMeal: (m) => `Show preparation for ${m}`, logMeal: (m) => `Log ${m} to the diary`,
    alreadyLogged: (m) => `${m} is already logged for this day` },
  ar: { today: "اليوم", prev: "اليوم السابق", next: "اليوم التالي", logged: "سعرة مسجّلة", of: "من",
    protein: "بروتين", carbs: "كربوهيدرات", fat: "دهون", diary: "اليوميات", plan: "خطة الوجبات", active: "نشطة",
    meals: "وجبات", log: "سجّل", loggedBtn: "مسجّلة", logging: "جارٍ التسجيل…", addFood: "إضافة طعام",
    prep: "طريقة التحضير", noPrep: "لا توجد ملاحظات تحضير لهذه الوجبة.", eaten: "المسجّل اليوم",
    emptyDiary: "لم يُسجَّل شيء لهذا اليوم بعد.", more: "عناصر غذائية أخرى", targets: "الأهداف",
    loading: "جارٍ التحميل…", planMeta: (n, k) => `${n} وجبات · ${k.toLocaleString()} سعرة`,
    openMeal: (m) => `عرض طريقة تحضير ${m}`, logMeal: (m) => `تسجيل ${m} في اليوميات`,
    alreadyLogged: (m) => `${m} مسجّلة بالفعل لهذا اليوم` },
};

// plan: null | { id, name, image, meals: [{ key, time, label, items, cal, p, c, f, img, prep[] }] }
export function NutritionTab({ title, plan = null, legacyText = "", noPlanText = "", isAr = false }) {
  const L = isAr ? TXT.ar : TXT.en;
  const [date, setDate] = useState(localDay());
  const [day, setDay] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingTargets, setEditingTargets] = useState(false);
  const [view, setView] = useState(plan || legacyText ? "plan" : "diary");
  const [openKey, setOpenKey] = useState(null);
  const [loggingKey, setLoggingKey] = useState(null);
  const inFlight = useRef(new Set());

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
  const loadedFor = day?.date === date;
  const loggedKeys = useMemo(() => new Set(entries.map((e) => e.source).filter((s) => typeof s === "string" && s.startsWith("plan:"))), [entries]);

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

  const logMeal = async (m) => {
    if (!loadedFor || loggedKeys.has(m.key) || inFlight.current.has(m.key)) return;
    inFlight.current.add(m.key); setLoggingKey(m.key); setErr("");
    try {
      await post({ action: "food.add", date, meal: m.label, name: m.items || m.label, source: m.key,
        kcal: m.cal, protein_g: m.p, carbs_g: m.c, fat_g: m.f });
    } catch (e) { setErr(e.message); }
    finally { inFlight.current.delete(m.key); setLoggingKey(null); load(date); }
  };

  const dateLabel = isToday ? L.today
    : new Date(date + "T12:00:00").toLocaleDateString(isAr ? "ar" : undefined, { weekday: "short", day: "numeric", month: "short" });
  const kcal = Number(totals.kcal) || 0, kcalT = Number(targets.kcal) || 0;
  const pct = kcalT > 0 ? Math.min(100, Math.round((kcal / kcalT) * 100)) : 0;
  const planKcal = plan ? plan.meals.reduce((a, m) => a + (Number(m.cal) || 0), 0) : 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
        <div className="sf" style={{ fontSize: 30, lineHeight: 1.1 }}>{title}</div>
        <div role="group" aria-label={dateLabel} style={datePill}>
          <button onClick={() => shiftDay(-1)} aria-label={L.prev} style={pillBtn}><Chevron dir={isAr ? "right" : "left"} /></button>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: G.text, whiteSpace: "nowrap" }}>
            <Icon n="calendar" s={15} c={G.text} /> {dateLabel}
          </span>
          <button onClick={() => shiftDay(1)} aria-label={L.next} disabled={isToday}
            style={{ ...pillBtn, opacity: isToday ? 0.3 : 1 }}><Chevron dir={isAr ? "left" : "right"} /></button>
        </div>
      </div>

      {/* Daily summary: LOGGED food only. */}
      <div style={summaryCard} aria-busy={busy && !day}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 34, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{busy && !day ? "–" : Math.round(kcal).toLocaleString()}</span>
          <span style={{ fontSize: 15, color: "#C9D6EA" }}>/ {kcalT ? Math.round(kcalT).toLocaleString() : "—"} {L.logged}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.18)", borderRadius: 3, overflow: "hidden" }}
            role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={L.logged}>
            <div style={{ width: `${pct}%`, height: "100%", background: "#D3E0F2", borderRadius: 3, transition: "width .25s" }} />
          </div>
          <span style={{ fontSize: 12, color: "#C9D6EA", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.14)", paddingTop: 12 }}>
          {[["protein_g", L.protein, "#F6D9D9", <Icon key="i" n="train" s={16} c={G.red} />], ["carbs_g", L.carbs, "#F4E4BF", <MacroIcon key="i" kind="carbs" />], ["fat_g", L.fat, "#D8E4F6", <MacroIcon key="i" kind="fat" />]].map(([k, lab, bg, ic], i) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, paddingInlineStart: i ? 10 : 0, borderInlineStart: i ? "1px solid rgba(255,255,255,0.14)" : "none" }}>
              <span aria-hidden="true" style={{ width: 30, height: 30, borderRadius: 15, background: bg, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>{ic}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "#C9D6EA" }}>{lab}</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                  {Math.round(Number(totals[k]) || 0)}<span style={{ fontWeight: 500, color: "#C9D6EA" }}> / {targets[k] ? Math.round(targets[k]) : "—"}g</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div role="tablist" aria-label={`${L.diary} / ${L.plan}`} style={segWrap}>
        {[["diary", L.diary], ["plan", L.plan]].map(([id, lab]) => (
          <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}
            style={{ ...segBtn, ...(view === id ? segOn : null) }}>{lab}</button>
        ))}
      </div>

      {err && <div style={errBox} role="alert">{err}</div>}

      {view === "diary" ? (
        <div className="card" style={{ padding: 16, marginBottom: 16 }} role="tabpanel" aria-label={L.diary}>
          {busy && !day ? (
            <div style={{ padding: "22px 0", textAlign: "center", color: G.muted, fontSize: 12.5 }}>{L.loading}</div>
          ) : (
            <>
              <div style={sectionLabel}>{L.eaten}</div>
              {entries.length === 0 ? (
                <div style={{ padding: "14px 0 6px", color: G.muted, fontSize: 12.5 }}>{L.emptyDiary}</div>
              ) : entries.map((e) => (
                <div key={e.id} style={entryRow}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: G.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</div>
                    <div style={{ fontSize: 10.5, color: G.muted, marginTop: 1 }}>
                      {[e.meal, e.brand, e.grams ? `${Math.round(e.grams)} g` : null].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: G.text, fontVariantNumeric: "tabular-nums" }}>{show(e.kcal, "")}</div>
                  <button onClick={() => remove(e.id)} aria-label={`Remove ${e.name}`} style={trashBtn}><Icon n="trash" s={13} c={G.dim} /></button>
                </div>
              ))}
              <details style={{ marginTop: 14 }}>
                <summary style={{ fontSize: 12, fontWeight: 700, color: G.accent, cursor: "pointer", minHeight: 32, display: "flex", alignItems: "center" }}>{L.more}</summary>
                <div style={{ marginTop: 8 }}>
                  {ROWS.slice(4).map((row) => <Bar key={row.k} row={row} eaten={Number(totals[row.k]) || 0} target={targets[row.k]} />)}
                </div>
              </details>
              <div style={{ marginTop: 10 }}>
                <button onClick={() => setEditingTargets((v) => !v)} style={ghostBtn} aria-expanded={editingTargets}>{L.targets}</button>
              </div>
              {editingTargets && (
                <TargetEditor targets={targets} onSaved={() => { setEditingTargets(false); load(date); }} onError={setErr} />
              )}
            </>
          )}
        </div>
      ) : (
        <div role="tabpanel" aria-label={L.plan}>
          {plan ? (
            <>
              <div style={planHead}>
                {plan.image && <img src={plan.image} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", flex: "0 0 auto" }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="sf" style={{ fontSize: 22, lineHeight: 1.15, color: G.text }}>{plan.name}</div>
                  <div style={{ fontSize: 12.5, color: G.muted, marginTop: 3 }}>{L.planMeta(plan.meals.length, planKcal)}</div>
                </div>
                <span style={activePill}><span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 4, background: G.green }} />{L.active}</span>
              </div>
              {plan.meals.map((m) => {
                const done = loggedKeys.has(m.key);
                const isOpen = openKey === m.key;
                const logBusy = loggingKey === m.key;
                return (
                  <div key={m.key} style={mealRow}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      {m.img ? <img src={m.img} alt="" loading="lazy" style={thumb} /> : <div aria-hidden="true" style={{ ...thumb, background: G.surf2 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={timeBadge}>{m.time}</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: G.text }}>{m.labelShown}</span>
                        </div>
                        <div style={{ fontSize: 12, color: G.muted, lineHeight: 1.45, marginTop: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{m.items}</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 7 }}>
                          <span dir="ltr" style={{ ...chipS, background: G.amberSoft, color: G.amber }}>{m.cal} kcal</span>
                          <span dir="ltr" style={{ ...chipS, background: G.redSoft, color: G.red }}>P {m.p}g</span>
                          <span dir="ltr" style={{ ...chipS, background: "#FBF2E3", color: G.amber }}>C {m.c}g</span>
                          <span dir="ltr" style={{ ...chipS, background: G.accentSoft, color: G.accent }}>F {m.f}g</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flex: "0 0 auto" }}>
                        <button onClick={() => logMeal(m)} disabled={done || logBusy || !loadedFor}
                          aria-label={done ? L.alreadyLogged(m.labelShown) : L.logMeal(m.labelShown)}
                          style={done ? loggedBtnS : { ...logBtnS, opacity: !loadedFor ? 0.5 : 1 }}>
                          {done ? <><Icon n="check" s={12} c={G.green} /> {L.loggedBtn}</> : logBusy ? L.logging : L.log}
                        </button>
                        <button onClick={() => setOpenKey(isOpen ? null : m.key)} aria-expanded={isOpen}
                          aria-label={L.openMeal(m.labelShown)} style={chevBtn}>
                          <Chevron dir={isOpen ? "up" : "down"} />
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${G.border}` }}>
                        <div style={sectionLabel}>{L.prep}</div>
                        {m.prep && m.prep.length ? (
                          <ol style={{ margin: "6px 0 0", paddingInlineStart: 18 }}>
                            {m.prep.map((step, i) => <li key={i} style={{ fontSize: 12.5, color: G.text, lineHeight: 1.6, marginBottom: 4 }}>{step}</li>)}
                          </ol>
                        ) : <div style={{ fontSize: 12.5, color: G.muted }}>{L.noPrep}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : legacyText ? (
            <div className="card" style={{ padding: 16 }}>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.9, color: G.text, margin: 0, fontFamily: "inherit" }}>{legacyText}</pre>
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "36px 20px", color: G.muted }}>
              <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}><Icon n="food" s={26} c={G.dim} /></div>
              <div>{noPlanText}</div>
            </div>
          )}
        </div>
      )}

      {/* Room for the floating Add food button above the fixed bottom nav. */}
      <div aria-hidden="true" style={{ height: 68 }} />
      <button onClick={() => setAdding(true)} style={fab}>
        <Icon n="plus" s={16} c="#FCFCFD" w={2.2} /> {L.addFood}
      </button>

      {adding && (
        <AddFood date={date} onClose={() => setAdding(false)} onAdded={() => { setAdding(false); load(date); }} />
      )}
    </div>
  );
}

function MacroIcon({ kind }) {
  // Line icons in the app's stroke style (Icons.jsx has none for these two).
  return kind === "carbs" ? (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke={G.amber} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21V9" /><path d="M12 13c-2.5 0-4-1.6-4-4 2.5 0 4 1.6 4 4zM12 13c2.5 0 4-1.6 4-4-2.5 0-4 1.6-4 4zM12 17c-2.5 0-4-1.6-4-4 2.5 0 4 1.6 4 4zM12 17c2.5 0 4-1.6 4-4-2.5 0-4 1.6-4 4zM12 9c-1.3-1-1.3-3.5 0-5 1.3 1.5 1.3 4 0 5z" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke={G.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5c3 4 5.5 7 5.5 10.2A5.5 5.5 0 0 1 12 19.5a5.5 5.5 0 0 1-5.5-5.8C6.5 10.5 9 7.5 12 3.5z" />
    </svg>
  );
}

function Chevron({ dir = "right" }) {
  const rot = { right: 0, down: 90, left: 180, up: 270 }[dir];
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M9 5l7 7-7 7" fill="none" stroke={G.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: G.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.name}
                      {/* Somebody has scanned this one before, so it came
                          out of our own table rather than off the internet. */}
                      {f.known && (
                        <span style={{ marginLeft: 6, fontSize: 9.5, fontWeight: 700, letterSpacing: ".04em",
                          color: G.green, background: G.greenSoft, border: `1px solid ${G.greenLine}`,
                          borderRadius: 20, padding: "1px 7px", verticalAlign: "middle" }}>SCANNED BEFORE</span>
                      )}
                    </span>
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
// Two decoders, because one is not enough.
//
// `BarcodeDetector` is built into the browser and costs nothing to use, but
// Chrome only ships it on Android, macOS and ChromeOS. On an iPhone — Safari
// and iOS Chrome alike, since both are WebKit — it does not exist, and neither
// does it on Chrome for Windows. An earlier version of this simply hid the
// camera on those devices and asked people to type thirteen digits off a
// packet, which is not a feature anybody uses twice.
//
// So: use the built-in one where it exists, and otherwise pull ZXing in with a
// dynamic import. The import is dynamic on purpose — Vite splits it into its
// own chunk, so the decoder is downloaded the first time somebody opens the
// scanner and never by anyone who does not.
function Scanner({ onCode, onError, busy }) {
  const videoRef = useRef(null);
  const stopRef = useRef(null);          // whatever tears the current camera down
  const [live, setLive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const native = typeof window !== "undefined" && "BarcodeDetector" in window;

  const stop = useCallback(() => {
    if (stopRef.current) { try { stopRef.current(); } catch { /* already gone */ } }
    stopRef.current = null;
    setLive(false);
  }, []);

  // Leaving the sheet with the camera still on is how a phone ends up warm in
  // somebody's pocket with the light on.
  useEffect(() => stop, [stop]);

  const found = (code) => { stop(); onCode(code); };

  const startNative = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    let stopped = false;
    stopRef.current = () => { stopped = true; stream.getTracks().forEach((t) => t.stop()); };
    setLive(true);

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }

    const detector = new window.BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
    });

    const tick = async () => {
      if (stopped || !videoRef.current) return;
      try {
        const hits = await detector.detect(videoRef.current);
        if (hits && hits.length) return found(hits[0].rawValue);
      } catch { /* a frame that will not decode is normal */ }
      setTimeout(tick, 350);
    };
    tick();
  };

  const startZxing = async () => {
    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    const reader = new BrowserMultiFormatReader();
    setLive(true);

    // It opens and owns the camera itself, so there is no getUserMedia here.
    // `undefined` for the device id means "let the browser choose", which on a
    // phone is the back camera.
    const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
      if (result) found(result.getText());
    });
    stopRef.current = () => controls.stop();
  };

  const start = async () => {
    setStarting(true);
    try {
      // The video element has to exist before either decoder is handed it.
      setLive(true);
      await new Promise((r) => setTimeout(r, 0));
      if (native) await startNative();
      else await startZxing();
    } catch (e) {
      stop();
      const denied = e && (e.name === "NotAllowedError" || e.name === "SecurityError");
      onError(denied
        ? "The camera was blocked. Allow it for this site in the browser's settings, or type the number below."
        : "The camera could not be opened. Type the number under the barcode instead.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div>
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        style={{
          width: "100%", borderRadius: 12, background: "#000",
          aspectRatio: "4 / 3", objectFit: "cover",
          display: live ? "block" : "none",
        }}
      />

      {!live && (
        <button onClick={start} disabled={starting} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>
          <Icon n="camera" s={15} c="#FCFCFD" /> {starting ? "Opening…" : "Open the camera"}
        </button>
      )}

      <div style={{ fontSize: 11, color: G.muted, marginTop: 8 }}>
        {live
          ? "Hold the barcode inside the frame. It reads by itself."
          : "Or type the number printed under the barcode — it looks up exactly the same thing."}
      </div>

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

const datePill = { display: "inline-flex", alignItems: "center", gap: 2, background: G.surf, border: `1px solid ${G.border}`, borderRadius: 999, padding: "2px 4px", boxShadow: "0 1px 2px rgba(14,32,53,0.04)" };
const pillBtn = { width: 34, height: 36, border: "none", background: "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 18 };
const summaryCard = { background: G.ink, color: "#FCFCFD", borderRadius: 18, padding: "16px 16px 14px", marginBottom: 14, boxShadow: "0 6px 18px rgba(14,32,53,0.18)" };
const segWrap = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, background: G.surf, border: `1px solid ${G.border}`, borderRadius: 14, padding: 4, marginBottom: 14 };
const segBtn = { minHeight: 42, border: "none", borderRadius: 10, background: "transparent", color: G.muted, fontSize: 14, fontWeight: 700, cursor: "pointer" };
const segOn = { background: G.accent, color: "#FCFCFD", boxShadow: "0 2px 6px rgba(33,80,155,0.25)" };
const planHead = { display: "flex", alignItems: "center", gap: 12, background: G.surf, border: `1px solid ${G.border}`, borderRadius: 16, padding: 10, marginBottom: 10, boxShadow: "0 1px 3px rgba(14,32,53,0.05)" };
const activePill = { display: "inline-flex", alignItems: "center", gap: 6, background: G.greenSoft, color: G.green, fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "6px 10px", flex: "0 0 auto" };
const mealRow = { background: G.surf, border: `1px solid ${G.border}`, borderRadius: 16, padding: 10, marginBottom: 10, boxShadow: "0 1px 3px rgba(14,32,53,0.05)" };
const thumb = { width: 68, height: 68, borderRadius: 12, objectFit: "cover", flex: "0 0 auto", display: "block" };
const timeBadge = { background: G.redSoft, color: G.red, fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "3px 9px", fontVariantNumeric: "tabular-nums" };
const chipS = { fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "3px 6px", whiteSpace: "nowrap" };
const logBtnS = { minWidth: 58, minHeight: 36, borderRadius: 10, border: `1.5px solid ${G.accent}`, background: G.surf, color: G.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "0 10px" };
const loggedBtnS = { ...logBtnS, border: `1.5px solid ${G.greenLine}`, background: G.greenSoft, color: G.green, cursor: "default", display: "inline-flex", alignItems: "center", gap: 4 };
const chevBtn = { width: 36, height: 36, border: "none", background: "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 18 };
const fab = { position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)", zIndex: 90, display: "inline-flex", alignItems: "center", gap: 8, minHeight: 48, padding: "0 22px", borderRadius: 999, border: "none", background: G.accent, color: "#FCFCFD", fontSize: 15, fontWeight: 700, boxShadow: "0 8px 20px rgba(33,80,155,0.35)", cursor: "pointer" };
