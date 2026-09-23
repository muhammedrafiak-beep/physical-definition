import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";
import { G } from "./theme";
import { probeEnabled, probeShortRun, createProbe, saveLocal } from "./pose/probe";

// The leaderboard used to be read and written straight from here with the
// anon key — the last place in src/ that did. Two things were wrong with it:
// the key is public because it ships in this bundle, and the score arrived
// with whatever client_id and client_name the browser felt like sending. Both
// now come from the signed session token on the server; see api/pd-score.js.
const clientToken = () => {
  try { return sessionStorage.getItem("pd_token") || ""; } catch { return ""; }
};

async function api(action, payload = {}) {
  const r = await fetch("/api/pd-score", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${clientToken()}` },
    body: JSON.stringify({ action, ...payload }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "That didn't work. Try again.");
  return d;
}

// Kept local so this screen can be read on its own. Mirrors the DAY palette
// in App.jsx; `night` is the camera view, which is held over live video and
// therefore stays dark whatever the rest of the app does.
// Every client screen is a 600px column. PD-100 opens over the top of one,
// so it has to be the same column or the page appears to change size.
const PAGE = { width:"100%", maxWidth:600, margin:"0 auto" };

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
// PR-1 probe: ?pdprobe=1&short=1 shortens the circuit for timing runs.
// Without both flags these return exactly the original targets.
const SHORT = probeEnabled() && probeShortRun();
const repTarget = (st) => (SHORT ? (st.isTime ? 5 : 2) : st.reps);

function tier(sec){
  if(sec<420) return {n:"Elite", c:G.red};
  if(sec<660) return {n:"Advanced", c:"#9A6212"};
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
  // PR-1 probe refs. probeRef stays null unless ?pdprobe=1.
  const probeRef = useRef(null);
  const gateRef = useRef(null);
  const plankSecRef = useRef(0);
  const firstStreamRef = useRef(null);
  const fileRef = useRef(null);
  const replayRef = useRef(false);
  const PROBE = probeEnabled();
  const [probeTick, setProbeTick] = useState(0);
  const [probeLabel, setProbeLabel] = useState("");
  const [probeRec, setProbeRec] = useState(false);
  const [probeFile, setProbeFile] = useState(null);

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
  const [saveErr, setSaveErr] = useState("");
  const [finalScore, setFinalScore] = useState(null);
  const [showHow, setShowHow] = useState(false);

  useEffect(() => { loadBoard(); return () => stopCam(); }, []);

  async function loadBoard(){
    try {
      // The server marks the caller's own rows; ids of other people never
      // leave it. Rows come back best first, so the first one that is mine is
      // my best.
      const { board } = await api("board");
      const rows = board || [];
      setBoard(rows);
      setBest(rows.find(r => r.mine) || null);
    } catch (e) {
      // A leaderboard that will not load must not stop somebody training.
      console.error("pd-score board:", e.message);
    }
  }

  function analyze(L){
    const key=[11,12,23,24,25,26,27,28];
    const vs=key.map(i=>L[i]?.visibility??0);
    const avg=vs.reduce((s,v)=>s+v,0)/vs.length, lo=Math.min.apply(null,vs);
    const feetIn=(L[27].y<0.97 && L[28].y<0.97 && L[27].y>0.02 && L[28].y>0.02);
    const vis=(avg>=0.6 && lo>=0.2 && feetIn) ? 1 : 0;
    gateRef.current={ gate_ok:!!vis, vis_avg:avg, vis_min:lo, feet_in:feetIn };
    if(vis<0.6){ setGood(false); setTip("Move back — full body must be visible"); return; }

    const st = STATIONS[stationRef.current];
    if(!st) return;
    let g=true, t="";

    if(st.id==="jumpSquat"){
      const a=calcAngle(pt(L,23),pt(L,25),pt(L,27));
      const ank=(L[27].y+L[28].y)/2;
      if(groundRef.current===null) groundRef.current=ank;
      const air=groundRef.current!==null && ank < groundRef.current-0.035;
      const hipY=(L[23].y+L[24].y)/2, shY=(L[11].y+L[12].y)/2;
      const torso=Math.max(0.05, hipY-shY);
      const ankY=(L[27].y+L[28].y)/2;
      const legR=(ankY-hipY)/torso;
      const kneeY=(L[25].y+L[26].y)/2, shin=Math.max(0.03, ank-kneeY);
      const depthR=(ank-hipY)/shin;
      if(depthR>1.75) groundRef.current = groundRef.current*0.88 + ank*0.12;
      const isDown = depthR<1.40;
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
    probeRef.current?.event("rep", { station: stationRef.current, reps: repsRef.current, elapsed: elapsedRef.current });
    const st = STATIONS[stationRef.current];
    if(repsRef.current >= repTarget(st)) nextStation();
  }

  function nextStation(){
    const now = elapsedRef.current;
    setTimes(p => [...p, { name: STATIONS[stationRef.current].name, at: now }]);
    // Probe keeps its own copy of every split so the submitted stationTimes
    // can be compared with what actually happened (PR-3).
    probeRef.current?.event("split", { station: stationRef.current, name: STATIONS[stationRef.current].name, at: now, plank_sec: plankSecRef.current });
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
    let s=0; plankSecRef.current=0;
    plankRef.current = setInterval(() => {
      s+=1; setPlankSec(s); plankSecRef.current=s;
      probeRef.current?.event("plank_tick", { s, gate_ok: gateRef.current?.gate_ok ?? null, elapsed: elapsedRef.current });
      if(s >= (SHORT ? 5 : 60)){ clearInterval(plankRef.current); nextStation(); }
    }, 1000);
  }

  async function finish(){
    stopCam();
    if(timerRef.current) clearInterval(timerRef.current);
    if(plankRef.current) clearInterval(plankRef.current);
    const total = elapsedRef.current;
    // Same formula as api/pd-score.js — shown here so the result is on screen
    // instantly, stored there so it cannot be typed in. If one changes, change
    // both, or the number a person sees will not be the number on the board.
    const score = Math.min(1000, Math.round(360000 / Math.max(1, total)));
    setFinalScore({ total, score, tier: tier(total) });
    setScreen("done");
    setSaving(true);
    if(probeRef.current){
      // Probe runs never reach the leaderboard: log what WOULD be sent.
      probeRef.current.event("submit_dry_run", { payload: { totalSeconds: total, scaled: false, stationTimes: times } });
      setSaving(false); setProbeTick(t=>t+1);
      return;
    }
    try {
      // Only the time and the station splits are sent. The name on the board
      // and the score itself are worked out on the server from the session —
      // a leaderboard anyone can type into is not a leaderboard.
      await api("submit", { totalSeconds: total, scaled: false, stationTimes: times });
    } catch (e) {
      // The effort was real and the result is already on screen. Say the
      // saving failed rather than pretending it worked.
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
    loadBoard();
  }

  async function start(){
    setScreen("loading");
    if(PROBE){
      probeRef.current = createProbe();
      probeRef.current.setDeviceLabel(probeLabel);
      probeRef.current.setRecording(probeRec);
      if(probeFile) probeRef.current.meta.source = "file";
    }
    try{
      const useFile = PROBE && probeFile;
      const stream = useFile ? null : await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"user" } });
      if(PROBE) firstStreamRef.current = stream;
      stationRef.current=0; repsRef.current=0; elapsedRef.current=0;
      setStation(0); setReps(0); setElapsed(0); setTimes([]);
      setScreen("live");
      await new Promise(r => setTimeout(r, 120));
      if(useFile){
        if(fileRef.current) URL.revokeObjectURL(fileRef.current);
        fileRef.current = URL.createObjectURL(probeFile);
        videoRef.current.src = fileRef.current;
      } else {
        videoRef.current.srcObject = stream;
      }
      await videoRef.current.play();
      if(PROBE && videoRef.current.requestVideoFrameCallback){
        const v = videoRef.current;
        const reg = () => v.requestVideoFrameCallback((now, md) => { probeRef.current?.onVideoFrame(now, md); if(v.srcObject || v.src) reg(); });
        reg();
      }
      if(!poseRef.current){
        poseRef.current = new window.Pose({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${f}` });
        poseRef.current.setOptions({ modelComplexity:1, smoothLandmarks:true, minDetectionConfidence:0.6, minTrackingConfidence:0.6 });
        poseRef.current.onResults(res => {
          const pf = probeRef.current ? probeRef.current.onResult(res) : null;
          const cv = canvasRef.current; if(!cv) return;
          const ctx = cv.getContext("2d");
          cv.width = res.image.width; cv.height = res.image.height;
          ctx.save(); ctx.scale(-1,1); ctx.translate(-cv.width,0);
          ctx.drawImage(res.image,0,0,cv.width,cv.height);
          if(res.poseLandmarks){
            if(window.drawConnectors) window.drawConnectors(ctx,res.poseLandmarks,window.POSE_CONNECTIONS,{color:"#C9E3D8",lineWidth:3});
            if(window.drawLandmarks) window.drawLandmarks(ctx,res.poseLandmarks,{color:G.gold,fillColor:"#D3E0F2",lineWidth:2,radius:4});
            gateRef.current = null;
            analyze(res.poseLandmarks.map(p=>({...p,x:1-p.x})));
          }
          ctx.restore();
          if(pf){
            probeRef.current.afterDraw(pf);
            if(res.poseLandmarks) probeRef.current.state(pf, { ...(gateRef.current||{}), station: stationRef.current, stage: stageRef.current, reps: repsRef.current, plank_sec: plankSecRef.current, elapsed: elapsedRef.current });
          }
        });
      }
      if(useFile){
        // Replay: same Pose instance and onResults path; the camera is never opened.
        replayRef.current = true;
        const v = videoRef.current;
        const loop = async () => {
          if(!replayRef.current) return;
          if(v.ended){ replayRef.current=false; probeRef.current?.event("replay_end"); setProbeTick(t=>t+1); return; }
          probeRef.current?.beforeSend();
          await poseRef.current.send({ image: v });
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      } else {
        camRef.current = new window.Camera(videoRef.current, {
          onFrame: async () => { probeRef.current?.beforeSend(); await poseRef.current.send({ image: videoRef.current }); },
          width:640, height:480
        });
        await camRef.current.start();
        if(probeRef.current){
          const tr = videoRef.current.srcObject?.getVideoTracks?.()[0];
          probeRef.current.meta.video_settings = tr?.getSettings ? tr.getSettings() : null;
          probeRef.current.meta.stream_replaced_by_camera_utils = videoRef.current.srcObject !== stream;
        }
      }
      timerRef.current = setInterval(() => { elapsedRef.current+=1; setElapsed(elapsedRef.current); }, 1000);
    }catch(e){
      setScreen("intro");
      alert("Camera access denied. Allow camera in browser settings.");
    }
  }

  function stopCam(){
    if(replayRef.current && videoRef.current) videoRef.current.pause();
    replayRef.current = false;
    if(camRef.current) camRef.current.stop();
    if(videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t=>t.stop());
    if(timerRef.current) clearInterval(timerRef.current);
    if(plankRef.current) clearInterval(plankRef.current);
    const P = probeRef.current;   // this run's probe; a restart installs a new one
    if(P){
      // Is the stream PDScore opened itself still live after closing? (PR-1 check)
      const first = firstStreamRef.current?.getVideoTracks?.() || [];
      P.event("stop", { first_stream_tracks: first.map(t => t.readyState) });
      setTimeout(() => { P.event("stop_plus_1s", { first_stream_tracks: first.map(t => t.readyState) }); setProbeTick(t=>t+1); }, 1000);
    }
  }

  const card = { background:G.surf, border:`1px solid ${G.border}`, borderRadius:14, padding:16, marginBottom:10 };

  const probePanel = PROBE ? (
    <ProbePanel probe={probeRef.current} tick={probeTick} setTick={setProbeTick}
      label={probeLabel} setLabel={setProbeLabel} rec={probeRec} setRec={setProbeRec}
      file={probeFile} setFile={setProbeFile} />
  ) : null;

  const hiddenVideo = <video ref={videoRef} style={{ position:"fixed",width:1,height:1,opacity:0,pointerEvents:"none" }} playsInline muted />;

  if(screen==="intro") return (
    <div style={{ position:"fixed",inset:0,background:G.bg,zIndex:99999,overflowY:"auto" }}>
      {hiddenVideo}
      {probePanel}
      <div style={{ borderBottom:`1px solid ${G.border}`,position:"sticky",top:0,background:G.bg,zIndex:2 }}>
      <div style={{ ...PAGE,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <div className="sf" style={{ fontSize:24,color:G.text,lineHeight:1.15 }}>PD-100</div>
          <div style={{ fontSize:10,color:G.muted,letterSpacing:1.5,textTransform:"uppercase",marginTop:1 }}>Physical Definition Benchmark</div>
        </div>
        <button onClick={onClose} aria-label="Close" style={{ background:"#fff",border:`1px solid ${G.border}`,borderRadius:11,color:G.muted,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><Icon n="close" s={15} c={G.muted} w={2} /></button>
      </div>
      </div>
      <div style={{ ...PAGE,padding:16 }}>
        <div style={{ display:"flex",gap:7,flexWrap:"wrap",marginBottom:16 }}>
          {["100 reps","5 movements","Bodyweight only","AI counted","For time"].map(x => (
            <span key={x} style={{ fontSize:11.5,padding:"6px 12px",borderRadius:20,background:"#fff",border:`1px solid ${G.border}`,color:G.muted }}>{x}</span>
          ))}
        </div>

        {best && (
          <div style={{ ...card, borderColor:G.gold }}>
            <div style={{ fontSize:11,color:G.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>Your best</div>
            <div style={{ display:"flex",alignItems:"baseline",gap:10 }}>
              <div style={{ fontSize:34,fontWeight:800,color:G.gold }}>{best.pd_score}</div>
              <div style={{ fontSize:14,color:G.muted }}>{fmt(best.total_seconds)}</div>
              <div style={{ marginLeft:"auto",fontSize:12,color:tier(best.total_seconds).c,fontWeight:700 }}>{tier(best.total_seconds).n}</div>
            </div>
          </div>
        )}

        {STATIONS.map((s,i) => (
          <div key={s.id} style={{ ...card, display:"flex",gap:12,alignItems:"center",padding:13 }}>
            <div style={{ width:30,height:30,borderRadius:"50%",background:"#E8EEF8",border:`1px solid ${G.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:G.gold,fontWeight:700,flexShrink:0 }}>{i+1}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15,fontWeight:600,color:G.text }}>{s.name}</div>
              <div style={{ fontSize:11,color:G.muted,marginTop:2 }}>{s.muscles} · {s.sys}</div>
            </div>
            <div style={{ fontSize:14,fontWeight:700,color:G.gold,flexShrink:0 }}>{s.isTime ? "60s" : s.reps}</div>
          </div>
        ))}

        <div style={{ ...card, padding:0, overflow:"hidden", marginTop:14 }}>
          <div onClick={() => setShowHow(!showHow)} style={{ padding:"13px 15px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer" }}>
            <span style={{ fontSize:14,fontWeight:600,color:G.text,display:"flex",alignItems:"center",gap:8 }}><Icon n="book" s={15} c={G.accent} />How the PD-100 works</span>
            <span style={{ color:G.muted,fontSize:16 }}>{showHow ? "−" : "+"}</span>
          </div>
          {showHow && (
            <div style={{ padding:"0 15px 15px",borderTop:`1px solid ${G.border}` }}>
              <div style={{ fontSize:11,color:G.muted,letterSpacing:1,textTransform:"uppercase",margin:"13px 0 6px" }}>What it is</div>
              <div style={{ fontSize:13,color:G.muted,lineHeight:1.65 }}>
                A single continuous bodyweight benchmark. Five stations, 100 total reps, done back to back for time. It tests every major movement pattern — squat, pull, push, full body and core — and every energy system, from explosive power through to endurance. Your time becomes a PD Score that ranks you against every other client.
              </div>

              <div style={{ fontSize:11,color:G.muted,letterSpacing:1,textTransform:"uppercase",margin:"15px 0 6px" }}>Before you start</div>
              <div style={{ fontSize:13,color:G.muted,lineHeight:1.85 }}>
                1. Lean your phone against something at chest height.<br/>
                2. Stand back 2 to 3 metres so your whole body — head to feet — is in frame.<br/>
                3. Make sure the room is well lit and there is space behind you.<br/>
                4. A pull-up bar is needed for station 2.<br/>
                5. Warm up properly first. This is a maximum effort test.
              </div>

              <div style={{ fontSize:11,color:G.muted,letterSpacing:1,textTransform:"uppercase",margin:"15px 0 6px" }}>During the test</div>
              <div style={{ fontSize:13,color:G.muted,lineHeight:1.85 }}>
                The clock starts the moment the camera opens and never stops — rest counts against you. The AI counts each rep only when you hit full range of motion, so half reps will not register. When a station hits its target it moves you on automatically. Watch the form badge: if it turns red, fix your position before continuing.
              </div>

              <div style={{ fontSize:11,color:G.muted,letterSpacing:1,textTransform:"uppercase",margin:"15px 0 6px" }}>Your score</div>
              <div style={{ fontSize:13,color:G.muted,lineHeight:1.65,marginBottom:10 }}>
                A 6:00 finish scores 1000. Halve your time and you double your score — 24:00 is 250, 12:00 is 500, 6:00 is 1000. There is no zero: however long it takes, finishing is a number, and the number moves every time you get faster. Retest monthly.
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6 }}>
                {[["Elite","<7m",G.red],["Advanced","7-11m","#9A6212"],["Intermediate","11-16m",G.gold],["Beginner","16m+",G.muted]].map(x => (
                  <div key={x[0]} style={{ background:"#F3F6FA",border:`1px solid ${G.border}`,borderRadius:8,padding:"8px 5px",textAlign:"center" }}>
                    <div style={{ fontSize:11,fontWeight:700,color:x[2] }}>{x[0]}</div>
                    <div style={{ fontSize:11,color:G.muted,marginTop:2 }}>{x[1]}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize:11,color:G.muted,letterSpacing:1,textTransform:"uppercase",margin:"15px 0 6px" }}>Privacy</div>
              <div style={{ fontSize:13,color:G.muted,lineHeight:1.65 }}>
                Nothing is recorded. The camera runs entirely on your own device and only body position points are read. No video leaves your phone.
              </div>
            </div>
          )}
        </div>

        <button onClick={start} style={{ width:"100%",minHeight:56,background:"linear-gradient(180deg,#16304F,#0E2035)",color:G.paper,border:"none",borderRadius:14,fontWeight:600,fontSize:16,cursor:"pointer",marginTop:6,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:9 }}>
          <Icon n="play" s={15} c={G.paper} /> Start the PD-100
        </button>

        <div style={{ fontSize:11,color:G.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:8 }}>Global leaderboard</div>
        {board.length===0 && <div style={{ fontSize:13,color:G.muted,padding:"12px 0" }}>No scores yet — be the first.</div>}
        {board.map((r,i) => (
          <div key={r.id} style={{ display:"flex",alignItems:"center",gap:11,padding:"11px 13px",background:r.mine?"#E8EEF8":G.surf,border:`1px solid ${r.mine?"#D3E0F2":G.border}`,borderRadius:11,marginBottom:6 }}>
            <div className="sf" style={{ fontSize:17,color:i<3?G.accent:G.dim,width:26,flexShrink:0,textAlign:"center" }}>{i+1}</div>
            <div style={{ flex:1,fontSize:14,color:G.text,fontWeight:500 }}>{r.client_name}</div>
            <div style={{ fontSize:12,color:G.muted }}>{fmt(r.total_seconds)}</div>
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
      <div style={PAGE}>
      {probePanel}
      <div style={{ textAlign:"center",paddingTop:30,marginBottom:22 }}>
        <div style={{ display:"flex",justifyContent:"center",marginBottom:14 }}><div style={{ width:58,height:58,borderRadius:19,background:G.accentSoft,display:"flex",alignItems:"center",justifyContent:"center" }}><Icon n="score" s={26} c={G.accent} /></div></div>
        <div style={{ fontSize:11,color:G.muted,letterSpacing:".09em",textTransform:"uppercase",fontWeight:600 }}>PD Score</div>
        <div className="sf" style={{ fontSize:76,color:G.text,lineHeight:1,marginTop:6,letterSpacing:"-.02em" }}>{finalScore.score}</div>
        <div style={{ fontSize:17,color:G.text,marginTop:6 }}>{fmt(finalScore.total)}</div>
        <div style={{ display:"inline-block",marginTop:10,padding:"5px 16px",borderRadius:20,background:"#F3F6FA",color:finalScore.tier.c,fontWeight:700,fontSize:13 }}>{finalScore.tier.n}</div>
        {saving && <div style={{ fontSize:12,color:G.muted,marginTop:10 }}>Saving...</div>}
        {saveErr && (
          <div style={{ fontSize:12,color:G.red,marginTop:10,lineHeight:1.6 }}>
            Your result is above, but it could not be saved to the leaderboard — {saveErr}
          </div>
        )}
      </div>
      {times.map((t,i) => (
        <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"10px 14px",background:G.surf,border:`1px solid ${G.border}`,borderRadius:10,marginBottom:6 }}>
          <span style={{ fontSize:14,color:G.muted }}>{t.name}</span>
          <span style={{ fontSize:14,color:G.gold,fontFamily:"monospace" }}>{fmt(t.at)}</span>
        </div>
      ))}
      <button onClick={() => { setScreen("intro"); loadBoard(); }} style={{ width:"100%",padding:15,background:G.gold,border:"none",borderRadius:12,fontWeight:800,fontSize:15,cursor:"pointer",marginTop:16 }}>
        View leaderboard
      </button>
    </div>
    </div>
  );

  const st = STATIONS[station];
  return (
    <div style={{ position:"fixed",inset:0,background:G.bg,zIndex:99999,display:"flex",flexDirection:"column",userSelect:"none" }}>
      <div style={{ padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${G.border}`,flexShrink:0 }}>
        <div style={{ fontSize:13,fontWeight:600,color:G.muted,letterSpacing:".05em" }}>Station {station+1} of 5</div>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <span style={{ color:G.gold,fontSize:15,fontWeight:800,fontFamily:"monospace" }}>{fmt(elapsed)}</span>
          <button onClick={() => { stopCam(); setScreen("intro"); }} style={{ background:"transparent",border:`1px solid ${G.border}`,borderRadius:8,color:G.muted,padding:"5px 11px",cursor:"pointer",fontSize:12 }}>Quit</button>
        </div>
      </div>

      <div style={{ height:4,background:G.border,flexShrink:0 }}>
        <div style={{ height:4,width:`${(station/5)*100 + (reps/repTarget(st))*20}%`,background:G.gold,transition:"width .3s" }}/>
      </div>

      <div style={{ position:"relative",flex:1,background:"#0A1727",overflow:"hidden" }}>
        {hiddenVideo}
        <canvas ref={canvasRef} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
        {probePanel}
        <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:16,pointerEvents:"none" }}>
          <div style={{ background:"rgba(0,0,0,0.62)",backdropFilter:"blur(8px)",borderRadius:16,padding:"12px 20px",width:"fit-content",border:`1px solid ${G.border}` }}>
            <div style={{ fontSize:11,color:"#C8D6EA",letterSpacing:1.5,textTransform:"uppercase" }}>{st.name}</div>
            <div className="sf" style={{ fontSize:58,color:"#FCFCFD",lineHeight:1 }}>
              {st.isTime ? plankSec : reps}<span style={{ fontSize:22,color:"#8FA3BE" }}>/{repTarget(st)}</span>
            </div>
          </div>
          <div>
            {/* Over live video, so this pill keeps a solid fill rather than
                the pale tint the rest of the app uses — a 5% wash disappears
                against whatever the camera happens to be pointing at. */}
            <div style={{ padding:"9px 15px",borderRadius:22,fontSize:13,fontWeight:600,width:"fit-content",background:good?"#12795A":"#A63A3A",color:"#FCFCFD",marginBottom:8,display:"flex",alignItems:"center",gap:7 }}>
              <Icon n={good ? "check" : "alert"} s={14} c="#FCFCFD" /> {good ? "Good form" : "Fix form"}
            </div>
            <div style={{ background:"rgba(0,0,0,0.72)",padding:"10px 14px",borderRadius:12,fontSize:13,color:"#C8D6EA",border:`1px solid ${G.border}`,maxWidth:280 }}>{tip}</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:6 }}>© Physical Definition · {client?.name||""}</div>
          </div>
        </div>
      </div>

      <div style={{ padding:"12px 16px",borderTop:`1px solid ${G.border}`,flexShrink:0 }}>
        <button onClick={nextStation} style={{ width:"100%",padding:13,background:"transparent",border:`1px solid ${G.border}`,borderRadius:11,color:G.muted,fontSize:14,cursor:"pointer" }}>
          Skip station →
        </button>
      </div>
    </div>
  );
}

// PR-1 measurement panel. Rendered only with ?pdprobe=1. Everything stays on
// this device; "Save log" writes a local file and nothing is uploaded.
function ProbePanel({ probe, tick, setTick, label, setLabel, rec, setRec, file, setFile }) {
  const [, setLocal] = useState(0);
  useEffect(() => { const id = setInterval(() => setLocal(x => x + 1), 1000); return () => clearInterval(id); }, []);
  const s = probe ? probe.summary() : null;
  const ms = (o) => (o && o.median != null ? `${o.median.toFixed(0)} / ${o.p95.toFixed(0)} ms` : "–");
  const box = { position:"absolute", top:8, right:8, zIndex:5, maxWidth:260, background:"rgba(0,0,0,0.8)", color:"#E6EDF6",
    font:"11px/1.45 monospace", padding:"8px 10px", borderRadius:8, pointerEvents:"auto" };
  return (
    <div style={box} data-tick={tick}>
      <div style={{ fontWeight:700, color:"#F2C94C" }}>PD-100 PROBE (on this device only)</div>
      <label style={{ display:"block" }}>Device <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Galaxy A54" style={{ width:130, font:"inherit" }} /></label>
      <label style={{ display:"block" }}><input type="checkbox" checked={rec} onChange={e => setRec(e.target.checked)} /> Record landmarks (opt-in)</label>
      <label style={{ display:"block" }}>Replay file <input type="file" accept="video/*" onChange={e => setFile(e.target.files?.[0] || null)} style={{ width:140, font:"inherit" }} /></label>
      {file && <div>Source: file ({file.name}) <button onClick={() => setFile(null)}>use camera</button></div>}
      {s && (
        <div style={{ marginTop:4 }}>
          <div>src {s.meta.source} · captureTime {s.meta.capture_time_available ? "yes" : "no"}</div>
          <div>fps proc {s.processed_fps ? s.processed_fps.toFixed(1) : "–"} · cam {s.camera_fps ? s.camera_fps.toFixed(1) : "–"} · dup {s.duplicate_sends} · not sent {s.camera_frames_not_sent}</div>
          <div>inference med/p95 {ms(s.inference_ms)}</div>
          <div>draw {ms(s.draw_ms)} · to paint {ms(s.to_paint_ms)}</div>
          <div>partial (not glass) {ms(s.partial_ms)}</div>
          <div>gated-out {s.gated_out_frames} · lm rec {s.landmark_frames_recorded}/{s.landmark_cap}</div>
          {s.truncated && <div style={{ color:"#FF8A80" }}>LOG TRUNCATED: {s.timing_frames_dropped} frames, {s.events_dropped} events dropped</div>}
          <button onClick={() => { saveLocal(probe.exportLog(), `pd100-probe-${Date.now()}.json`); setTick(t => t + 1); }}>Save log</button>{" "}
          <button onClick={() => { try { navigator.clipboard.writeText(JSON.stringify(probe.summary(), null, 1)); } catch { /* ignore */ } }}>Copy summary</button>
        </div>
      )}
    </div>
  );
}
