// Exercise illustrations using wger.de free images
export function ExerciseIllustration({ exerciseId, size=120 }) {
  const WGER = "https://wger.de/media/exercise-images";
  const getImgs = (id) => {
    const l = (id || "").toLowerCase();
    if(l.includes("squat")||l.includes("goblet")||l.includes("wall sit")) return ["74/Barbell-squat-1.png","74/Barbell-squat-2.png"];
    if(l.includes("deadlift")||l.includes("rdl")||l.includes("sumo")) return ["39/Deadlift-1.png","39/Deadlift-2.png"];
    if(l.includes("bench")||l.includes("chest")) return ["192/Bench-press-1.png","192/Bench-press-2.png"];
    if(l.includes("push-up")||l.includes("pushup")||l.includes("incline")||l.includes("dip")) return ["192/Bench-press-1.png","192/Bench-press-2.png"];
    if(l.includes("pull-up")||l.includes("pullup")||l.includes("chin")||l.includes("lat")) return ["55/Pull-up-1.png","55/Pull-up-2.png"];
    if(l.includes("press")&&(l.includes("over")||l.includes("shoulder")||l.includes("military")||l.includes("arnold"))) return ["61/Overhead-press-1.png","61/Overhead-press-2.png"];
    if(l.includes("row")||l.includes("t-bar")) return ["28/Bent-over-barbell-row-1.png","28/Bent-over-barbell-row-2.png"];
    if(l.includes("lunge")||l.includes("step-up")) return ["29/Lunge-1.png","29/Lunge-2.png"];
    if(l.includes("plank")||l.includes("bird dog")||l.includes("dead bug")||l.includes("ab wheel")) return ["105/Plank-1.png","105/Plank-2.png"];
    if(l.includes("curl")||l.includes("bicep")) return ["81/Biceps-curl-1.png","81/Biceps-curl-2.png"];
    if(l.includes("tricep")||l.includes("pushdown")||l.includes("skull")||l.includes("extension")) return ["83/Bench-dips-1.png","83/Bench-dips-2.png"];
    if(l.includes("lateral raise")||l.includes("front raise")) return ["69/Lateral-raise-1.png","69/Lateral-raise-2.png"];
    if(l.includes("calf")) return ["91/Crunches-1.png","91/Crunches-2.png"];
    return ["192/Bench-press-1.png","192/Bench-press-2.png"];
  };
  const [img1, img2] = getImgs(exerciseId);
  const half = Math.floor(size * 0.88);
  return (
    <div style={{ display: "flex", flexDirection: "row", gap: 4, justifyContent: "center", width: "100%" }}>
      <div style={{ position: "relative", flex: "0 0 auto", width: half, height: half, borderRadius: 7, overflow: "hidden", background: "#f0f0f0" }}>
        <img src={`${WGER}/${img1}`} alt="start" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "contain" }} />
        <span style={{ position: "absolute", bottom: 3, left: 3, background: "rgba(0,0,0,0.82)", color: "#fff", fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 3 }}>START</span>
      </div>
      <div style={{ position: "relative", flex: "0 0 auto", width: half, height: half, borderRadius: 7, overflow: "hidden", background: "#f0f0f0" }}>
        <img src={`${WGER}/${img2}`} alt="finish" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "contain" }} />
        <span style={{ position: "absolute", bottom: 3, left: 3, background: "rgba(212,175,55,0.92)", color: "#000", fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 3 }}>FINISH</span>
      </div>
    </div>
  );
}
