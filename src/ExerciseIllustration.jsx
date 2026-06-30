export function ExerciseIllustration({ exerciseId, size=120 }) {
  const BASE = "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos";
  const getImg = (id) => {
    const l = (id || "").toLowerCase();
    if(l.includes("incline dumbbell")||l.includes("incline press")) return `${BASE}/Incline_Dumbbell_Press.jpeg`;
    if(l.includes("bench press")||l.includes("chest press")) return `${BASE}/Bench_Press.jpeg`;
    if(l.includes("overhead press")||l.includes("military press")||l.includes("ohp")||l.includes("shoulder press")||l.includes("arnold")) return `${BASE}/Overhead_Press.jpeg`;
    if(l.includes("barbell squat")||l.includes("goblet squat")||l.includes("hack squat")||l.includes("wall sit")||l.includes("squat")) return `${BASE}/Barbell_Squat.jpeg`;
    if(l.includes("romanian deadlift")||l.includes("rdl")||l.includes("sumo deadlift")||l.includes("stiff leg")||l.includes("deadlift")) return `${BASE}/Deadlift.jpeg`;
    if(l.includes("pull-up")||l.includes("pullup")||l.includes("chin-up")||l.includes("lat pulldown")||l.includes("pull up")) return `${BASE}/Pull_Up.jpeg`;
    if(l.includes("barbell row")||l.includes("t-bar row")||l.includes("cable row")||l.includes("seated row")||l.includes("bent over row")) return `${BASE}/Barbell_Row.jpeg`;
    if(l.includes("hammer curl")) return `${BASE}/Hammer_Curl.jpeg`;
    if(l.includes("barbell curl")||l.includes("bicep curl")||l.includes("preacher curl")||l.includes("concentration curl")||l.includes("ez bar")) return `${BASE}/Bicep_Curl.jpeg`;
    if(l.includes("lateral raise")||l.includes("front raise")||l.includes("side delt")) return `${BASE}/Lateral_Raise.jpeg`;
    if(l.includes("face pull")) return `${BASE}/Face_Pull.jpeg`;
    if(l.includes("overhead tricep")||l.includes("overhead extension")) return `${BASE}/Overhead_Tricep_Extension.jpeg`;
    if(l.includes("tricep pushdown")||l.includes("rope pushdown")||l.includes("cable pushdown")||l.includes("skull crusher")||l.includes("tricep dip")) return `${BASE}/Tricep_Pushdown.jpeg`;
    if(l.includes("leg press")) return `${BASE}/Leg_Press.jpeg`;
    if(l.includes("leg extension")) return `${BASE}/Leg_Extension.jpeg`;
    if(l.includes("leg curl")) return `${BASE}/Leg_Curl.jpeg`;
    if(l.includes("calf raise")||l.includes("calf")) return `${BASE}/Calf_Raise.jpeg`;
    if(l.includes("lunge")||l.includes("step-up")||l.includes("split squat")) return `${BASE}/Lunge.jpeg`;
    return null;
  };
  const img = getImg(exerciseId);
  if(!img) return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: size * 2.2, height: 100, background: "#222", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <div style={{ fontSize: 28 }}>🏋️</div>
        <div style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>No photo yet</div>
      </div>
    </div>
  );
  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <img
        src={img}
        alt={exerciseId}
        style={{ width: "100%", maxWidth: size * 2.2, height: "auto", borderRadius: 8, display: "block", background: "#fff" }}
        onError={e => { e.target.style.display = "none"; }}
      />
    </div>
  );
}
