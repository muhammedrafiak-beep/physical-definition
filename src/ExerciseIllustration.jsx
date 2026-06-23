import { useState, useEffect } from "react";

export function ExerciseIllustration({ exerciseId, size=120 }) {
  const getImgs = (id) => {
    const l = (id || "").toLowerCase();
    if(l.includes("bench press")) return ["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=260&h=260&fit=crop"];
    if(l.includes("overhead press")||l.includes("military press")||l.includes("ohp")) return ["https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=260&h=260&fit=crop"];
    if(l.includes("incline")) return ["https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=260&h=260&fit=crop"];
    if(l.includes("lateral raise")) return ["https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=260&h=260&fit=crop"];
    if(l.includes("tricep pushdown")||l.includes("pushdown")) return ["https://images.unsplash.com/photo-1530822847156-5df684ec5933?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=260&h=260&fit=crop"];
    if(l.includes("overhead tricep")||l.includes("skull")) return ["https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1530822847156-5df684ec5933?w=260&h=260&fit=crop"];
    if(l.includes("deadlift")||l.includes("rdl")||l.includes("romanian")) return ["https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=260&h=260&fit=crop"];
    if(l.includes("pull-up")||l.includes("pullup")||l.includes("chin")) return ["https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1616803689943-5601631c7fec?w=260&h=260&fit=crop"];
    if(l.includes("lat pulldown")) return ["https://images.unsplash.com/photo-1597347343908-2937e7dcc560?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=260&h=260&fit=crop"];
    if(l.includes("barbell row")||l.includes("t-bar row")) return ["https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1530822847156-5df684ec5933?w=260&h=260&fit=crop"];
    if(l.includes("face pull")) return ["https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=260&h=260&fit=crop"];
    if(l.includes("barbell curl")||l.includes("hammer curl")) return ["https://images.unsplash.com/photo-1581009137042-c552e485697a?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1590487988256-9ed24133863e?w=260&h=260&fit=crop"];
    if(l.includes("squat")||l.includes("goblet")||l.includes("hack")) return ["https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=260&h=260&fit=crop"];
    if(l.includes("leg press")) return ["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=260&h=260&fit=crop"];
    if(l.includes("leg curl")) return ["https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=260&h=260&fit=crop"];
    if(l.includes("leg extension")) return ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=260&h=260&fit=crop"];
    if(l.includes("calf")) return ["https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=260&h=260&fit=crop"];
    if(l.includes("lunge")||l.includes("walking lunge")) return ["https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=260&h=260&fit=crop"];
    if(l.includes("plank")||l.includes("bird dog")||l.includes("dead bug")||l.includes("ab wheel")) return ["https://images.unsplash.com/photo-1566241832378-917a0f30db2c?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1593164842264-854604db2260?w=260&h=260&fit=crop"];
    if(l.includes("arnold press")) return ["https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=260&h=260&fit=crop"];
    if(l.includes("cable row")||l.includes("seated row")) return ["https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1530822847156-5df684ec5933?w=260&h=260&fit=crop"];
    if(l.includes("dip")) return ["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=260&h=260&fit=crop"];
    if(l.includes("push-up")||l.includes("pushup")) return ["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1598971639058-a4575f207f48?w=260&h=260&fit=crop"];
    if(l.includes("hip thrust")||l.includes("glute bridge")) return ["https://images.unsplash.com/photo-1576678927484-cc907957088c?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=260&h=260&fit=crop"];
    if(l.includes("step-up")||l.includes("step up")) return ["https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=260&h=260&fit=crop"];
    if(l.includes("row")) return ["https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1530822847156-5df684ec5933?w=260&h=260&fit=crop"];
    if(l.includes("press")) return ["https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=260&h=260&fit=crop"];
    if(l.includes("curl")) return ["https://images.unsplash.com/photo-1581009137042-c552e485697a?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1590487988256-9ed24133863e?w=260&h=260&fit=crop"];
    return ["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=260&h=260&fit=crop","https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=260&h=260&fit=crop"];
  };
  const [img1, img2] = getImgs(exerciseId);
  const half = Math.floor(size * 0.88);
  return (
    <div style={{ display: "flex", flexDirection: "row", gap: 4, justifyContent: "center", width: "100%" }}>
      <div style={{ position: "relative", flex: "0 0 auto", width: half, height: half, borderRadius: 7, overflow: "hidden", background: "#333" }}>
        <img src={img1} alt="start" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <span style={{ position: "absolute", bottom: 3, left: 3, background: "rgba(0,0,0,0.82)", color: "#fff", fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 3 }}>START</span>
      </div>
      <div style={{ position: "relative", flex: "0 0 auto", width: half, height: half, borderRadius: 7, overflow: "hidden", background: "#333" }}>
        <img src={img2} alt="finish" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <span style={{ position: "absolute", bottom: 3, left: 3, background: "rgba(212,175,55,0.92)", color: "#000", fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 3 }}>FINISH</span>
      </div>
    </div>
  );
}
