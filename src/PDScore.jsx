import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const G = { gold:"#d4af37", bg:"#0d0d0d", surf:"#181818", surf2:"#1a1a1a", green:"#22c55e", red:"#ef4444", muted:"#666", text:"#fff", border:"#2a2a2a" };

const STATIONS = [
  { id:"jumpSquat", name:"Jump Squats", emoji:"⚡", reps:20, muscles:"Quads · Glutes · Calves", sys:"ATP-PC · explosive" },
  { id:"pullup",    name:"Pull-ups",    emoji:"🏋️", reps:20, muscles:"Lats · Biceps · Rear delts", sys:"Glycolytic · upper pull" },
  { id:"pushup",    name:"Push-ups",    emoji:"💪", reps:20, muscles:"Chest · Triceps · Front delts", sys:"Glycolytic · upper push" },
  { id:"burpee",    name:"Burpees",     emoji:"🔥", reps:20, muscles:"Full body", sys:"All energy systems" },
  { id:"plank",     name:"Plank Hold",  emoji:"🧘", reps:60, isTime:true, muscles:"Deep core · Shoulders", sys:"Oxidative · isometric" },
];

function calcAngle(a,b,c){
  const r=Math.atan2(c.y-b.y,c.x-b.x)-Math.atan2(a.y-b.y,a.x-b.x);
  let d=Math.abs(r*180/Math.PI);
  return d>180?360-d:d;
}
function pt(L,i){return{x:L[i].x,y:L[i].y};}
function fmt(s){const m=Math.floor(s/60);const x=s%60;return `${m}:${String(x).padStart(2,"0")}`;}
function tier(sec){
  if(sec<420) return {n:"Elite", c:G.red};
  if(sec<660) return {n:"Advanced", c:"#f59e0b"};
  if(sec<960) return {n:"Intermediate", c:G.gold};
  return {n:"Beginner", c:G.muted};
}

export function PDScore({ client, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const camRef = useRef(null);
  const stageRef = useRef("up");
  const repsRef = useRef(0);
  const stationRef = useRef(0);
  const burpeeRef = useRef({ plank:false, low:false, jump:false });
  const groundRef = useRef(null);
  const lastRepRef = useRef(0);
  const topHipRef = useRef(null);
  const timerRef = useRef(null);
  const plankRef = useRef(null);

  const [screen, setScreen] = useState("intro");
  const [station, setStation] = useState(0);
  const [reps, setReps] = useState(0);
  const [plankSec, setPlankSec] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [tip, setTip] = useState("");
  const [good, setGood] = useState(true);
  const [times, setTimes] = useState([]);
  const [board, setBoard] = useState([]);
  const [best, setBest] = useState(null);
  const [saving, setSaving] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [showHow, setShowHow] = useState(false);

  useEffect(() => { loadBoard(); return () => stopCam(); }, []);

  async function loadBoard(){
    const { data } = await supabase.from("pd_scores").select("*").order("pd_score",{ascending:false}).limit(50);
    if (data) {
      setBoard(data);
      const mine = data.filter(r => String(r.client_id) === String(client?.id));
      if (mine.length) setBest(mine[0]);
    }
  }

  function analyze(L){
    const key=[11,12,23,24,25,26,27,28];
    const vs=key.map(i=>L[i]?.visibility??0);
    const avg=vs.reduce((s,v)=>s+v,0)/vs.length, lo=Math.min.apply(null,vs);
    const vis=(avg>=0.6 && lo>=0.2) ? 1 : 0;
    if(vis<0.6){ setGood(false); setTip("Move back — full body must be visible"); return; }

    const st = STATIONS[stationRef.current];
    if(!st) return;
    let g=true, t="";

    if(st.id==="jumpSquat"){
      const a=calcAngle(pt(L,23),pt(L,25),pt(L,27));
      const ank=(L[27].y+L[28].y)/2;
      if(groundRef.current===null || ank>groundRef.current) groundRef.current=ank;
      const air=groundRef.current!==null && ank < groundRef.current-0.035;
      const hipY=(L[23].y+L[24].y)/2, shY=(L[11].y+L[12].y)/2;
      const torso=Math.max(0.05, hipY-shY);
      const ankY=(L[27].y+L[28].y)/2;
      const legR=(ankY-hipY)/torso;
      const isDown = a<115 || legR<1.35;
      const isUp   = air;
      if(isDown && stageRef.current==="up") stageRef.current="down";
      if(stageRef.current==="down" && isUp){ stageRef.current="up"; bump(); }
      t = air ? "In air — land soft" : a<110 ? "Deep — explode up!" : "Squat down";
    }
    else if(st.id==="pullup"){
      const a=calcAngle(pt(L,11),pt(L,13),pt(L,15));
      if(a>150 && stageRef.current==="up") stageRef.current="down";
      if(L[15].y < L[11].y && L[0].y < L[15].y && stageRef.current==="down"){ stageRef.current="up"; bump(); }
      t = a>150 ? "Pull from dead hang" : "Chin over bar!";
    }
    else if(st.id==="pushup"){
      const a=calcAngle(pt(L,11),pt(L,13),pt(L,15));
      const hip=calcAngle(pt(L,11),pt(L,23),pt(L,27));
      if(a<90 && stageRef.current==="up") stageRef.current="down";
      if(a>155 && stageRef.current==="down"){ stageRef.current="up"; bump(); }
      t = a<90 ? "Good depth" : "Lower chest";
      if(Math.abs(hip-180)>35){ g=false; t="Hips sagging — brace core"; }
    }
    else if(st.id==="burpee"){
      const hip=L[23].y, sh=L[11].y, ank=L[27].y;
      const b=burpeeRef.current;
      const flat = Math.abs(hip-sh) < 0.12 && hip > 0.55;
      const low = L[11].y > 0.6;
      const jump = ank < hip - 0.05 && L[0].y < 0.25;
      if(flat) b.plank=true;
      if(b.plank && low) b.low=true;
      if(b.plank && b.low && jump){ burpeeRef.current={plank:false,low:false,jump:false}; bump(); }
      t = !b.plank ? "Drop to plank" : !b.low ? "Push-up" : "Jump up!";
    }
    else if(st.id==="plank"){
      const a=calcAngle(pt(L,11),pt(L,23),pt(L,27));
      if(Math.abs(a-180)<25) t="Hold steady";
      else { g=false; t = L[23].y<L[11].y-0.05 ? "Hips too high" : "Hips sagging"; }
    }

    setGood(g); setTip(t);
  }

  function bump(){
    const now = performance.now();
    if(now - lastRepRef.current < 400) return;
    lastRepRef.current = now;
    repsRef.current += 1;
    setReps(repsRef.current);
    const st = STATIONS[stationRef.current];
    if(repsRef.current >= st.reps) nextStation();
  }

  function nextStation(){
    const now = elapsedRef.current;
    setTimes(p => [...p, { name: STATIONS[stationRef.current].name, at: now }]);
    if(stationRef.current >= STATIONS.length-1){ finish(); return; }
    stationRef.current += 1;
    repsRef.current = 0;
    stageRef.current = "up";
    burpeeRef.current = {plank:false,low:false,jump:false};
    groundRef.current = null;
    topHipRef.current = null;
    setStation(stationRef.current);
    setReps(0);
    setPlankSec(0);
    if(STATIONS[stationRef.current].isTime) startPlank();
  }

  const elapsedRef = useRef(0);
  function startPlank(){
    if(plankRef.current) clearInterval(plankRef.current);
    let s=0;
    plankRef.current = setInterval(() => {
      s+=1; setPlankSec(s);
      if(s >= 60){ clearInterval(plankRef.current); nextStation(); }
    }, 1000);
  }

  async function finish(){
    stopCam();
    if(timerRef.current) clearInterval(timerRef.current);
    if(plankRef.current) clearInterval(plankRef.current);
    const total = elapsedRef.current;
    const score = Math.max(0, Math.round(1000 - total/0.6));
    setFinalScore({ total, score, tier: tier(total) });
    setScreen("done");
    setSaving(true);
    await supabase.from("pd_scores").insert([{
      client_id: String(client?.id || ""),
      client_name: client?.name || "Unknown",
      total_seconds: total,
      pd_score: score,
      scaled: false,
      station_times: times,
    }]);
    setSaving(false);
    loadBoard();
  }

  async function start(){
    setScreen("loading");
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"user" } });
      stationRef.current=0; repsRef.current=0; elapsedRef.current=0;
      setStation(0); setReps(0); setElapsed(0); setTimes([]);
      setScreen("live");
      await new Promise(r => setTimeout(r, 120));
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      if(!poseRef.current){
        poseRef.current = new window.Pose({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${f}` });
        poseRef.current.setOptions({ modelComplexity:1, smoothLandmarks:true, minDetectionConfidence:0.6, minTrackingConfidence:0.6 });
        poseRef.current.onResults(res => {
          const cv = canvasRef.current; if(!cv) return;
          const ctx = cv.getContext("2d");
          cv.width = res.image.width; cv.height = res.image.height;
          ctx.save(); ctx.scale(-1,1); ctx.translate(-cv.width,0);
          ctx.drawImage(res.image,0,0,cv.width,cv.height);
          if(res.poseLandmarks){
            if(window.drawConnectors) window.drawConnectors(ctx,res.poseLandmarks,window.POSE_CONNECTIONS,{color:"rgba(34,197,94,0.75)",lineWidth:3});
            if(window.drawLandmarks) window.drawLandmarks(ctx,res.poseLandmarks,{color:G.gold,fillColor:"rgba(212,175,55,0.3)",lineWidth:2,radius:4});
            analyze(res.poseLandmarks.map(p=>({...p,x:1-p.x})));
          }
          ctx.restore();
        });
      }
      camRef.current = new window.Camera(videoRef.current, {
        onFrame: async () => { await poseRef.current.send({ image: videoRef.current }); },
        width:640, height:480
      });
      await camRef.current.start();
      timerRef.current = setInterval(() => { elapsedRef.current+=1; setElapsed(elapsedRef.current); }, 1000);
    }catch(e){
      setScreen("intro");
      alert("Camera access denied. Allow camera in browser settings.");
    }
  }

  function stopCam(){
    if(camRef.current) camRef.current.stop();
    if(videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t=>t.stop());
    if(timerRef.current) clearInterval(timerRef.current);
    if(plankRef.current) clearInterval(plankRef.current);
  }

  const card = { background:G.surf, border:`1px solid ${G.border}`, borderRadius:14, padding:16, marginBottom:10 };

  const hiddenVideo = <video ref={videoRef} style={{ position:"fixed",width:1,height:1,opacity:0,pointerEvents:"none" }} playsInline muted />;

  if(screen==="intro") return (
    <div style={{ position:"fixed",inset:0,background:G.bg,zIndex:99999,overflowY:"auto" }}>
      {hiddenVideo}
      <div style={{ padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${G.border}`,position:"sticky",top:0,background:G.bg,zIndex:2 }}>
        <div>
          <div style={{ fontSize:17,fontWeight:700,color:G.gold,lineHeight:1.2 }}>🏆 PD-100</div>
          <div style={{ fontSize:10,color:G.muted,letterSpacing:1.5,textTransform:"uppercase",marginTop:1 }}>Physical Definition Benchmark</div>
        </div>
        <button onClick={onClose} style={{ background:"transparent",border:`1px solid ${G.border}`,borderRadius:8,color:"#999",padding:"6px 12px",cursor:"pointer",fontSize:13 }}>✕</button>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ background:"rgba(212,175,55,0.07)",border:`1px solid rgba(212,175,55,0.25)`,borderRadius:14,padding:15,marginBottom:14 }}>
          <div style={{ fontSize:16,fontWeight:700,color:G.gold,marginBottom:5 }}>The Physical Definition 100</div>
          <div style={{ fontSize:13,color:"#bbb",lineHeight:1.7 }}>
            Our own fitness benchmark — the one test every Physical Definition client is measured by. 100 reps across 5 movements, pure bodyweight, no equipment except a pull-up bar, done straight through for time.
          </div>
          <div style={{ display:"flex",gap:7,flexWrap:"wrap",marginTop:11 }}>
            {["100 reps","5 movements","Bodyweight only","AI counted","For time"].map(x => (
              <span key={x} style={{ fontSize:11,padding:"4px 10px",borderRadius:20,background:"rgba(255,255,255,0.05)",border:`1px solid ${G.border}`,color:"#aaa" }}>{x}</span>
            ))}
          </div>
        </div>

        {best && (
          <div style={{ ...card, borderColor:G.gold }}>
            <div style={{ fontSize:11,color:G.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>Your best</div>
            <div style={{ display:"flex",alignItems:"baseline",gap:10 }}>
              <div style={{ fontSize:34,fontWeight:800,color:G.gold }}>{best.pd_score}</div>
              <div style={{ fontSize:14,color:"#aaa" }}>{fmt(best.total_seconds)}</div>
              <div style={{ marginLeft:"auto",fontSize:12,color:tier(best.total_seconds).c,fontWeight:700 }}>{tier(best.total_seconds).n}</div>
            </div>
          </div>
        )}

        {STATIONS.map((s,i) => (
          <div key={s.id} style={{ ...card, display:"flex",gap:12,alignItems:"center",padding:13 }}>
            <div style={{ width:30,height:30,borderRadius:"50%",background:"rgba(212,175,55,0.12)",border:`1px solid ${G.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:G.gold,fontWeight:700,flexShrink:0 }}>{i+1}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15,fontWeight:600,color:"#fff" }}>{s.emoji} {s.name}</div>
              <div style={{ fontSize:11,color:G.muted,marginTop:2 }}>{s.muscles} · {s.sys}</div>
            </div>
            <div style={{ fontSize:14,fontWeight:700,color:G.gold,flexShrink:0 }}>{s.isTime ? "60s" : s.reps}</div>
          </div>
        ))}

        <div style={{ ...card, padding:0, overflow:"hidden", marginTop:14 }}>
          <div onClick={() => setShowHow(!showHow)} style={{ padding:"13px 15px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer" }}>
            <span style={{ fontSize:14,fontWeight:600,color:G.gold }}>📖 How the PD-100 works</span>
            <span style={{ color:G.muted,fontSize:16 }}>{showHow ? "−" : "+"}</span>
          </div>
          {showHow && (
            <div style={{ padding:"0 15px 15px",borderTop:`1px solid ${G.border}` }}>
              <div style={{ fontSize:11,color:G.muted,letterSpacing:1,textTransform:"uppercase",margin:"13px 0 6px" }}>What it is</div>
              <div style={{ fontSize:13,color:"#bbb",lineHeight:1.65 }}>
                A single continuous bodyweight benchmark. Five stations, 100 total reps, done back to back for time. It tests every major movement pattern — squat, pull, push, full body and core — and every energy system, from explosive power through to endurance. Your time becomes a PD Score that ranks you against every other client.
              </div>

              <div style={{ fontSize:11,color:G.muted,letterSpacing:1,textTransform:"uppercase",margin:"15px 0 6px" }}>Before you start</div>
              <div style={{ fontSize:13,color:"#bbb",lineHeight:1.85 }}>
                1. Lean your phone against something at chest height.<br/>
                2. Stand back 2 to 3 metres so your whole body — head to feet — is in frame.<br/>
                3. Make sure the room is well lit and there is space behind you.<br/>
                4. A pull-up bar is needed for station 2.<br/>
                5. Warm up properly first. This is a maximum effort test.
              </div>

              <div style={{ fontSize:11,color:G.muted,letterSpacing:1,textTransform:"uppercase",margin:"15px 0 6px" }}>During the test</div>
              <div style={{ fontSize:13,color:"#bbb",lineHeight:1.85 }}>
                The clock starts the moment the camera opens and never stops — rest counts against you. The AI counts each rep only when you hit full range of motion, so half reps will not register. When a station hits its target it moves you on automatically. Watch the form badge: if it turns red, fix your position before continuing.
              </div>

              <div style={{ fontSize:11,color:G.muted,letterSpacing:1,textTransform:"uppercase",margin:"15px 0 6px" }}>Your score</div>
              <div style={{ fontSize:13,color:"#bbb",lineHeight:1.65,marginBottom:10 }}>
                PD Score = 1000 minus your total time in seconds divided by 0.6. Faster finish, higher score. Retest monthly to see real progress.
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6 }}>
                {[["Elite","<7m",G.red],["Advanced","7-11m","#f59e0b"],["Intermediate","11-16m",G.gold],["Beginner","16m+",G.muted]].map(x => (
                  <div key={x[0]} style={{ background:"rgba(255,255,255,0.04)",border:`1px solid ${G.border}`,borderRadius:8,padding:"8px 5px",textAlign:"center" }}>
                    <div style={{ fontSize:11,fontWeight:700,color:x[2] }}>{x[0]}</div>
                    <div style={{ fontSize:11,color:"#888",marginTop:2 }}>{x[1]}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize:11,color:G.muted,letterSpacing:1,textTransform:"uppercase",margin:"15px 0 6px" }}>Privacy</div>
              <div style={{ fontSize:13,color:"#bbb",lineHeight:1.65 }}>
                Nothing is recorded. The camera runs entirely on your own device and only body position points are read. No video leaves your phone.
              </div>
            </div>
          )}
        </div>

        <button onClick={start} style={{ width:"100%",padding:16,background:G.gold,border:"none",borderRadius:12,fontWeight:800,fontSize:16,cursor:"pointer",marginTop:6,marginBottom:16 }}>
          ▶ Start PD-100
        </button>

        <div style={{ fontSize:11,color:G.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:8 }}>Global leaderboard</div>
        {board.length===0 && <div style={{ fontSize:13,color:G.muted,padding:"12px 0" }}>No scores yet — be the first.</div>}
        {board.map((r,i) => (
          <div key={r.id} style={{ display:"flex",alignItems:"center",gap:11,padding:"11px 13px",background:String(r.client_id)===String(client?.id)?"rgba(212,175,55,0.07)":G.surf,border:`1px solid ${String(r.client_id)===String(client?.id)?"rgba(212,175,55,0.3)":G.border}`,borderRadius:11,marginBottom:6 }}>
            <div style={{ fontSize:14,fontWeight:800,color:i<3?G.gold:G.muted,width:26,flexShrink:0 }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</div>
            <div style={{ flex:1,fontSize:14,color:"#fff",fontWeight:500 }}>{r.client_name}</div>
            <div style={{ fontSize:12,color:"#888" }}>{fmt(r.total_seconds)}</div>
            <div style={{ fontSize:15,fontWeight:800,color:G.gold,minWidth:44,textAlign:"right" }}>{r.pd_score}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if(screen==="loading") return (
    <div style={{ position:"fixed",inset:0,background:G.bg,zIndex:99999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14 }}>
      <div style={{ width:44,height:44,border:`3px solid ${G.border}`,borderTopColor:G.gold,borderRadius:"50%",animation:"pdspin .8s linear infinite" }}/>
      <div style={{ color:G.gold,fontSize:14,fontWeight:600 }}>Loading AI...</div>
      {hiddenVideo}
      <style>{`@keyframes pdspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if(screen==="done" && finalScore) return (
    <div style={{ position:"fixed",inset:0,background:G.bg,zIndex:99999,overflowY:"auto",padding:20 }}>
      {hiddenVideo}
      <div style={{ textAlign:"center",paddingTop:30,marginBottom:22 }}>
        <div style={{ fontSize:48,marginBottom:10 }}>🏆</div>
        <div style={{ fontSize:13,color:G.muted,letterSpacing:2,textTransform:"uppercase" }}>PD Score</div>
        <div style={{ fontSize:64,fontWeight:800,color:G.gold,lineHeight:1.1 }}>{finalScore.score}</div>
        <div style={{ fontSize:17,color:"#fff",marginTop:6 }}>{fmt(finalScore.total)}</div>
        <div style={{ display:"inline-block",marginTop:10,padding:"5px 16px",borderRadius:20,background:"rgba(255,255,255,0.06)",color:finalScore.tier.c,fontWeight:700,fontSize:13 }}>{finalScore.tier.n}</div>
        {saving && <div style={{ fontSize:12,color:G.muted,marginTop:10 }}>Saving...</div>}
      </div>
      {times.map((t,i) => (
        <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"10px 14px",background:G.surf,border:`1px solid ${G.border}`,borderRadius:10,marginBottom:6 }}>
          <span style={{ fontSize:14,color:"#ccc" }}>{t.name}</span>
          <span style={{ fontSize:14,color:G.gold,fontFamily:"monospace" }}>{fmt(t.at)}</span>
        </div>
      ))}
      <button onClick={() => { setScreen("intro"); loadBoard(); }} style={{ width:"100%",padding:15,background:G.gold,border:"none",borderRadius:12,fontWeight:800,fontSize:15,cursor:"pointer",marginTop:16 }}>
        View leaderboard
      </button>
    </div>
  );

  const st = STATIONS[station];
  return (
    <div style={{ position:"fixed",inset:0,background:G.bg,zIndex:99999,display:"flex",flexDirection:"column",userSelect:"none" }}>
      <div style={{ padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${G.border}`,flexShrink:0 }}>
        <div style={{ fontSize:14,fontWeight:700,color:G.gold }}>🏆 Station {station+1}/5</div>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <span style={{ color:G.gold,fontSize:15,fontWeight:800,fontFamily:"monospace" }}>{fmt(elapsed)}</span>
          <button onClick={() => { stopCam(); setScreen("intro"); }} style={{ background:"transparent",border:`1px solid ${G.border}`,borderRadius:8,color:"#999",padding:"5px 11px",cursor:"pointer",fontSize:12 }}>Quit</button>
        </div>
      </div>

      <div style={{ height:4,background:G.border,flexShrink:0 }}>
        <div style={{ height:4,width:`${(station/5)*100 + (reps/st.reps)*20}%`,background:G.gold,transition:"width .3s" }}/>
      </div>

      <div style={{ position:"relative",flex:1,background:"#111",overflow:"hidden" }}>
        {hiddenVideo}
        <canvas ref={canvasRef} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
        <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:16,pointerEvents:"none" }}>
          <div style={{ background:"rgba(0,0,0,0.62)",backdropFilter:"blur(8px)",borderRadius:16,padding:"12px 20px",width:"fit-content",border:`1px solid ${G.border}` }}>
            <div style={{ fontSize:11,color:G.muted,letterSpacing:1.5,textTransform:"uppercase" }}>{st.emoji} {st.name}</div>
            <div style={{ fontSize:52,fontWeight:800,color:G.gold,lineHeight:1.05 }}>
              {st.isTime ? plankSec : reps}<span style={{ fontSize:22,color:"#666" }}>/{st.reps}</span>
            </div>
          </div>
          <div>
            <div style={{ padding:"8px 16px",borderRadius:20,fontSize:13,fontWeight:700,width:"fit-content",background:good?"rgba(34,197,94,0.85)":"rgba(239,68,68,0.85)",color:good?"#000":"#fff",marginBottom:8 }}>
              {good ? "✅ Good Form" : "⚠️ Fix Form"}
            </div>
            <div style={{ background:"rgba(0,0,0,0.72)",padding:"10px 14px",borderRadius:12,fontSize:13,color:"#e5e5e5",border:`1px solid ${G.border}`,maxWidth:280 }}>{tip}</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:6 }}>© Physical Definition · {client?.name||""}</div>
          </div>
        </div>
      </div>

      <div style={{ padding:"12px 16px",borderTop:`1px solid ${G.border}`,flexShrink:0 }}>
        <button onClick={nextStation} style={{ width:"100%",padding:13,background:"transparent",border:`1px solid ${G.border}`,borderRadius:11,color:"#999",fontSize:14,cursor:"pointer" }}>
          Skip station →
        </button>
      </div>
    </div>
  );
}