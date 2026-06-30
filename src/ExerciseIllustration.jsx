export function ExerciseIllustration({ exerciseId, size=120 }) {
  const BASE = "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos";
  const getImg = (id) => {
    const l = (id || "").toLowerCase();
    if(l.includes("bench press")||l.includes("chest press")) return `${BASE}/Barbel_Bench_Press.png`;
    if(l.includes("overhead press")||l.includes("military press")||l.includes("ohp")||l.includes("shoulder press")||l.includes("arnold")) return `${BASE}/Barbel_Shoulder_Overhead_Press.png`;
    if(l.includes("barbell squat")||l.includes("goblet squat")||l.includes("hack squat")||l.includes("wall sit")) return `${BASE}/Barbel_Squat.png`;
    if(l.includes("romanian deadlift")||l.includes("rdl")||l.includes("sumo deadlift")||l.includes("stiff leg")) return `${BASE}/Dead_Lift.png`;
    if(l.includes("deadlift")&&!l.includes("romanian")&&!l.includes("sumo")) return `${BASE}/Dead_Lift.png`;
    if(l.includes("pull-up")||l.includes("pullup")||l.includes("chin-up")||l.includes("lat pulldown")||l.includes("pull up")) return `${BASE}/Pull_Upp.png`;
    if(l.includes("barbell row")||l.includes("t-bar row")||l.includes("cable row")||l.includes("seated row")||l.includes("bent over row")) return `${BASE}/Barbel_Row.jpeg`;
    if(l.includes("barbell curl")||l.includes("bicep curl")||l.includes("preacher curl")||l.includes("concentration curl")||l.includes("ez bar")) return `${BASE}/Barbel_Biceps_Curl.png`;
    if(l.includes("lateral raise")||l.includes("front raise")||l.includes("side delt")) return `${BASE}/Side_Lateral_Raise.jpeg`;
    if(l.includes("tricep pushdown")||l.includes("rope pushdown")||l.includes("cable pushdown")||l.includes("skull crusher")||l.includes("tricep dip")) return `${BASE}/Rope_Pulli_Push_Down.png`;
    if(l.includes("lunge")||l.includes("step-up")||l.includes("split squat")) return `${BASE}/Lunges.png`;
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
