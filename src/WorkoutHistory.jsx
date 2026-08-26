import { useState, useEffect } from "react";
import { Icon } from "./Icons";

// No Supabase client here any more. Both views used to read workout_logs
// straight from the browser with the anon key, which is public — so anyone
// could read every client's training history. They now go through an
// authenticated endpoint: the admin view through /api/admin-data with the
// admin token, the client view through /api/client-data, which scopes the
// query to whoever the session token says is signed in.
// The DAY palette, mirrored. This screen previously carried bare hex strings
// (#fff on a dark card, #666 for every label), which is how a restyle leaves
// one screen behind: nothing references a name, so nothing follows when the
// name changes.
const G = { text: "#0E2035", muted: "#5C6D84", dim: "#93A2B7", line: "#E4E9F0", accent: "#21509B", accentSoft: "#E8EEF8", green: "#12795A", paper: "#FCFCFD" };

const token = (key) => {
  try { return sessionStorage.getItem(key) || ""; } catch { return ""; }
};

async function post(url, key, payload) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token(key)}` },
    body: JSON.stringify(payload),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Could not load workout history");
  return d;
}

function fmtDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// ── ADMIN VIEW ─────────────────────────────────────────────────────────────────
export function AdminWorkoutHistory({ clients = [] }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const d = await post("/api/admin-data", "pd_admin_token", { action: "list_workout_logs" });
      setLogs(d.logs || []);
    } catch (e) {
      console.error("workout history (admin):", e.message);
    }
    setLoading(false);
  }

  const filtered = selectedClient === "all"
    ? logs
    : logs.filter(l => l.client_id === selectedClient);

  // Stats
  const totalWorkouts = filtered.length;
  const totalMinutes = filtered.reduce((a, l) => a + (l.duration_minutes || 0), 0);
  const totalCalories = filtered.reduce((a, l) => a + (l.estimated_calories || 0), 0);

  // Group by client for summary
  const clientStats = {};
  logs.forEach(l => {
    if (!clientStats[l.client_id]) {
      clientStats[l.client_id] = { name: l.client_name, count: 0, calories: 0, minutes: 0 };
    }
    clientStats[l.client_id].count++;
    clientStats[l.client_id].calories += l.estimated_calories || 0;
    clientStats[l.client_id].minutes += l.duration_minutes || 0;
  });

  return (
    <div style={{ padding: "16px 0" }}>
      <div className="sf" style={{ fontSize: 24, color: G.text, marginBottom: 16 }}>
        Workout history
      </div>

      {/* Client filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        <button
          onClick={() => setSelectedClient("all")}
          style={{ padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: selectedClient === "all" ? "#21509B" : "#E8EEF8", color: selectedClient === "all" ? "#000" : "#ccc" }}
        >
          All Clients
        </button>
        {clients.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedClient(String(c.id))}
            style={{ padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: selectedClient === String(c.id) ? "#21509B" : "#E8EEF8", color: selectedClient === String(c.id) ? "#000" : "#ccc" }}
          >
            {c.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        <StatCard label="Total Workouts" value={totalWorkouts} icon="train" color="#21509B" />
        <StatCard label="Total Time" value={`${Math.round(totalMinutes)}m`} icon="clock" color="#21509B" />
        <StatCard label="Calories Burned" value={`${Math.round(totalCalories)}`} icon="flame" color="#A63A3A" />
      </div>

      {/* Client leaderboard (all clients view) */}
      {selectedClient === "all" && Object.keys(clientStats).length > 0 && (
        <div style={{ background: "#F3F6FA", borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: G.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}><Icon n="score" s={15} c={G.accent} />Client leaderboard</div>
          {Object.values(clientStats)
            .sort((a, b) => b.count - a.count)
            .map((cs, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #222" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: i < 3 ? G.accent : G.dim, width: 20, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{cs.name}</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "#21509B" }}>{cs.count} sessions</span>
                  <span style={{ fontSize: 11, color: "#A63A3A" }}>{Math.round(cs.calories)} kcal</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Log list */}
      {loading ? (
        <div style={{ textAlign: "center", color: G.muted, padding: 24 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: G.muted, padding: 24 }}>
          <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}><Icon n="history" s={26} c={G.dim} /></div>
          <div style={{ fontSize: 13 }}>No workout logs yet</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((log, i) => (
            <LogCard key={i} log={log} showClient={selectedClient === "all"} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── CLIENT VIEW ────────────────────────────────────────────────────────────────
export function ClientWorkoutHistory({ clientId, accentColor = "#21509B" }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    fetchLogs();
  }, [clientId]);

  async function fetchLogs() {
    setLoading(true);
    try {
      // No clientId is sent. The server scopes this to the signed-in client,
      // so one client cannot ask for another's history by changing a number.
      const d = await post("/api/client-data", "pd_token", { action: "logs.list" });
      setLogs(d.logs || []);
    } catch (e) {
      console.error("workout history:", e.message);
    }
    setLoading(false);
  }

  const totalWorkouts = logs.length;
  const totalMinutes = logs.reduce((a, l) => a + (l.duration_minutes || 0), 0);
  const totalCalories = logs.reduce((a, l) => a + (l.estimated_calories || 0), 0);
  const streak = calcStreak(logs);

  return (
    <div style={{ padding: "16px 0" }}>
      <div className="sf" style={{ fontSize: 24, color: G.text, marginBottom: 16 }}>
        My workout history
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <StatCard label="Total Sessions" value={totalWorkouts} icon="train" color={accentColor} />
        <StatCard label="Current Streak" value={streak} icon="calendar" color="#9A6212" />
        <StatCard label="Total Time" value={`${Math.round(totalMinutes)}m`} icon="clock" color="#21509B" />
        <StatCard label="Calories Burned" value={`${Math.round(totalCalories)}`} icon="flame" color="#A63A3A" />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: G.muted, padding: 24 }}>Loading...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: "center", color: G.muted, padding: 24 }}>
          <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}><Icon n="train" s={28} c={G.dim} /></div>
          <div style={{ fontSize: 13 }}>No workouts yet — start your first session!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {logs.map((log, i) => (
            <LogCard key={i} log={log} showClient={false} accentColor={accentColor} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── HELPERS ────────────────────────────────────────────────────────────────────
function calcStreak(logs) {
  if (!logs.length) return 0;
  const dates = [...new Set(logs.map(l => new Date(l.completed_at).toDateString()))];
  let streak = 1;
  const today = new Date().toDateString();
  if (dates[0] !== today) return 0;
  for (let i = 1; i < dates.length; i++) {
    const d1 = new Date(dates[i - 1]);
    const d2 = new Date(dates[i]);
    const diff = (d1 - d2) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

// The figure is the point of this card, so the figure is what is set in the
// display face; the icon is a 15px hairline above it rather than an 18px
// emoji competing with it for the eye.
function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background: G.accentSoft, borderRadius: 12, padding: "13px 12px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><Icon n={icon} s={15} c={color} /></div>
      <div className="sf" style={{ fontSize: 24, lineHeight: 1, color: G.text }}>{value}</div>
      <div style={{ fontSize: 10, color: G.muted, marginTop: 5, letterSpacing: ".05em" }}>{label}</div>
    </div>
  );
}

function LogCard({ log, showClient, accentColor = "#21509B" }) {
  const pct = log.total_exercises > 0
    ? Math.round((log.exercises_completed / log.total_exercises) * 100)
    : 100;

  return (
    <div style={{ background: "#F3F6FA", borderRadius: 10, padding: "12px 14px", border: "1px solid #E8EEF8" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          {showClient && (
            <div style={{ fontSize: 11, color: accentColor, fontWeight: 700, marginBottom: 2 }}>{log.client_name}</div>
          )}
          <div style={{ fontSize: 13, fontWeight: 700, color: G.text }}>{log.day_name || "Workout"}</div>
          <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>{fmtDate(log.completed_at)} · {fmtTime(log.completed_at)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: G.text }}>{Math.round(log.estimated_calories || 0)} kcal</div>
          <div style={{ fontSize: 11, color: G.muted }}>{Math.round(log.duration_minutes || 0)} min</div>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 4, background: "#E8EEF8", borderRadius: 2 }}>
        <div style={{ height: 4, width: `${pct}%`, background: pct === 100 ? "#12795A" : accentColor, borderRadius: 2 }} />
      </div>
      <div style={{ fontSize: 10, color: G.muted, marginTop: 4 }}>
        {log.exercises_completed}/{log.total_exercises} exercises · {pct}% complete
      </div>
    </div>
  );
}
