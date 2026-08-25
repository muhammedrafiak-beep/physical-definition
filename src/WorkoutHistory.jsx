import { useState, useEffect } from "react";

// No Supabase client here any more. Both views used to read workout_logs
// straight from the browser with the anon key, which is public — so anyone
// could read every client's training history. They now go through an
// authenticated endpoint: the admin view through /api/admin-data with the
// admin token, the client view through /api/client-data, which scopes the
// query to whoever the session token says is signed in.
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
      <div style={{ fontSize: 16, fontWeight: 700, color: "#d4af37", marginBottom: 14 }}>
        📊 Workout History
      </div>

      {/* Client filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        <button
          onClick={() => setSelectedClient("all")}
          style={{ padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: selectedClient === "all" ? "#d4af37" : "#2a2a2a", color: selectedClient === "all" ? "#000" : "#ccc" }}
        >
          All Clients
        </button>
        {clients.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedClient(String(c.id))}
            style={{ padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: selectedClient === String(c.id) ? "#d4af37" : "#2a2a2a", color: selectedClient === String(c.id) ? "#000" : "#ccc" }}
          >
            {c.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        <StatCard label="Total Workouts" value={totalWorkouts} icon="🏋️" color="#d4af37" />
        <StatCard label="Total Time" value={`${Math.round(totalMinutes)}m`} icon="⏱" color="#3b82f6" />
        <StatCard label="Calories Burned" value={`${Math.round(totalCalories)}`} icon="🔥" color="#ef4444" />
      </div>

      {/* Client leaderboard (all clients view) */}
      {selectedClient === "all" && Object.keys(clientStats).length > 0 && (
        <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#d4af37", marginBottom: 10 }}>🏆 Client Leaderboard</div>
          {Object.values(clientStats)
            .sort((a, b) => b.count - a.count)
            .map((cs, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #222" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{cs.name}</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "#d4af37" }}>{cs.count} sessions</span>
                  <span style={{ fontSize: 11, color: "#ef4444" }}>{Math.round(cs.calories)} kcal</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Log list */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#666", padding: 24 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: "#666", padding: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
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
export function ClientWorkoutHistory({ clientId, accentColor = "#d4af37" }) {
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
      <div style={{ fontSize: 16, fontWeight: 700, color: accentColor, marginBottom: 14 }}>
        📊 My Workout History
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <StatCard label="Total Sessions" value={totalWorkouts} icon="🏋️" color={accentColor} />
        <StatCard label="Current Streak" value={`${streak}🔥`} icon="📅" color="#f59e0b" />
        <StatCard label="Total Time" value={`${Math.round(totalMinutes)}m`} icon="⏱" color="#3b82f6" />
        <StatCard label="Calories Burned" value={`${Math.round(totalCalories)}`} icon="🔥" color="#ef4444" />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#666", padding: 24 }}>Loading...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: "center", color: "#666", padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💪</div>
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

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: "#777", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function LogCard({ log, showClient, accentColor = "#d4af37" }) {
  const pct = log.total_exercises > 0
    ? Math.round((log.exercises_completed / log.total_exercises) * 100)
    : 100;

  return (
    <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "12px 14px", border: "1px solid #2a2a2a" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          {showClient && (
            <div style={{ fontSize: 11, color: accentColor, fontWeight: 700, marginBottom: 2 }}>{log.client_name}</div>
          )}
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{log.day_name || "Workout"}</div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{fmtDate(log.completed_at)} · {fmtTime(log.completed_at)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>🔥 {Math.round(log.estimated_calories || 0)} kcal</div>
          <div style={{ fontSize: 11, color: "#666" }}>⏱ {Math.round(log.duration_minutes || 0)} min</div>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 4, background: "#2a2a2a", borderRadius: 2 }}>
        <div style={{ height: 4, width: `${pct}%`, background: pct === 100 ? "#22c55e" : accentColor, borderRadius: 2 }} />
      </div>
      <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>
        {log.exercises_completed}/{log.total_exercises} exercises · {pct}% complete
      </div>
    </div>
  );
}
