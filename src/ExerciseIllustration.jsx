export function ExerciseIllustration({ exerciseId, size=120 }) {
  const BASE = "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos";
  const getImg = (id) => {
    const l = (id || "").toLowerCase();
    if(l.includes("bench press")||l.includes("incline")||l.includes("chest press")) return `${BASE}/Barbel_Bench_Press.png`;
    if(l.includes("overhead press")||l.includes("military press")||l.includes("ohp")||l.includes("shoulder press")||l.includes("arnold")) return `${BASE}/Barbel_Shoulder_Overhead_Press.png`;
    if(l.includes("squat")||l.includes("goblet")||l.includes("hack")||l.includes("leg press")||l.includes("wall sit")) return `${BASE}/Barbel_Squat.png`;
    if(l.includes("deadlift")||l.includes("rdl")||l.includes("romanian")||l.includes("sumo")||l.includes("stiff")) return `${BASE}/Dead_Lift.png`;
    if(l.includes("pull-up")||l.includes("pullup")||l.includes("chin")||l.includes("lat pulldown")||l.includes("pull up")) return `${BASE}/Pull_Upp.png`;
    if(l.includes("row")||l.includes("t-bar")||l.includes("cable row")||l.includes("seated row")) return `${BASE}/Barbel_Row.jpeg`;
    if(l.includes("curl")||l.includes("bicep")||l.includes("preacher")||l.includes("concentration")||l.includes("hammer")) return `${BASE}/Barbel_Biceps_Curl.png`;
    if(l.includes("lateral raise")||l.includes("front raise")||l.includes("side delt")) return `${BASE}/Side_Lateral_Raise.jpeg`;
    if(l.includes("tricep")||l.includes("pushdown")||l.includes("skull")||l.includes("extension")||l.includes("dip")) return `${BASE}/Rope_Pulli_Push_Down.png`;
    if(l.includes("lunge")||l.includes("step-up")||l.includes("step up")||l.includes("split squat")) return `${BASE}/Lunges.png`;
    return null;
  };
  const img = getImg(exerciseId);
  if(!img) return null;
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
