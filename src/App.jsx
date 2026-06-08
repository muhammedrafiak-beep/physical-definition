import { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TRAINER = {
  name: "MUHAMMED RAFI",
  designation: "Certified Personal Trainer",
  phone: "+974 71000786",
  whatsapp: "+97471000786",
  instagram: "#",
  facebook: "#",
  youtube: "#",
  tagline: "Your Fitness Journey Starts Here",
  appName: "Physical Definition",
};

const ADMIN_CREDS = { username: "admin", password: "pd@rafi2024" };

const INITIAL_CLIENTS = [
  {
    id: 1, name: "Arjun Menon", email: "arjun@email.com", password: "client123",
    age: 28, weight: 82, height: 175, goal: "Weight Loss", phone: "9876543210",
    joinDate: "2024-01-15", status: "Active", photo: "AM",
    workoutPlan: null, nutritionPlan: null,
    progress: [{ date: "2024-01-15", weight: 82 }, { date: "2024-02-15", weight: 79 }, { date: "2024-03-15", weight: 76 }],
  },
  {
    id: 2, name: "Priya Nair", email: "priya@email.com", password: "client456",
    age: 32, weight: 65, height: 162, goal: "Muscle Gain", phone: "9123456780",
    joinDate: "2024-02-10", status: "Active", photo: "PN",
    workoutPlan: null, nutritionPlan: null,
    progress: [{ date: "2024-02-10", weight: 65 }, { date: "2024-03-10", weight: 66.5 }, { date: "2024-04-10", weight: 68 }],
  },
  {
    id: 3, name: "Rahul Krishnan", email: "rahul@email.com", password: "client789",
    age: 24, weight: 70, height: 180, goal: "Endurance", phone: "9555123456",
    joinDate: "2024-03-05", status: "Inactive", photo: "RK",
    workoutPlan: null, nutritionPlan: null,
    progress: [{ date: "2024-03-05", weight: 70 }],
  },
];

const GOALS = ["Weight Loss", "Muscle Gain", "Endurance", "Flexibility", "General Fitness"];
const AVATAR_COLORS = ["#b8860b", "#8b6914", "#c9a227", "#a07728", "#d4af37", "#9a7d0a"];

// ─── AI ───────────────────────────────────────────────────────────────────────
async function callAI(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "Error generating plan.";
}

// ─── LOGO SVG ─────────────────────────────────────────────────────────────────
function PDLogo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="url(#goldGrad)" />
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#d4af37" />
          <stop offset="50%" stopColor="#f5d76e" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
        <linearGradient id="darkGrad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#1a1400" />
          <stop offset="100%" stopColor="#0d0a00" />
        </linearGradient>
      </defs>
      {/* PD letters */}
      <text x="7" y="33" fontFamily="Georgia, serif" fontSize="22" fontWeight="900" fill="#0d0a00" letterSpacing="-1">PD</text>
      {/* barbell accent */}
      <rect x="6" y="37" width="36" height="3" rx="1.5" fill="#0d0a00" opacity="0.6" />
      <rect x="6" y="37" width="7" height="3" rx="1.5" fill="#0d0a00" />
      <rect x="35" y="37" width="7" height="3" rx="1.5" fill="#0d0a00" />
    </svg>
  );
}

// ─── GOLD SPINNER ─────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", gap: 20 }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        border: "3px solid #2a2000",
        borderTop: "3px solid #d4af37",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ color: "#d4af37", fontWeight: 700, fontSize: 15 }}>AI is crafting your plan...</div>
      <div style={{ color: "#5a4a00", fontSize: 12 }}>Analysing your data & generating recommendations</div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function PhysicalDefinition() {
  const [screen, setScreen] = useState("login");
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [loginForm, setLoginForm] = useState({ u: "", p: "" });
  const [loginErr, setLoginErr] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);

  // admin
  const [adminTab, setAdminTab] = useState("dashboard");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newC, setNewC] = useState({ name: "", email: "", password: "", age: "", weight: "", height: "", goal: "Weight Loss", phone: "" });

  // client
  const [clientTab, setClientTab] = useState("profile");

  // ai modal
  const [aiModal, setAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiTitle, setAiTitle] = useState("");

  // animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  const login = () => {
    setLoginErr("");
    if (loginForm.u === ADMIN_CREDS.username && loginForm.p === ADMIN_CREDS.password) {
      setUserType("admin"); setCurrentUser({ name: TRAINER.name }); setScreen("admin"); return;
    }
    const c = clients.find(x => x.email === loginForm.u && x.password === loginForm.p);
    if (c) { setUserType("client"); setCurrentUser(c); setScreen("client"); return; }
    setLoginErr("Invalid credentials. Please try again.");
  };

  const logout = () => {
    setScreen("login"); setUserType(null); setCurrentUser(null);
    setLoginForm({ u: "", p: "" }); setAdminTab("dashboard"); setClientTab("profile");
    setSelectedClient(null); setAiText(""); setMounted(false);
    setTimeout(() => setMounted(true), 100);
  };

  const genAI = async (client, type) => {
    setAiLoading(true); setAiText(""); setAiTitle(type === "workout" ? "🏋️ AI Workout Plan" : "🥗 AI Nutrition Plan"); setAiModal(true);
    const bmi = (client.weight / ((client.height / 100) ** 2)).toFixed(1);
    const prompt = type === "workout"
      ? `You are a professional personal trainer. Create a detailed 7-day workout plan for:
Name: ${client.name}, Age: ${client.age}, Weight: ${client.weight}kg, Height: ${client.height}cm, BMI: ${bmi}, Goal: ${client.goal}.
Format with Day 1–7, exercises, sets, reps, rest. Be specific and motivating.`
      : `You are a professional nutritionist. Create a daily meal plan for:
Name: ${client.name}, Age: ${client.age}, Weight: ${client.weight}kg, Height: ${client.height}cm, BMI: ${bmi}, Goal: ${client.goal}.
Include breakfast, lunch, dinner, 2 snacks with foods, portions, calories, protein/carbs/fat.`;
    try {
      const result = await callAI(prompt);
      setAiText(result);
      setClients(prev => prev.map(c => c.id === client.id
        ? { ...c, [type === "workout" ? "workoutPlan" : "nutritionPlan"]: result } : c));
      if (currentUser?.id === client.id) setCurrentUser(prev => ({ ...prev, [type === "workout" ? "workoutPlan" : "nutritionPlan"]: result }));
    } catch { setAiText("Error generating plan. Please check your connection."); }
    setAiLoading(false);
  };

  const addClient = () => {
    if (!newC.name || !newC.email || !newC.password) return;
    const c = {
      ...newC, id: Date.now(),
      age: parseInt(newC.age) || 25, weight: parseFloat(newC.weight) || 70, height: parseFloat(newC.height) || 170,
      joinDate: new Date().toISOString().split("T")[0], status: "Active",
      photo: newC.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
      workoutPlan: null, nutritionPlan: null,
      progress: [{ date: new Date().toISOString().split("T")[0], weight: parseFloat(newC.weight) || 70 }],
    };
    setClients(p => [...p, c]);
    setShowAddModal(false);
    setNewC({ name: "", email: "", password: "", age: "", weight: "", height: "", goal: "Weight Loss", phone: "" });
  };

  const toggleStatus = id => setClients(p => p.map(c => c.id === id ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" } : c));

  const activeCount = clients.filter(c => c.status === "Active").length;
  const plansCount = clients.filter(c => c.workoutPlan || c.nutritionPlan).length;

  // ── THEME ──
  const G = {
    bg: "#080600",
    surface: "#100d00",
    surface2: "#1a1400",
    border: "rgba(212,175,55,0.15)",
    borderBright: "rgba(212,175,55,0.4)",
    gold: "#d4af37",
    goldLight: "#f5d76e",
    goldDark: "#b8860b",
    goldGrad: "linear-gradient(135deg, #d4af37, #f5d76e, #b8860b)",
    goldGradText: "linear-gradient(90deg, #f5d76e, #d4af37)",
    text: "#f0e8cc",
    textMuted: "#7a6a30",
    textDim: "#4a3d10",
    danger: "#ef4444",
    success: "#22c55e",
    warn: "#f59e0b",
  };

  const goldText = { background: G.goldGradText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };

  // ── CSS ──
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Rajdhani:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #080600; }
    ::-webkit-scrollbar { width: 6px; } 
    ::-webkit-scrollbar-track { background: #100d00; }
    ::-webkit-scrollbar-thumb { background: #3a2d00; border-radius: 3px; }
    .nav-item:hover { background: rgba(212,175,55,0.08) !important; color: #d4af37 !important; }
    .row-hover:hover { background: rgba(212,175,55,0.04) !important; }
    .btn-hover:hover { opacity: 0.85; transform: translateY(-1px); }
    .tab-btn:hover { color: #d4af37 !important; }
    .client-card:hover { border-color: rgba(212,175,55,0.35) !important; transform: translateY(-2px); }
    @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes shimmer { 0%,100% { opacity:0.7; } 50% { opacity:1; } }
    @keyframes spin { to { transform:rotate(360deg); } }
    .fade-up { animation: fadeUp 0.5s ease forwards; }
    .gold-shimmer { animation: shimmer 2s ease-in-out infinite; }
  `;

  // ════════════════════════════════════════════
  // LOGIN
  // ════════════════════════════════════════════
  if (screen === "login") return (
    <div style={{ fontFamily: "'Rajdhani', sans-serif", minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <style>{css}</style>
      {/* BG decorations */}
      <div style={{ position: "absolute", top: -200, right: -200, width: 600, height: 600, background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -200, left: -200, width: 500, height: 500, background: "radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div className="fade-up" style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo card */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <PDLogo size={72} />
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 700, letterSpacing: 3, ...goldText }}>
            PHYSICAL DEFINITION
          </div>
          <div style={{ fontSize: 13, color: G.textMuted, letterSpacing: 4, textTransform: "uppercase", marginTop: 6 }}>
            {TRAINER.tagline}
          </div>
          <div style={{ width: 60, height: 2, background: G.goldGrad, margin: "16px auto 0", borderRadius: 2 }} />
        </div>

        {/* Card */}
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 20, padding: "36px 32px", boxShadow: "0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.05)" }}>
          <div style={{ fontSize: 11, color: G.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 24, textAlign: "center" }}>Sign in to your account</div>

          {loginErr && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 16px", color: "#f87171", fontSize: 13, marginBottom: 20, textAlign: "center" }}>
              {loginErr}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: G.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Username / Email</div>
            <input
              style={{ width: "100%", background: G.surface2, border: `1px solid ${G.border}`, borderRadius: 10, padding: "13px 16px", color: G.text, fontSize: 15, fontFamily: "'Rajdhani', sans-serif", outline: "none" }}
              placeholder="Enter your credentials"
              value={loginForm.u} onChange={e => setLoginForm(p => ({ ...p, u: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && login()}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: G.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Password</div>
            <input
              type="password"
              style={{ width: "100%", background: G.surface2, border: `1px solid ${G.border}`, borderRadius: 10, padding: "13px 16px", color: G.text, fontSize: 15, fontFamily: "'Rajdhani', sans-serif", outline: "none" }}
              placeholder="••••••••"
              value={loginForm.p} onChange={e => setLoginForm(p => ({ ...p, p: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && login()}
            />
          </div>

          <button className="btn-hover" onClick={login} style={{ width: "100%", background: G.goldGrad, border: "none", borderRadius: 12, padding: "15px", color: "#080600", fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Rajdhani', sans-serif", boxShadow: "0 8px 30px rgba(212,175,55,0.3)", transition: "all 0.2s" }}>
            Enter →
          </button>

          <div style={{ marginTop: 28, padding: "16px", background: "rgba(212,175,55,0.04)", borderRadius: 10, border: `1px solid ${G.border}` }}>
            <div style={{ fontSize: 10, color: G.textDim, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>Demo Access</div>
            <div style={{ fontSize: 12, color: G.textMuted, lineHeight: 2 }}>
              <span style={{ color: G.gold }}>Trainer:</span> admin / pd@rafi2024<br />
              <span style={{ color: G.gold }}>Client:</span> arjun@email.com / client123
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: G.textDim }}>
          {TRAINER.name} · {TRAINER.designation}
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════
  // CLIENT PORTAL
  // ════════════════════════════════════════════
  if (screen === "client") {
    const client = clients.find(c => c.id === currentUser.id) || currentUser;
    const bmi = (client.weight / ((client.height / 100) ** 2)).toFixed(1);
    const bmiLabel = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy" : bmi < 30 ? "Overweight" : "Obese";
    const bmiColor = bmi < 18.5 ? G.warn : bmi < 25 ? G.success : bmi < 30 ? G.warn : G.danger;

    return (
      <div style={{ fontFamily: "'Rajdhani', sans-serif", minHeight: "100vh", background: G.bg, color: G.text }}>
        <style>{css}</style>

        {/* Header */}
        <div style={{ background: G.surface, borderBottom: `1px solid ${G.border}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <PDLogo size={36} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, ...goldText }}>PHYSICAL DEFINITION</div>
              <div style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1 }}>{TRAINER.tagline.toUpperCase()}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{client.name}</div>
              <div style={{ fontSize: 11, color: G.textMuted }}>{client.goal}</div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: G.goldGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#080600" }}>{client.photo}</div>
            <button className="btn-hover" onClick={logout} style={{ padding: "7px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 1, transition: "all 0.2s" }}>LOGOUT</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: G.surface, borderBottom: `1px solid ${G.border}`, padding: "0 24px", display: "flex", gap: 0 }}>
          {[{ id: "profile", label: "MY PROFILE", icon: "◈" }, { id: "workout", label: "WORKOUT", icon: "⚡" }, { id: "nutrition", label: "NUTRITION", icon: "◉" }, { id: "progress", label: "PROGRESS", icon: "▲" }].map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setClientTab(t.id)} style={{ padding: "16px 24px", background: "none", border: "none", borderBottom: clientTab === t.id ? `2px solid ${G.gold}` : "2px solid transparent", color: clientTab === t.id ? G.gold : G.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: 2, cursor: "pointer", transition: "all 0.2s", fontFamily: "'Rajdhani', sans-serif" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 28, maxWidth: 960, margin: "0 auto" }}>

          {/* PROFILE TAB */}
          {clientTab === "profile" && (
            <div className="fade-up">
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, ...goldText }}>Welcome back, {client.name.split(" ")[0]}</div>
                <div style={{ fontSize: 13, color: G.textMuted, marginTop: 4 }}>Member since {client.joinDate}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
                {[
                  { icon: "◈", label: "Age", value: `${client.age} yrs` },
                  { icon: "⚖", label: "Weight", value: `${client.weight} kg` },
                  { icon: "▲", label: "Height", value: `${client.height} cm` },
                  { icon: "◎", label: "Goal", value: client.goal },
                  { icon: "☎", label: "Phone", value: client.phone || "—" },
                  { icon: "◉", label: "Status", value: client.status },
                ].map((item, i) => (
                  <div key={i} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 14, padding: "20px", display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ width: 42, height: 42, background: "rgba(212,175,55,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: G.gold, fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: G.text }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* BMI */}
              <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 11, color: G.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Body Mass Index</div>
                  <div style={{ fontSize: 56, fontWeight: 800, color: bmiColor, lineHeight: 1 }}>{bmi}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: bmiColor, marginTop: 6 }}>{bmiLabel}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {[["< 18.5", "Underweight", G.warn], ["18.5–24.9", "Healthy", G.success], ["25–29.9", "Overweight", G.warn], ["≥ 30", "Obese", G.danger]].map(([range, label, color]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, justifyContent: "flex-end" }}>
                      <div style={{ fontSize: 12, color: G.textMuted }}>{range}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color, width: 80, textAlign: "right" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trainer contact */}
              <div style={{ background: G.surface, border: `1px solid ${G.borderBright}`, borderRadius: 16, padding: 24, marginTop: 16 }}>
                <div style={{ fontSize: 11, color: G.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Your Trainer</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: G.goldGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#080600", fontWeight: 800 }}>MR</div>
                    <div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, ...goldText }}>{TRAINER.name}</div>
                      <div style={{ fontSize: 12, color: G.textMuted }}>{TRAINER.designation}</div>
                    </div>
                  </div>
                  <a href={`https://wa.me/${TRAINER.whatsapp}`} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, color: G.success, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
                    ✆ WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* WORKOUT TAB */}
          {clientTab === "workout" && (
            <div className="fade-up">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, ...goldText }}>Your Workout Plan</div>
                <button className="btn-hover" onClick={() => genAI(client, "workout")} style={{ padding: "11px 22px", background: G.goldGrad, border: "none", borderRadius: 10, color: "#080600", fontWeight: 800, cursor: "pointer", fontSize: 13, letterSpacing: 1, fontFamily: "'Rajdhani', sans-serif", transition: "all 0.2s" }}>
                  ✦ GENERATE AI PLAN
                </button>
              </div>
              <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 28, minHeight: 300 }}>
                {client.workoutPlan
                  ? <pre style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.9, color: G.text, fontFamily: "'Rajdhani', sans-serif" }}>{client.workoutPlan}</pre>
                  : <div style={{ textAlign: "center", padding: "80px 20px", color: G.textDim }}>
                    <div style={{ fontSize: 48, marginBottom: 16, ...goldText }}>⚡</div>
                    <div style={{ fontSize: 16, marginBottom: 8, color: G.textMuted }}>No workout plan yet</div>
                    <div style={{ fontSize: 13 }}>Click "Generate AI Plan" for your personalised workout</div>
                  </div>}
              </div>
            </div>
          )}

          {/* NUTRITION TAB */}
          {clientTab === "nutrition" && (
            <div className="fade-up">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, ...goldText }}>Your Nutrition Plan</div>
                <button className="btn-hover" onClick={() => genAI(client, "nutrition")} style={{ padding: "11px 22px", background: "linear-gradient(135deg,#059669,#34d399)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 13, letterSpacing: 1, fontFamily: "'Rajdhani', sans-serif", transition: "all 0.2s" }}>
                  ✦ GENERATE AI PLAN
                </button>
              </div>
              <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 28, minHeight: 300 }}>
                {client.nutritionPlan
                  ? <pre style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.9, color: G.text, fontFamily: "'Rajdhani', sans-serif" }}>{client.nutritionPlan}</pre>
                  : <div style={{ textAlign: "center", padding: "80px 20px", color: G.textDim }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>◉</div>
                    <div style={{ fontSize: 16, marginBottom: 8, color: G.textMuted }}>No nutrition plan yet</div>
                    <div style={{ fontSize: 13 }}>Click "Generate AI Plan" for your personalised diet</div>
                  </div>}
              </div>
            </div>
          )}

          {/* PROGRESS TAB */}
          {clientTab === "progress" && (
            <div className="fade-up">
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, ...goldText, marginBottom: 24 }}>Weight Progress</div>
              <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
                {client.progress.map((p, i) => {
                  const diff = i > 0 ? (p.weight - client.progress[i - 1].weight).toFixed(1) : null;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px", background: i % 2 === 0 ? "rgba(212,175,55,0.03)" : "transparent", borderRadius: 10, marginBottom: 4 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: G.goldGrad, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: G.textMuted }}>{p.date}</div>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{p.weight} <span style={{ fontSize: 13, color: G.textMuted }}>kg</span></div>
                      </div>
                      {diff !== null && (
                        <div style={{ fontSize: 14, fontWeight: 800, color: parseFloat(diff) < 0 ? G.success : G.danger }}>
                          {parseFloat(diff) > 0 ? "+" : ""}{diff} kg
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* AI Modal */}
        {aiModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}
            onClick={() => !aiLoading && setAiModal(false)}>
            <div style={{ background: G.surface, border: `1px solid ${G.borderBright}`, borderRadius: 20, padding: 32, width: "100%", maxWidth: 640, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 40px 80px rgba(0,0,0,0.8)" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 20, fontWeight: 700, ...goldText, fontFamily: "'Cormorant Garamond', serif" }}>{aiTitle}</div>
                {!aiLoading && <button onClick={() => setAiModal(false)} style={{ background: "none", border: "none", color: G.textMuted, fontSize: 22, cursor: "pointer" }}>✕</button>}
              </div>
              {aiLoading ? <Spinner /> : (
                <div>
                  <div style={{ background: "rgba(212,175,55,0.08)", border: `1px solid ${G.border}`, borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 12, color: G.gold }}>
                    ✦ Plan saved to your profile
                  </div>
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.9, color: G.text, fontFamily: "'Rajdhani', sans-serif" }}>{aiText}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════
  // ADMIN PORTAL
  // ════════════════════════════════════════════
  const goals = clients.reduce((a, c) => { a[c.goal] = (a[c.goal] || 0) + 1; return a; }, {});

  return (
    <div style={{ fontFamily: "'Rajdhani', sans-serif", minHeight: "100vh", background: G.bg, color: G.text, display: "flex" }}>
      <style>{css}</style>

      {/* SIDEBAR */}
      <div style={{ width: 260, background: G.surface, borderRight: `1px solid ${G.border}`, display: "flex", flexDirection: "column", position: "fixed", height: "100vh", overflowY: "auto", zIndex: 50 }}>
        {/* Logo */}
        <div style={{ padding: "28px 24px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <PDLogo size={40} />
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700, letterSpacing: 1, ...goldText }}>PHYSICAL</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700, letterSpacing: 1, ...goldText, marginTop: -4 }}>DEFINITION</div>
            </div>
          </div>
          <div style={{ background: "rgba(212,175,55,0.08)", borderRadius: 10, padding: "10px 14px", border: `1px solid ${G.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: G.gold }}>{TRAINER.name}</div>
            <div style={{ fontSize: 11, color: G.textMuted, marginTop: 2 }}>{TRAINER.designation}</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: "16px 12px" }}>
          {[
            { id: "dashboard", icon: "◈", label: "Dashboard" },
            { id: "clients", icon: "◎", label: "Clients" },
            { id: "ai-tools", icon: "✦", label: "AI Tools" },
            { id: "plans", icon: "▤", label: "Plans" },
          ].map(item => (
            <div key={item.id} className="nav-item" onClick={() => setAdminTab(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer", borderRadius: 10, marginBottom: 2, background: adminTab === item.id ? "rgba(212,175,55,0.12)" : "transparent", borderLeft: adminTab === item.id ? `3px solid ${G.gold}` : "3px solid transparent", color: adminTab === item.id ? G.gold : G.textMuted, fontSize: 14, fontWeight: adminTab === item.id ? 700 : 500, letterSpacing: 0.5, transition: "all 0.2s" }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span> {item.label}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ padding: "20px 16px", borderTop: `1px solid ${G.border}` }}>
          <div style={{ fontSize: 12, color: G.textDim, marginBottom: 4 }}>Trainer Admin</div>
          <div style={{ fontSize: 10, color: G.textDim, marginBottom: 14, letterSpacing: 1 }}>FULL ACCESS</div>
          <button className="btn-hover" onClick={logout} style={{ width: "100%", padding: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 1, fontFamily: "'Rajdhani', sans-serif", transition: "all 0.2s" }}>LOGOUT</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft: 260, flex: 1, padding: 32, minHeight: "100vh" }}>

        {/* ── DASHBOARD ── */}
        {adminTab === "dashboard" && (
          <div className="fade-up">
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 700, ...goldText }}>Welcome, {TRAINER.name.split(" ")[0]}</div>
              <div style={{ fontSize: 13, color: G.textMuted, marginTop: 4, letterSpacing: 0.5 }}>Here's your training business overview</div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 28 }}>
              {[
                { label: "Total Clients", value: clients.length, icon: "◎", color: G.gold },
                { label: "Active", value: activeCount, icon: "✦", color: G.success },
                { label: "Inactive", value: clients.length - activeCount, icon: "◈", color: G.warn },
                { label: "AI Plans Generated", value: plansCount, icon: "▲", color: "#60a5fa" },
              ].map((s, i) => (
                <div key={i} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: "24px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 20, right: 20, fontSize: 28, color: s.color, opacity: 0.3 }}>{s.icon}</div>
                  <div style={{ fontSize: 40, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: G.textMuted, marginTop: 8, letterSpacing: 0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Goals */}
              <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 12, color: G.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Goals Distribution</div>
                {Object.entries(goals).map(([goal, count]) => (
                  <div key={goal} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                      <span style={{ fontSize: 13 }}>{goal}</span>
                      <span style={{ fontSize: 13, color: G.gold, fontWeight: 700 }}>{count}</span>
                    </div>
                    <div style={{ height: 4, background: G.surface2, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(count / clients.length) * 100}%`, background: G.goldGrad, borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent clients */}
              <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 12, color: G.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Recent Clients</div>
                {[...clients].reverse().slice(0, 4).map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: G.goldGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#080600", flexShrink: 0 }}>{c.photo}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: G.textMuted }}>{c.goal} · {c.joinDate}</div>
                    </div>
                    <div style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.status === "Active" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: c.status === "Active" ? G.success : G.danger, border: `1px solid ${c.status === "Active" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` }}>{c.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CLIENTS ── */}
        {adminTab === "clients" && (
          <div className="fade-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 700, ...goldText }}>Clients</div>
                <div style={{ fontSize: 13, color: G.textMuted, marginTop: 4 }}>{clients.length} enrolled · {activeCount} active</div>
              </div>
              <button className="btn-hover" onClick={() => setShowAddModal(true)} style={{ padding: "12px 24px", background: G.goldGrad, border: "none", borderRadius: 12, color: "#080600", fontSize: 13, fontWeight: 800, cursor: "pointer", letterSpacing: 1, fontFamily: "'Rajdhani', sans-serif", transition: "all 0.2s" }}>
                + ADD CLIENT
              </button>
            </div>

            <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(212,175,55,0.05)" }}>
                    {["Client", "Contact", "Stats", "Goal", "Status", "Plans", "Actions"].map(h => (
                      <th key={h} style={{ padding: "14px 18px", textAlign: "left", fontSize: 10, fontWeight: 700, color: G.textMuted, textTransform: "uppercase", letterSpacing: 1.5, borderBottom: `1px solid ${G.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id} className="row-hover" style={{ transition: "background 0.15s" }}>
                      <td style={{ padding: "18px", borderBottom: `1px solid rgba(212,175,55,0.06)` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: G.goldGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#080600", flexShrink: 0 }}>{c.photo}</div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: G.textMuted }}>#{c.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "18px", borderBottom: `1px solid rgba(212,175,55,0.06)`, fontSize: 13, color: G.textMuted }}>
                        <div>{c.email}</div>
                        <div style={{ fontSize: 11, marginTop: 2 }}>{c.phone}</div>
                      </td>
                      <td style={{ padding: "18px", borderBottom: `1px solid rgba(212,175,55,0.06)`, fontSize: 13, color: G.textMuted }}>
                        <div>{c.weight}kg · {c.height}cm</div>
                        <div style={{ fontSize: 11, marginTop: 2 }}>Age {c.age}</div>
                      </td>
                      <td style={{ padding: "18px", borderBottom: `1px solid rgba(212,175,55,0.06)`, fontSize: 13 }}>{c.goal}</td>
                      <td style={{ padding: "18px", borderBottom: `1px solid rgba(212,175,55,0.06)` }}>
                        <div style={{ display: "inline-flex", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.status === "Active" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: c.status === "Active" ? G.success : G.danger, border: `1px solid ${c.status === "Active" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` }}>{c.status}</div>
                      </td>
                      <td style={{ padding: "18px", borderBottom: `1px solid rgba(212,175,55,0.06)`, fontSize: 12 }}>
                        <span style={{ color: c.workoutPlan ? G.success : G.textDim }}>⚡{c.workoutPlan ? "✓" : "—"}</span>
                        {"  "}
                        <span style={{ color: c.nutritionPlan ? G.success : G.textDim }}>◉{c.nutritionPlan ? "✓" : "—"}</span>
                      </td>
                      <td style={{ padding: "18px", borderBottom: `1px solid rgba(212,175,55,0.06)` }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {[
                            { label: "View", color: G.gold, action: () => { setSelectedClient(c); setAdminTab("plans"); } },
                            { label: "💪 AI", color: "#60a5fa", action: () => genAI(c, "workout") },
                            { label: "🥗 AI", color: "#34d399", action: () => genAI(c, "nutrition") },
                            { label: c.status === "Active" ? "Pause" : "Activate", color: c.status === "Active" ? G.warn : G.success, action: () => toggleStatus(c.id) },
                          ].map(btn => (
                            <button key={btn.label} className="btn-hover" onClick={btn.action}
                              style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${btn.color}30`, fontSize: 11, fontWeight: 700, cursor: "pointer", background: `${btn.color}12`, color: btn.color, fontFamily: "'Rajdhani', sans-serif", transition: "all 0.2s" }}>
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── AI TOOLS ── */}
        {adminTab === "ai-tools" && (
          <div className="fade-up">
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 700, ...goldText }}>AI Tools</div>
              <div style={{ fontSize: 13, color: G.textMuted, marginTop: 4 }}>Generate personalised plans using AI for each client</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
              {clients.map(c => (
                <div key={c.id} className="client-card" style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24, transition: "all 0.2s", cursor: "default" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                    <div style={{ width: 50, height: 50, borderRadius: 14, background: G.goldGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#080600" }}>{c.photo}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: G.textMuted }}>{c.goal} · {c.weight}kg · Age {c.age}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {[
                      { icon: "⚡", label: "Workout", has: c.workoutPlan },
                      { icon: "◉", label: "Nutrition", has: c.nutritionPlan },
                    ].map(p => (
                      <div key={p.label} style={{ background: G.surface2, borderRadius: 10, padding: 14, textAlign: "center", border: `1px solid ${p.has ? "rgba(34,197,94,0.2)" : G.border}` }}>
                        <div style={{ fontSize: 22, marginBottom: 4, color: p.has ? G.success : G.textMuted }}>{p.icon}</div>
                        <div style={{ fontSize: 11, color: G.textMuted, marginBottom: 4 }}>{p.label} Plan</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: p.has ? G.success : G.warn }}>{p.has ? "✓ Ready" : "Pending"}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <button className="btn-hover" onClick={() => genAI(c, "workout")} style={{ padding: "10px", background: "rgba(212,175,55,0.1)", border: `1px solid ${G.border}`, borderRadius: 10, color: G.gold, fontWeight: 700, cursor: "pointer", fontSize: 12, letterSpacing: 0.5, fontFamily: "'Rajdhani', sans-serif", transition: "all 0.2s" }}>
                      ✦ GEN WORKOUT
                    </button>
                    <button className="btn-hover" onClick={() => genAI(c, "nutrition")} style={{ padding: "10px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 10, color: "#34d399", fontWeight: 700, cursor: "pointer", fontSize: 12, letterSpacing: 0.5, fontFamily: "'Rajdhani', sans-serif", transition: "all 0.2s" }}>
                      ◉ GEN NUTRITION
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PLANS ── */}
        {adminTab === "plans" && (
          <div className="fade-up">
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 700, ...goldText }}>Plans Overview</div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              {clients.map(c => (
                <button key={c.id} onClick={() => setSelectedClient(c)} className="btn-hover"
                  style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${selectedClient?.id === c.id ? G.gold : G.border}`, background: selectedClient?.id === c.id ? "rgba(212,175,55,0.12)" : G.surface, color: selectedClient?.id === c.id ? G.gold : G.textMuted, cursor: "pointer", fontWeight: 700, fontSize: 13, letterSpacing: 0.5, fontFamily: "'Rajdhani', sans-serif", transition: "all 0.2s" }}>
                  {c.name}
                </button>
              ))}
            </div>
            {selectedClient ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {[{ key: "workoutPlan", label: "⚡ Workout Plan", type: "workout" }, { key: "nutritionPlan", label: "◉ Nutrition Plan", type: "nutrition" }].map(p => (
                  <div key={p.key} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: G.gold }}>{p.label}</div>
                      <button className="btn-hover" onClick={() => genAI(selectedClient, p.type)} style={{ padding: "6px 14px", background: "rgba(212,175,55,0.1)", border: `1px solid ${G.border}`, borderRadius: 8, color: G.gold, fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5, fontFamily: "'Rajdhani', sans-serif", transition: "all 0.2s" }}>
                        ✦ REGENERATE
                      </button>
                    </div>
                    {selectedClient[p.key]
                      ? <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.9, color: G.text, fontFamily: "'Rajdhani', sans-serif" }}>{selectedClient[p.key]}</pre>
                      : <div style={{ textAlign: "center", padding: "50px 0", color: G.textDim }}>No plan yet — click Regenerate</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16, padding: "80px 20px", textAlign: "center", color: G.textDim }}>
                <div style={{ fontSize: 40, marginBottom: 12, ...goldText }}>◈</div>
                <div>Select a client above to view plans</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD CLIENT MODAL */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}
          onClick={() => setShowAddModal(false)}>
          <div style={{ background: G.surface, border: `1px solid ${G.borderBright}`, borderRadius: 20, padding: 36, width: "100%", maxWidth: 520, boxShadow: "0 40px 80px rgba(0,0,0,0.8)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, ...goldText, marginBottom: 28 }}>Add New Client</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { k: "name", label: "Full Name", ph: "John Doe" },
                { k: "email", label: "Email", ph: "john@email.com" },
                { k: "password", label: "Password", ph: "••••••" },
                { k: "phone", label: "Phone", ph: "+974 00000000" },
                { k: "age", label: "Age", ph: "25" },
                { k: "weight", label: "Weight (kg)", ph: "70" },
                { k: "height", label: "Height (cm)", ph: "175" },
              ].map(f => (
                <div key={f.k}>
                  <div style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>{f.label}</div>
                  <input type={f.k === "password" ? "password" : "text"}
                    style={{ width: "100%", background: G.surface2, border: `1px solid ${G.border}`, borderRadius: 9, padding: "11px 14px", color: G.text, fontSize: 14, fontFamily: "'Rajdhani', sans-serif", outline: "none" }}
                    placeholder={f.ph} value={newC[f.k]} onChange={e => setNewC(p => ({ ...p, [f.k]: e.target.value }))} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 10, color: G.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>Goal</div>
                <select style={{ width: "100%", background: G.surface2, border: `1px solid ${G.border}`, borderRadius: 9, padding: "11px 14px", color: G.text, fontSize: 14, fontFamily: "'Rajdhani', sans-serif", outline: "none" }}
                  value={newC.goal} onChange={e => setNewC(p => ({ ...p, goal: e.target.value }))}>
                  {GOALS.map(g => <option key={g} style={{ background: G.surface2 }}>{g}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              <button className="btn-hover" onClick={addClient} style={{ flex: 1, padding: "14px", background: G.goldGrad, border: "none", borderRadius: 12, color: "#080600", fontWeight: 800, cursor: "pointer", fontSize: 15, letterSpacing: 1, fontFamily: "'Rajdhani', sans-serif", transition: "all 0.2s" }}>
                ADD CLIENT
              </button>
              <button className="btn-hover" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "14px", background: G.surface2, border: `1px solid ${G.border}`, borderRadius: 12, color: G.textMuted, fontWeight: 700, cursor: "pointer", fontSize: 15, fontFamily: "'Rajdhani', sans-serif", transition: "all 0.2s" }}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI MODAL */}
      {aiModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}
          onClick={() => !aiLoading && setAiModal(false)}>
          <div style={{ background: G.surface, border: `1px solid ${G.borderBright}`, borderRadius: 20, padding: 36, width: "100%", maxWidth: 660, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 40px 80px rgba(0,0,0,0.9)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, ...goldText }}>{aiTitle}</div>
              {!aiLoading && <button onClick={() => setAiModal(false)} style={{ background: "none", border: "none", color: G.textMuted, fontSize: 22, cursor: "pointer" }}>✕</button>}
            </div>
            {aiLoading ? <Spinner /> : (
              <div>
                <div style={{ background: "rgba(212,175,55,0.08)", border: `1px solid ${G.border}`, borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 12, color: G.gold, letterSpacing: 0.5 }}>
                  ✦ Plan saved to client profile automatically
                </div>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.9, color: G.text, fontFamily: "'Rajdhani', sans-serif" }}>{aiText}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
