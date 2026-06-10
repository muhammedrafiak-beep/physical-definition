import { useState, useEffect, useCallback } from "react";

const TRAINER = {
  name: "MUHAMMED RAFI",
  designation: "Certified Personal Trainer",
  whatsapp: "97471000786",
  tagline: "Your Fitness Journey Starts Here",
};
const ADMIN_CREDS = { u: "admin", p: "pd@rafi2024" };
const GOALS = ["Weight Loss", "Muscle Gain", "Endurance", "Flexibility", "General Fitness"];
const SK = "pd_v3_clients";
const AK = "pd_v3_apikey";

const load = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const DEMO = [
  { id: 1, name: "Arjun Menon", email: "arjun@email.com", password: "client123", age: 28, weight: 82, height: 175, goal: "Weight Loss", phone: "9876543210", joinDate: "2024-01-15", status: "Active", workoutPlan: null, nutritionPlan: null, progress: [{ date: "2024-01-15", weight: 82 }, { date: "2024-02-15", weight: 79 }, { date: "2024-03-15", weight: 76 }] },
  { id: 2, name: "Priya Nair", email: "priya@email.com", password: "client456", age: 32, weight: 65, height: 162, goal: "Muscle Gain", phone: "9123456780", joinDate: "2024-02-10", status: "Active", workoutPlan: null, nutritionPlan: null, progress: [{ date: "2024-02-10", weight: 65 }, { date: "2024-03-10", weight: 66.5 }, { date: "2024-04-10", weight: 68 }] },
];

async function callAI(prompt, apiKey) {
  if (!apiKey) throw new Error("NO_KEY");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error("API_ERROR");
  const d = await res.json();
  return d.content?.[0]?.text || "Could not generate plan.";
}

const G = {
  bg: "#080600", surf: "#110e00", surf2: "#1c1500",
  border: "rgba(212,175,55,0.14)", borderHi: "rgba(212,175,55,0.38)",
  gold: "#d4af37", grad: "linear-gradient(135deg,#d4af37,#f5d76e,#b8860b)",
  text: "#f0e8cc", muted: "#7a6a30", dim: "#3a2d10",
  green: "#22c55e", red: "#ef4444", amber: "#f59e0b", blue: "#60a5fa",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html,body{background:#080600;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;width:100%;}
input,select,button,textarea{font-family:'Inter',sans-serif;}
.serif{font-family:'Cormorant Garamond',serif;}
.gold{background:linear-gradient(90deg,#f5d76e,#d4af37);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.btn{cursor:pointer;border:none;transition:opacity .15s,transform .1s;outline:none;-webkit-tap-highlight-color:transparent;}
.btn:active{opacity:.75;transform:scale(.97);}
.inp{background:#1c1500;border:1px solid rgba(212,175,55,0.15);border-radius:10px;padding:13px 14px;color:#f0e8cc;font-size:15px;width:100%;outline:none;}
.inp:focus{border-color:rgba(212,175,55,0.5);}
.inp::placeholder{color:#3a2d10;}
.card{background:#110e00;border:1px solid rgba(212,175,55,0.14);border-radius:14px;}
.fade{animation:fi .25s ease;}
@keyframes fi{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
.spin{width:36px;height:36px;border:3px solid #1c1500;border-top:3px solid #d4af37;border-radius:50%;animation:spin .7s linear infinite;}
`;

const Logo = ({ s = 36 }) => (
  <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill="url(#lg)" />
    <defs><linearGradient id="lg" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stopColor="#d4af37" /><stop offset="50%" stopColor="#f5d76e" /><stop offset="100%" stopColor="#b8860b" /></linearGradient></defs>
    <text x="6" y="33" fontFamily="Georgia,serif" fontSize="22" fontWeight="900" fill="#080600" letterSpacing="-1">PD</text>
    <rect x="6" y="37" width="36" height="2.5" rx="1.25" fill="#080600" opacity="0.5" />
  </svg>
);

const Av = ({ name = "?", size = 38 }) => {
  const i = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: 10, background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.33, fontWeight: 800, color: "#080600", flexShrink: 0 }}>{i}</div>;
};

const Pill = ({ active }) => (
  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: active ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: active ? G.green : G.red, border: `1px solid ${active ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` }}>
    {active ? "Active" : "Inactive"}
  </span>
);

const variants = {
  gold: { background: G.grad, color: "#080600", fontWeight: 700, borderRadius: 10 },
  ghost: { background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: G.gold, borderRadius: 8 },
  danger: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", borderRadius: 8 },
  green: { background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: G.green, borderRadius: 8 },
  blue: { background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", color: G.blue, borderRadius: 8 },
};
const Btn = ({ children, v = "gold", onClick, full, style: s = {} }) => (
  <button className="btn" onClick={onClick} style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, width: full ? "100%" : undefined, ...variants[v], ...s }}>
    {children}
  </button>
);

const Overlay = ({ show, onClose, children, maxW = 520 }) => {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: 16, overflowY: "auto" }} onClick={onClose}>
      <div className="card" style={{ width: "100%", maxWidth: maxW, padding: 24, border: `1px solid ${G.borderHi}`, marginTop: 20 }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const Header = ({ right }) => (
  <div style={{ background: G.surf, borderBottom: `1px solid ${G.border}`, padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Logo s={28} />
      <div className="serif gold" style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>PHYSICAL DEFINITION</div>
    </div>
    {right}
  </div>
);

// ─── CLIENT CARD ───────────────────────────────────────────────────────────
const ClientCard = ({ client, onAI, onView, onToggle }) => (
  <div className="card" style={{ padding: 16, marginBottom: 12 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <Av name={client.name} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: G.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
        <div style={{ fontSize: 12, color: G.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.email}</div>
      </div>
      <Pill active={client.status === "Active"} />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
      {[{ l: "Goal", v: client.goal }, { l: "Weight", v: `${client.weight}kg` }, { l: "Age", v: `${client.age}y` }].map(x => (
        <div key={x.l} style={{ background: G.surf2, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: G.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{x.l}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{x.v}</div>
        </div>
      ))}
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
      <div style={{ flex: 1, background: G.surf2, borderRadius: 8, padding: "8px", textAlign: "center", border: `1px solid ${client.workoutPlan ? "rgba(34,197,94,0.2)" : G.border}` }}>
        <span style={{ fontSize: 12, color: client.workoutPlan ? G.green : G.dim }}>⚡ {client.workoutPlan ? "Ready" : "Pending"}</span>
      </div>
      <div style={{ flex: 1, background: G.surf2, borderRadius: 8, padding: "8px", textAlign: "center", border: `1px solid ${client.nutritionPlan ? "rgba(34,197,94,0.2)" : G.border}` }}>
        <span style={{ fontSize: 12, color: client.nutritionPlan ? G.green : G.dim }}>🥗 {client.nutritionPlan ? "Ready" : "Pending"}</span>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
      <Btn v="ghost" onClick={() => onView(client)} s={{ padding: "8px", fontSize: 12 }}>View</Btn>
      <Btn v="ghost" onClick={() => onAI(client, "workout")} s={{ padding: "8px", fontSize: 12 }}>💪</Btn>
      <Btn v="green" onClick={() => onAI(client, "nutrition")} s={{ padding: "8px", fontSize: 12 }}>🥗</Btn>
      <Btn v={client.status === "Active" ? "danger" : "green"} onClick={() => onToggle(client.id)} s={{ padding: "8px", fontSize: 12 }}>{client.status === "Active" ? "Pause" : "Go"}</Btn>
    </div>
  </div>
);

// ─── PLANS TAB WITH MANUAL EDITOR ────────────────────────────────────────────
function PlansTab({ clients, selC, setSelC, setClients, genAI }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const sc = clients.find(c => c.id === selC?.id);

  const startEdit = (client, type) => {
    setEditing({ clientId: client.id, type });
    setDraft(client[type === "workout" ? "workoutPlan" : "nutritionPlan"] || "");
  };

  const savePlan = () => {
    if (!editing) return;
    const key = editing.type === "workout" ? "workoutPlan" : "nutritionPlan";
    setClients(prev => prev.map(c => c.id === editing.clientId ? { ...c, [key]: draft } : c));
    setSelC(prev => prev?.id === editing.clientId ? { ...prev, [key]: draft } : prev);
    setEditing(null); setDraft("");
  };

  const clearPlan = (client, type) => {
    const key = type === "workout" ? "workoutPlan" : "nutritionPlan";
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, [key]: null } : c));
  };

  return (
    <div className="fade">
      <div style={{ marginBottom: 16 }}>
        <div className="serif gold" style={{ fontSize: 26, fontWeight: 700 }}>Plans</div>
        <div style={{ fontSize: 13, color: G.muted, marginTop: 3 }}>Manually write or AI generate plans for each client</div>
      </div>

      {/* Client selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {clients.map(c => (
          <Btn key={c.id} v={selC?.id === c.id ? "gold" : "ghost"}
            onClick={() => { setSelC(clients.find(x => x.id === c.id)); setEditing(null); }}
            s={{ padding: "8px 16px", fontSize: 13 }}>
            {c.name.split(" ")[0]}
          </Btn>
        ))}
      </div>

      {!sc ? (
        <div className="card" style={{ padding: "48px 20px", textAlign: "center", color: G.dim }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>◈</div>
          <div>Select a client to view or edit plans</div>
        </div>
      ) : (
        <div>
          {/* Client info strip */}
          <div className="card" style={{ padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, border: `1px solid ${G.borderHi}` }}>
            <Av name={sc.name} size={40} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{sc.name}</div>
              <div style={{ fontSize: 12, color: G.muted }}>{sc.goal} · {sc.weight}kg · {sc.age}y · {sc.height}cm</div>
            </div>
          </div>

          {[
            { key: "workoutPlan", label: "⚡ Workout Plan", type: "workout", color: G.gold },
            { key: "nutritionPlan", label: "🥗 Nutrition Plan", type: "nutrition", color: G.green },
          ].map(p => {
            const isEditing = editing?.clientId === sc.id && editing?.type === p.type;
            const hasPlan = !!sc[p.key];
            return (
              <div key={p.key} className="card" style={{ padding: 20, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: p.color }}>{p.label}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {!isEditing ? (
                      <>
                        <Btn v="ghost" onClick={() => startEdit(sc, p.type)} s={{ padding: "7px 14px", fontSize: 12 }}>
                          ✏️ {hasPlan ? "Edit" : "Write"}
                        </Btn>
                        <Btn v={p.type === "workout" ? "ghost" : "green"} onClick={() => genAI(sc, p.type)} s={{ padding: "7px 14px", fontSize: 12 }}>
                          ✦ AI
                        </Btn>
                        {hasPlan && <Btn v="danger" onClick={() => clearPlan(sc, p.type)} s={{ padding: "7px 12px", fontSize: 12 }}>🗑️</Btn>}
                      </>
                    ) : (
                      <>
                        <Btn v="gold" onClick={savePlan} s={{ padding: "7px 16px", fontSize: 12, fontWeight: 700 }}>✓ Save</Btn>
                        <Btn v="danger" onClick={() => { setEditing(null); setDraft(""); }} s={{ padding: "7px 12px", fontSize: 12 }}>Cancel</Btn>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div>
                    <div style={{ fontSize: 11, color: G.muted, marginBottom: 8 }}>
                      {p.type === "workout" ? "Day 1, Day 2... format use ചെയ്യുക:" : "Breakfast, Lunch, Dinner, Snacks format use ചെയ്യുക:"}
                    </div>
                    <textarea value={draft} onChange={e => setDraft(e.target.value)}
                      placeholder={p.type === "workout"
                        ? "Day 1 - Chest & Triceps\n• Bench Press: 4 sets × 10 reps\n• Push-ups: 3 sets × 15 reps\n\nDay 2 - Back & Biceps\n..."
                        : "Breakfast (7:00 AM)\n• Oats with banana - 350 kcal\n• Protein: 12g | Carbs: 58g | Fat: 6g\n\nLunch (1:00 PM)\n..."}
                      style={{ width: "100%", minHeight: 300, background: G.surf2, border: `1px solid ${G.borderHi}`, borderRadius: 10, padding: 14, color: G.text, fontSize: 13, lineHeight: 1.8, resize: "vertical", outline: "none", fontFamily: "Inter, sans-serif" }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 10 }}>
                      <Btn v="danger" onClick={() => { setEditing(null); setDraft(""); }} s={{ padding: "11px 20px", fontSize: 14 }}>Cancel</Btn>
                      <Btn v="gold" onClick={savePlan} s={{ padding: "11px 28px", fontSize: 14, fontWeight: 700 }}>✓ Save Plan</Btn>
                    </div>
                  </div>
                ) : hasPlan ? (
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.9, color: G.text }}>{sc[p.key]}</pre>
                ) : (
                  <div style={{ textAlign: "center", padding: "32px 0", color: G.dim }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{p.type === "workout" ? "⚡" : "🥗"}</div>
                    <div style={{ fontSize: 13, marginBottom: 16 }}>No plan for {sc.name} yet</div>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                      <Btn v="ghost" onClick={() => startEdit(sc, p.type)} s={{ padding: "9px 18px", fontSize: 13 }}>✏️ Write Manually</Btn>
                      <Btn v={p.type === "workout" ? "ghost" : "green"} onClick={() => genAI(sc, p.type)} s={{ padding: "9px 18px", fontSize: 13 }}>✦ AI Generate</Btn>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
export default function App() {
  const [clients, setClients] = useState(() => load(SK, DEMO));
  const [apiKey, setApiKey] = useState(() => load(AK, ""));
  const [screen, setScreen] = useState("login");
  const [userType, setUserType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [lf, setLf] = useState({ u: "", p: "" });
  const [loginErr, setLoginErr] = useState("");
  const [aTab, setATab] = useState("dashboard");
  const [cTab, setCTab] = useState("profile");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selC, setSelC] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newC, setNewC] = useState({ name: "", email: "", password: "", age: "", weight: "", height: "", goal: "Weight Loss", phone: "" });
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiTitle, setAiTitle] = useState("");
  const [keyIn, setKeyIn] = useState("");
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => { save(SK, clients); }, [clients]);

  const login = () => {
    setLoginErr("");
    if (lf.u === ADMIN_CREDS.u && lf.p === ADMIN_CREDS.p) { setUserType("admin"); setCurrentUser({ name: TRAINER.name }); setScreen("admin"); return; }
    const c = clients.find(x => x.email === lf.u && x.password === lf.p);
    if (c) { setUserType("client"); setCurrentUser(c); setScreen("client"); return; }
    setLoginErr("Invalid credentials. Please try again.");
  };

  const logout = () => { setScreen("login"); setUserType(null); setCurrentUser(null); setLf({ u: "", p: "" }); setMenuOpen(false); };

  const saveKey = () => { save(AK, keyIn); setApiKey(keyIn); setKeySaved(true); setTimeout(() => setKeySaved(false), 2500); };

  const genAI = useCallback(async (client, type) => {
    if (!apiKey) { setAiTitle("⚙️ API Key Required"); setAiText("NO_KEY"); setAiOpen(true); return; }
    const bmi = (client.weight / ((client.height / 100) ** 2)).toFixed(1);
    const prompt = type === "workout"
      ? `You are a professional personal trainer. Create a detailed 7-day workout plan for: Name: ${client.name}, Age: ${client.age}, Weight: ${client.weight}kg, Height: ${client.height}cm, BMI: ${bmi}, Goal: ${client.goal}. Format Day 1-7 with exercises, sets, reps, rest. Be specific and motivating.`
      : `You are a professional nutritionist. Create a full daily meal plan for: Name: ${client.name}, Age: ${client.age}, Weight: ${client.weight}kg, Height: ${client.height}cm, BMI: ${bmi}, Goal: ${client.goal}. Include breakfast, lunch, dinner, 2 snacks with foods, portions, calories, protein/carbs/fat.`;
    setAiLoading(true); setAiText(""); setAiTitle(type === "workout" ? "⚡ Workout Plan" : "🥗 Nutrition Plan"); setAiOpen(true);
    try {
      const result = await callAI(prompt, apiKey);
      setAiText(result);
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, [type === "workout" ? "workoutPlan" : "nutritionPlan"]: result } : c));
      if (currentUser?.id === client.id) setCurrentUser(p => ({ ...p, [type === "workout" ? "workoutPlan" : "nutritionPlan"]: result }));
    } catch { setAiText("ERROR"); }
    setAiLoading(false);
  }, [apiKey, currentUser]);

  const addClient = () => {
    if (!newC.name || !newC.email || !newC.password) return;
    const c = { ...newC, id: Date.now(), age: +newC.age || 25, weight: +newC.weight || 70, height: +newC.height || 170, joinDate: new Date().toISOString().split("T")[0], status: "Active", workoutPlan: null, nutritionPlan: null, progress: [{ date: new Date().toISOString().split("T")[0], weight: +newC.weight || 70 }] };
    setClients(p => [...p, c]);
    setShowAdd(false);
    setNewC({ name: "", email: "", password: "", age: "", weight: "", height: "", goal: "Weight Loss", phone: "" });
  };

  const liveC = clients.find(c => c.id === currentUser?.id) || currentUser;
  const activeCount = clients.filter(c => c.status === "Active").length;
  const goals = clients.reduce((a, c) => { a[c.goal] = (a[c.goal] || 0) + 1; return a; }, {});

  // ══════ LOGIN ══════
  if (screen === "login") return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{CSS}</style>
      <div className="card fade" style={{ width: "100%", maxWidth: 400, padding: "36px 24px", border: `1px solid ${G.borderHi}` }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><Logo s={60} /></div>
          <div className="serif gold" style={{ fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>PHYSICAL DEFINITION</div>
          <div style={{ fontSize: 11, color: G.muted, letterSpacing: 3, textTransform: "uppercase", marginTop: 6 }}>{TRAINER.tagline}</div>
          <div style={{ width: 40, height: 2, background: G.grad, margin: "12px auto 0", borderRadius: 2 }} />
        </div>
        {loginErr && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 16, textAlign: "center" }}>{loginErr}</div>}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>Username / Email</div>
          <input className="inp" placeholder="Enter credentials" value={lf.u} onChange={e => setLf(p => ({ ...p, u: e.target.value }))} onKeyDown={e => e.key === "Enter" && login()} />
        </div>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 10, color: G.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>Password</div>
          <input className="inp" type="password" placeholder="••••••••" value={lf.p} onChange={e => setLf(p => ({ ...p, p: e.target.value }))} onKeyDown={e => e.key === "Enter" && login()} />
        </div>
        <Btn v="gold" onClick={login} full s={{ padding: "14px", fontSize: 15, letterSpacing: 1.5 }}>ENTER →</Btn>
        <div style={{ marginTop: 20, background: "rgba(212,175,55,0.05)", border: `1px solid ${G.border}`, borderRadius: 10, padding: 14, fontSize: 12, color: G.muted, lineHeight: 2 }}>
          <div style={{ fontSize: 10, color: G.dim, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>Demo Access</div>
          <span style={{ color: G.gold }}>Trainer:</span> admin / pd@rafi2024<br />
          <span style={{ color: G.gold }}>Client:</span> arjun@email.com / client123
        </div>
      </div>
    </div>
  );

  // ══════ CLIENT ══════
  if (screen === "client" && liveC) {
    const bmi = (liveC.weight / ((liveC.height / 100) ** 2)).toFixed(1);
    const bmiLabel = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy" : bmi < 30 ? "Overweight" : "Obese";
    const bmiColor = bmi < 18.5 ? G.amber : bmi < 25 ? G.green : bmi < 30 ? G.amber : G.red;

    return (
      <div style={{ minHeight: "100vh", background: G.bg, color: G.text }}>
        <style>{CSS}</style>
        <Header right={<Btn v="danger" onClick={logout} s={{ padding: "6px 14px", fontSize: 12 }}>OUT</Btn>} />
        <div style={{ background: G.surf, borderBottom: `1px solid ${G.border}`, display: "flex", overflowX: "auto" }}>
          {[{ id: "profile", l: "Profile" }, { id: "workout", l: "Workout" }, { id: "nutrition", l: "Nutrition" }, { id: "progress", l: "Progress" }].map(t => (
            <button key={t.id} className="btn" onClick={() => setCTab(t.id)} style={{ padding: "13px 18px", background: "none", fontSize: 13, fontWeight: 600, color: cTab === t.id ? G.gold : G.muted, borderBottom: cTab === t.id ? `2px solid ${G.gold}` : "2px solid transparent", whiteSpace: "nowrap" }}>{t.l}</button>
          ))}
        </div>

        <div style={{ padding: 16, maxWidth: 600, margin: "0 auto" }}>
          {cTab === "profile" && (
            <div className="fade">
              <div style={{ marginBottom: 18 }}>
                <div className="serif gold" style={{ fontSize: 24, fontWeight: 700 }}>Welcome, {liveC.name.split(" ")[0]}!</div>
                <div style={{ fontSize: 12, color: G.muted, marginTop: 4 }}>Member since {liveC.joinDate}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[{ l: "Age", v: `${liveC.age} yrs` }, { l: "Weight", v: `${liveC.weight} kg` }, { l: "Height", v: `${liveC.height} cm` }, { l: "Goal", v: liveC.goal }].map((x, i) => (
                  <div key={i} className="card" style={{ padding: 14 }}>
                    <div style={{ fontSize: 10, color: G.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5 }}>{x.l}</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{x.v}</div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding: 18, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: G.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>BMI</div>
                    <div style={{ fontSize: 44, fontWeight: 800, color: bmiColor, lineHeight: 1 }}>{bmi}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: bmiColor, marginTop: 4 }}>{bmiLabel}</div>
                  </div>
                  <div style={{ fontSize: 11, color: G.muted, lineHeight: 2.2 }}>
                    {[["< 18.5", "Underweight", G.amber], ["18.5–24.9", "Healthy", G.green], ["25–29.9", "Overweight", G.amber], ["≥ 30", "Obese", G.red]].map(([r, l, c]) => (
                      <div key={l} style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><span>{r}</span><span style={{ color: c, fontWeight: 700, minWidth: 72, textAlign: "right" }}>{l}</span></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: 18, border: `1px solid ${G.borderHi}` }}>
                <div style={{ fontSize: 10, color: G.muted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>Your Trainer</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#080600" }}>MR</div>
                    <div>
                      <div className="serif gold" style={{ fontSize: 17, fontWeight: 700 }}>{TRAINER.name}</div>
                      <div style={{ fontSize: 12, color: G.muted }}>{TRAINER.designation}</div>
                    </div>
                  </div>
                  <a href={`https://wa.me/${TRAINER.whatsapp}`} target="_blank" rel="noreferrer" style={{ padding: "10px 18px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, color: G.green, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>💬 WhatsApp</a>
                </div>
              </div>
            </div>
          )}

          {(cTab === "workout" || cTab === "nutrition") && (
            <div className="fade">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
                <div className="serif gold" style={{ fontSize: 24, fontWeight: 700 }}>{cTab === "workout" ? "Workout Plan" : "Nutrition Plan"}</div>
                <Btn v={cTab === "workout" ? "ghost" : "green"} onClick={() => genAI(liveC, cTab)} s={{ padding: "10px 18px", fontSize: 13 }}>✦ Generate AI Plan</Btn>
              </div>
              <div className="card" style={{ padding: 20, minHeight: 180 }}>
                {(cTab === "workout" ? liveC.workoutPlan : liveC.nutritionPlan)
                  ? <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.9, color: G.text }}>{cTab === "workout" ? liveC.workoutPlan : liveC.nutritionPlan}</pre>
                  : <div style={{ textAlign: "center", padding: "48px 20px", color: G.dim }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>{cTab === "workout" ? "⚡" : "🥗"}</div>
                    <div style={{ color: G.muted, marginBottom: 6 }}>No plan yet</div>
                    <div style={{ fontSize: 12 }}>Tap "Generate AI Plan" to get started</div>
                  </div>}
              </div>
            </div>
          )}

          {cTab === "progress" && (
            <div className="fade">
              <div className="serif gold" style={{ fontSize: 24, fontWeight: 700, marginBottom: 18 }}>Progress</div>
              <div className="card" style={{ padding: 16 }}>
                {liveC.progress.map((p, i) => {
                  const diff = i > 0 ? (p.weight - liveC.progress[i - 1].weight).toFixed(1) : null;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 10px", borderBottom: i < liveC.progress.length - 1 ? `1px solid ${G.border}` : "none" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: G.grad, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: G.muted }}>{p.date}</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{p.weight} <span style={{ fontSize: 11, color: G.muted }}>kg</span></div>
                      </div>
                      {diff !== null && <div style={{ fontSize: 13, fontWeight: 700, color: parseFloat(diff) <= 0 ? G.green : G.red }}>{parseFloat(diff) > 0 ? "+" : ""}{diff} kg</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Overlay show={aiOpen} onClose={() => !aiLoading && setAiOpen(false)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div className="serif gold" style={{ fontSize: 20, fontWeight: 700 }}>{aiTitle}</div>
            {!aiLoading && <button className="btn" onClick={() => setAiOpen(false)} style={{ background: "none", color: G.muted, fontSize: 20, padding: 4 }}>✕</button>}
          </div>
          {aiLoading ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", gap: 14 }}><div className="spin" /><div style={{ color: G.gold, fontWeight: 600, fontSize: 14 }}>AI is crafting your plan...</div></div>
            : aiText === "NO_KEY" ? <div style={{ textAlign: "center", padding: "32px 20px" }}><div style={{ fontSize: 36, marginBottom: 10 }}>⚙️</div><div style={{ color: G.gold, fontWeight: 700, marginBottom: 8 }}>API Key not set</div><div style={{ fontSize: 13, color: G.muted }}>Contact your trainer to enable AI features.</div></div>
            : <div><div style={{ background: "rgba(212,175,55,0.08)", border: `1px solid ${G.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: G.gold }}>✦ Plan saved to your profile</div><pre style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.9, color: G.text }}>{aiText}</pre></div>}
        </Overlay>
      </div>
    );
  }

  // ══════ ADMIN ══════
  const NAV = [{ id: "dashboard", icon: "◈", l: "Dashboard" }, { id: "clients", icon: "◎", l: "Clients" }, { id: "ai-tools", icon: "✦", l: "AI Tools" }, { id: "plans", icon: "▤", l: "Plans" }];

  return (
    <div style={{ minHeight: "100vh", background: G.bg, color: G.text }}>
      <style>{CSS}</style>

      <Header right={
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="ghost" onClick={() => { setShowSettings(true); setKeyIn(apiKey); }} s={{ padding: "6px 12px", fontSize: 12 }}>⚙️</Btn>
          <Btn v="danger" onClick={logout} s={{ padding: "6px 14px", fontSize: 12 }}>OUT</Btn>
        </div>
      } />

      {/* Tab bar */}
      <div style={{ background: G.surf, borderBottom: `1px solid ${G.border}`, display: "flex", overflowX: "auto" }}>
        {NAV.map(item => (
          <button key={item.id} className="btn" onClick={() => setATab(item.id)} style={{ padding: "12px 16px", background: "none", fontSize: 12, fontWeight: 600, color: aTab === item.id ? G.gold : G.muted, borderBottom: aTab === item.id ? `2px solid ${G.gold}` : "2px solid transparent", whiteSpace: "nowrap" }}>
            {item.icon} {item.l}
          </button>
        ))}
      </div>

      <div style={{ padding: 16, maxWidth: 860, margin: "0 auto" }}>

        {/* DASHBOARD */}
        {aTab === "dashboard" && (
          <div className="fade">
            <div style={{ marginBottom: 18 }}>
              <div className="serif gold" style={{ fontSize: 26, fontWeight: 700 }}>Welcome, {TRAINER.name.split(" ")[0]}! 👋</div>
              <div style={{ fontSize: 13, color: G.muted, marginTop: 3 }}>Training business overview</div>
            </div>
            {!apiKey && (
              <div style={{ background: "rgba(212,175,55,0.07)", border: `1px solid ${G.borderHi}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: G.gold }}>⚙️ API Key not configured</div>
                  <div style={{ fontSize: 12, color: G.muted, marginTop: 3 }}>Set Anthropic API key to enable AI plans</div>
                </div>
                <Btn v="gold" onClick={() => { setShowSettings(true); setKeyIn(""); }} s={{ padding: "9px 18px", fontSize: 13 }}>Add Key</Btn>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[{ l: "Total Clients", v: clients.length, c: G.gold }, { l: "Active", v: activeCount, c: G.green }, { l: "Inactive", v: clients.length - activeCount, c: G.amber }, { l: "AI Plans", v: clients.filter(c => c.workoutPlan || c.nutritionPlan).length, c: G.blue }].map((s, i) => (
                <div key={i} className="card" style={{ padding: 18 }}>
                  <div style={{ fontSize: 34, fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 12, color: G.muted, marginTop: 7 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, color: G.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Goals Distribution</div>
              {Object.entries(goals).map(([g, c]) => (
                <div key={g} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}><span>{g}</span><span style={{ color: G.gold, fontWeight: 700 }}>{c}</span></div>
                  <div style={{ height: 4, background: G.surf2, borderRadius: 4 }}><div style={{ height: "100%", width: `${(c / clients.length) * 100}%`, background: G.grad, borderRadius: 4 }} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLIENTS */}
        {aTab === "clients" && (
          <div className="fade">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div className="serif gold" style={{ fontSize: 26, fontWeight: 700 }}>Clients</div>
                <div style={{ fontSize: 13, color: G.muted, marginTop: 3 }}>{clients.length} enrolled · {activeCount} active</div>
              </div>
              <Btn v="gold" onClick={() => setShowAdd(true)} s={{ padding: "10px 20px", fontSize: 13 }}>+ ADD</Btn>
            </div>
            {clients.map(c => (
              <ClientCard key={c.id} client={c}
                onAI={genAI}
                onView={client => { setSelC(client); setATab("plans"); }}
                onToggle={id => setClients(p => p.map(x => x.id === id ? { ...x, status: x.status === "Active" ? "Inactive" : "Active" } : x))}
              />
            ))}
          </div>
        )}

        {/* AI TOOLS */}
        {aTab === "ai-tools" && (
          <div className="fade">
            <div style={{ marginBottom: 16 }}>
              <div className="serif gold" style={{ fontSize: 26, fontWeight: 700 }}>AI Tools</div>
              <div style={{ fontSize: 13, color: G.muted, marginTop: 3 }}>Generate personalised plans</div>
            </div>
            {!apiKey && (
              <div style={{ background: "rgba(212,175,55,0.07)", border: `1px solid ${G.borderHi}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div style={{ fontSize: 14, color: G.gold, fontWeight: 700 }}>⚙️ Add API Key to use AI</div>
                <Btn v="gold" onClick={() => { setShowSettings(true); setKeyIn(""); }} s={{ padding: "9px 18px", fontSize: 13 }}>Add Key</Btn>
              </div>
            )}
            {clients.map(c => (
              <div key={c.id} className="card" style={{ padding: 18, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <Av name={c.name} size={42} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: G.muted }}>{c.goal} · {c.weight}kg · {c.age}y</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {[{ icon: "⚡", l: "Workout", has: c.workoutPlan }, { icon: "🥗", l: "Nutrition", has: c.nutritionPlan }].map(p => (
                    <div key={p.l} style={{ background: G.surf2, borderRadius: 8, padding: 12, textAlign: "center", border: `1px solid ${p.has ? "rgba(34,197,94,0.2)" : G.border}` }}>
                      <div style={{ fontSize: 20 }}>{p.icon}</div>
                      <div style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>{p.l}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: p.has ? G.green : G.amber, marginTop: 2 }}>{p.has ? "✓ Ready" : "Pending"}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Btn v="ghost" onClick={() => genAI(c, "workout")} s={{ padding: "10px", fontSize: 13 }}>⚡ Workout</Btn>
                  <Btn v="green" onClick={() => genAI(c, "nutrition")} s={{ padding: "10px", fontSize: 13 }}>🥗 Nutrition</Btn>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PLANS */}
        {aTab === "plans" && (
          <PlansTab
            clients={clients}
            selC={selC}
            setSelC={setSelC}
            setClients={setClients}
            genAI={genAI}
          />
        )}
      </div>

      {/* SETTINGS */}
      <Overlay show={showSettings} onClose={() => setShowSettings(false)} maxW={460}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div className="serif gold" style={{ fontSize: 22, fontWeight: 700 }}>⚙️ API Settings</div>
          <button className="btn" onClick={() => setShowSettings(false)} style={{ background: "none", color: G.muted, fontSize: 20, padding: 4 }}>✕</button>
        </div>
        <div style={{ background: "rgba(212,175,55,0.06)", border: `1px solid ${G.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 18, fontSize: 12, color: G.muted, lineHeight: 1.8 }}>
          🔒 Key stored only in <strong>your browser</strong>. Never leaves your device.
        </div>
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 10, color: G.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Anthropic API Key</div>
          <input className="inp" type="password" placeholder="sk-ant-api03-..." value={keyIn} onChange={e => setKeyIn(e.target.value)} />
        </div>
        <div style={{ fontSize: 11, color: G.dim, marginBottom: 20 }}>Get key: console.anthropic.com → API Keys → Create Key</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn v="gold" onClick={saveKey} s={{ flex: 1, padding: "13px", fontSize: 14 }}>{keySaved ? "✓ SAVED!" : "SAVE KEY"}</Btn>
          {apiKey && <Btn v="danger" onClick={() => { save(AK, ""); setApiKey(""); setKeyIn(""); }} s={{ padding: "13px 16px", fontSize: 13 }}>CLEAR</Btn>}
        </div>
        {apiKey && <div style={{ marginTop: 12, fontSize: 12, color: G.green, textAlign: "center" }}>✓ API Key is active</div>}
      </Overlay>

      {/* ADD CLIENT */}
      <Overlay show={showAdd} onClose={() => setShowAdd(false)} maxW={500}>
        <div className="serif gold" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Add New Client</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[{ k: "name", l: "Full Name", ph: "John Doe" }, { k: "email", l: "Email", ph: "john@email.com" }, { k: "password", l: "Password", ph: "••••••" }, { k: "phone", l: "Phone", ph: "+974 00000000" }, { k: "age", l: "Age", ph: "25" }, { k: "weight", l: "Weight (kg)", ph: "70" }, { k: "height", l: "Height (cm)", ph: "175" }].map(f => (
            <div key={f.k}>
              <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>{f.l}</div>
              <input className="inp" type={f.k === "password" ? "password" : "text"} placeholder={f.ph} value={newC[f.k]} onChange={e => setNewC(p => ({ ...p, [f.k]: e.target.value }))} />
            </div>
          ))}
          <div>
            <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>Goal</div>
            <select className="inp" value={newC.goal} onChange={e => setNewC(p => ({ ...p, goal: e.target.value }))}>
              {GOALS.map(g => <option key={g} style={{ background: G.surf2 }}>{g}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <Btn v="gold" onClick={addClient} s={{ flex: 1, padding: "13px", fontSize: 14 }}>ADD CLIENT</Btn>
          <Btn v="ghost" onClick={() => setShowAdd(false)} s={{ flex: 1, padding: "13px", fontSize: 14 }}>CANCEL</Btn>
        </div>
      </Overlay>

      {/* AI MODAL */}
      <Overlay show={aiOpen} onClose={() => !aiLoading && setAiOpen(false)} maxW={620}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div className="serif gold" style={{ fontSize: 22, fontWeight: 700 }}>{aiTitle}</div>
          {!aiLoading && <button className="btn" onClick={() => setAiOpen(false)} style={{ background: "none", color: G.muted, fontSize: 20, padding: 4 }}>✕</button>}
        </div>
        {aiLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 20px", gap: 16 }}>
            <div className="spin" />
            <div style={{ color: G.gold, fontWeight: 600, fontSize: 14 }}>AI is crafting your plan...</div>
            <div style={{ color: G.dim, fontSize: 12 }}>Analysing profile & generating recommendations</div>
          </div>
        ) : (aiText === "NO_KEY" || aiText === "ERROR") ? (
          <div style={{ textAlign: "center", padding: "36px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
            <div style={{ color: G.gold, fontWeight: 700, marginBottom: 8 }}>{aiText === "NO_KEY" ? "API Key Required" : "Generation Failed"}</div>
            <div style={{ fontSize: 13, color: G.muted, marginBottom: 20 }}>{aiText === "NO_KEY" ? "Go to ⚙️ Settings and add your Anthropic API key." : "Check your API key in Settings and try again."}</div>
            <Btn v="gold" onClick={() => { setAiOpen(false); setShowSettings(true); setKeyIn(apiKey); }} s={{ padding: "11px 24px", fontSize: 14 }}>⚙️ Open Settings</Btn>
          </div>
        ) : (
          <div>
            <div style={{ background: "rgba(212,175,55,0.08)", border: `1px solid ${G.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: G.gold }}>✦ Plan saved to client profile</div>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.9, color: G.text }}>{aiText}</pre>
          </div>
        )}
      </Overlay>
    </div>
  );
}
