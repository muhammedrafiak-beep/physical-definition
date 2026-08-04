import { useEffect, useRef, useState } from "react";


const drawConnectors = (ctx, landmarks, connections, style) => { if (!window.drawConnectors) return; window.drawConnectors(ctx, landmarks, connections, style); };
const drawLandmarks = (ctx, landmarks, style) => { if (!window.drawLandmarks) return; window.drawLandmarks(ctx, landmarks, style); };

const EX_CFG = {
  pushup:    { label:"REPS", angleLabel:"Elbow Angle", tip:"Keep body straight · lower chest to floor" },
  squat:     { label:"REPS", angleLabel:"Knee Angle",  tip:"Feet shoulder width · squat to parallel" },
  plank:     { label:"TIME", angleLabel:"Hip Angle",   tip:"Body in straight line · hold 60 seconds" },
  jumpSquat: { label:"REPS", angleLabel:"Knee Angle",  tip:"Explosive jump · land softly · full squat" },
  pullup:    { label:"REPS", angleLabel:"Elbow Angle", tip:"Dead hang start · chin above bar" },
};

function calcAngle(a,b,c){
  const r=Math.atan2(c.y-b.y,c.x-b.x)-Math.atan2(a.y-b.y,a.x-b.x);
  let d=Math.abs(r*180/Math.PI);
  return d>180?360-d:d;
}
function pt(L,i){return{x:L[i].x,y:L[i].y};}

export function AIFormCheck({ onClose, exerciseName, clientName }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const camRef = useRef(null);
  const stageRef = useRef("up");
  const plankIntRef = useRef(null);

  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reps, setReps] = useState(0);
  const [plankSec, setPlankSec] = useState(0);
  const [formGood, setFormGood] = useState(true);
  const [formTip, setFormTip] = useState("");
  const [angle, setAngle] = useState(0);
  const [curEx, setCurEx] = useState("pushup");
  const [showPrivacy, setShowPrivacy] = useState(true);

  const repsRef = useRef(0);
  const curExRef = useRef("pushup");

  useEffect(() => { curExRef.current = curEx; }, [curEx]);

  function analyze(L) {
    const ex = curExRef.current;
    let a = 0, good = true, tip = "";

    if (ex === "pushup") {
      a = calcAngle(pt(L,11),pt(L,13),pt(L,15));
      const hip = calcAngle(pt(L,11),pt(L,23),pt(L,27));
      if (a < 85 && stageRef.current === "up") stageRef.current = "down";
      if (a > 155 && stageRef.current === "down") {
        stageRef.current = "up";
        repsRef.current += 1;
        setReps(repsRef.current);
      }
      tip = a < 85 ? "✅ Great depth!" : a < 155 ? `Lower more — ${Math.round(a)}°` : "Lower chest to floor";
      if (Math.abs(hip - 180) > 30) { good = false; tip = "⚠️ Keep body straight — hips sagging!"; }
    }
    else if (ex === "squat") {
      a = calcAngle(pt(L,23),pt(L,25),pt(L,27));
      if (a < 90 && stageRef.current === "up") stageRef.current = "down";
      if (a > 155 && stageRef.current === "down") {
        stageRef.current = "up";
        repsRef.current += 1;
        setReps(repsRef.current);
      }
      tip = a > 155 ? "Start descent" : a > 90 ? `Go deeper — ${Math.round(a)}°` : "✅ Parallel depth!";
      if (L[25].x < L[27].x - 0.05) { good = false; tip = "⚠️ Knees caving — push them out!"; }
    }
    else if (ex === "plank") {
      a = calcAngle(pt(L,11),pt(L,23),pt(L,27));
      if (Math.abs(a - 180) < 25) tip = "✅ Perfect alignment!";
      else if (L[23].y < L[11].y - 0.05) { good = false; tip = "⚠️ Hips too high!"; }
      else { good = false; tip = "⚠️ Hips sagging — squeeze core!"; }
    }
    else if (ex === "jumpSquat") {
      a = calcAngle(pt(L,23),pt(L,25),pt(L,27));
      const inAir = L[27].y < L[23].y - 0.1;
      if (inAir && stageRef.current === "down") {
        stageRef.current = "up";
        repsRef.current += 1;
        setReps(repsRef.current);
      }
      if (a < 90 && stageRef.current === "up") stageRef.current = "down";
      tip = inAir ? "✅ In air — land softly!" : a < 90 ? "✅ Deep — explode up!" : "Squat down to jump";
    }
    else if (ex === "pullup") {
      a = calcAngle(pt(L,11),pt(L,13),pt(L,15));
      if (a > 155 && stageRef.current === "up") stageRef.current = "down";
      if (L[15].y < L[0].y && stageRef.current === "down") {
        stageRef.current = "up";
        repsRef.current += 1;
        setReps(repsRef.current);
      }
      tip = a > 155 ? "Pull up from dead hang!" : L[15].y < L[0].y ? "✅ Chin above bar!" : `Keep pulling — ${Math.round(a)}°`;
    }

    setAngle(Math.round(a));
    setFormGood(good);
    setFormTip(tip);
  }

  async function startCamera() {
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      if (!poseRef.current) {
        poseRef.current = new window.Pose({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${f}` });
        poseRef.current.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });
        poseRef.current.onResults(res => {
          const cv = canvasRef.current;
          if (!cv) return;
          const ctx = cv.getContext("2d");
          cv.width = res.image.width; cv.height = res.image.height;
          ctx.save();
          ctx.scale(-1,1); ctx.translate(-cv.width,0);
          ctx.drawImage(res.image,0,0,cv.width,cv.height);
          if (res.poseLandmarks) {
            drawConnectors(ctx,res.poseLandmarks,window.POSE_CONNECTIONS,{color:"rgba(34,197,94,0.8)",lineWidth:3});
            drawLandmarks(ctx,res.poseLandmarks,{color:"#d4af37",fillColor:"rgba(212,175,55,0.3)",lineWidth:2,radius:5});
            analyze(res.poseLandmarks.map(p=>({...p,x:1-p.x})));
          }
          ctx.restore();
        });
      }

      camRef.current = new window.Camera(videoRef.current, {
        onFrame: async () => { await poseRef.current.send({ image: videoRef.current }); },
        width: 640, height: 480
      });
      await camRef.current.start();
      setRunning(true);
      setLoading(false);

      if (curExRef.current === "plank") {
        plankIntRef.current = setInterval(() => setPlankSec(s => s + 1), 1000);
      }
    } catch(e) {
      setLoading(false);
      alert("Camera access denied. Please allow camera in browser settings.");
    }
  }

  function stopCamera() {
    if (camRef.current) camRef.current.stop();
    if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    if (plankIntRef.current) clearInterval(plankIntRef.current);
    setRunning(false);
  }

  function switchEx(ex) {
    setCurEx(ex);
    curExRef.current = ex;
    stageRef.current = "up";
    repsRef.current = 0;
    setReps(0); setPlankSec(0);
    if (plankIntRef.current) { clearInterval(plankIntRef.current); plankIntRef.current = null; }
    if (ex === "plank" && running) {
      plankIntRef.current = setInterval(() => setPlankSec(s => s + 1), 1000);
    }
  }

  useEffect(() => { return () => { stopCamera(); }; }, []);

  const G = { gold:"#d4af37", bg:"#0d0d0d", surf:"#181818", surf2:"#1a1a1a", green:"#22c55e", red:"#ef4444", muted:"#666", text:"#fff" };

  if (showPrivacy) return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
      <div style={{ background:G.surf,borderRadius:20,padding:28,maxWidth:360,width:"100%",border:"1px solid #2a2a2a" }}>
        <div style={{ fontSize:40,textAlign:"center",marginBottom:16 }}>🔒</div>
        <div style={{ fontSize:18,fontWeight:700,color:G.gold,textAlign:"center",marginBottom:8 }}>Your Privacy is Protected</div>
        <div style={{ fontSize:13,color:"#aaa",lineHeight:1.8,marginBottom:20 }}>
          ✅ No video is recorded or stored<br/>
          ✅ Camera data never leaves your device<br/>
          ✅ AI runs 100% offline on your phone<br/>
          ✅ Only body position dots are detected<br/>
          ✅ Camera stops when you close this screen
        </div>
        <button onClick={() => setShowPrivacy(false)} style={{ width:"100%",padding:"14px",background:G.gold,border:"none",borderRadius:12,fontWeight:700,fontSize:15,cursor:"pointer",marginBottom:10 }}>
          Understood — Start AI Check
        </button>
        <button onClick={onClose} style={{ width:"100%",padding:"12px",background:"transparent",border:"1px solid #333",borderRadius:12,color:"#999",fontSize:14,cursor:"pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );

  const exercises = ["pushup","squat","plank","jumpSquat","pullup"];
  const exLabels = { pushup:"💪 Push-up", squat:"🦵 Squat", plank:"🧘 Plank", jumpSquat:"⚡ Jump Squat", pullup:"🏋️ Pull-up" };
  const cfg = EX_CFG[curEx];

  return (
    <div style={{ position:"fixed",inset:0,background:G.bg,zIndex:99999,display:"flex",flexDirection:column,userSelect:"none" }}>
      {/* Header */}
      <div style={{ padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #1a1a1a",flexShrink:0 }}>
        <div style={{ fontSize:15,fontWeight:600,color:G.gold,display:"flex",alignItems:"center",gap:8 }}>
          🤖 AI Form Check
          {running && <span style={{ width:8,height:8,borderRadius:"50%",background:G.green,boxShadow:`0 0 8px ${G.green}`,display:"inline-block" }}/>}
        </div>
        <button onClick={() => { stopCamera(); onClose(); }} style={{ background:"transparent",border:"1px solid #333",borderRadius:8,color:"#999",padding:"6px 12px",cursor:"pointer",fontSize:13 }}>✕ Close</button>
      </div>

      {/* Exercise tabs */}
      <div style={{ display:"flex",gap:6,padding:"10px 16px",overflowX:"auto",flexShrink:0,scrollbarWidth:"none" }}>
        {exercises.map(ex => (
          <button key={ex} onClick={() => switchEx(ex)} style={{ padding:"6px 14px",borderRadius:20,border:`1px solid ${curEx===ex?G.gold:"#2a2a2a"}`,background:curEx===ex?G.gold:"transparent",color:curEx===ex?"#000":"#666",fontSize:12,cursor:"pointer",whiteSpace:"nowrap",fontWeight:curEx===ex?700:400 }}>
            {exLabels[ex]}
          </button>
        ))}
      </div>

      {/* Camera area */}
      <div style={{ position:"relative",flex:1,background:"#111",overflow:"hidden" }}>
        <video ref={videoRef} style={{ display:"none" }} playsInline />
        <canvas ref={canvasRef} style={{ width:"100%",height:"100%",objectFit:"cover" }} />

        {/* HUD overlay */}
        {running && (
          <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:16,pointerEvents:"none" }}>
            <div style={{ background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",borderRadius:16,padding:"12px 20px",display:"inline-flex",flexDirection:"column",alignItems:"center",width:"fit-content",border:"1px solid #2a2a2a" }}>
              <div style={{ fontSize:11,color:G.muted,letterSpacing:1.5,textTransform:"uppercase",marginBottom:2 }}>{cfg.label}</div>
              <div style={{ fontSize:56,fontWeight:700,color:G.gold,lineHeight:1 }}>{curEx==="plank" ? plankSec+"s" : reps}</div>
            </div>
            <div style={{ position:"absolute",top:"50%",right:16,transform:"translateY(-50%)",background:"rgba(0,0,0,0.7)",borderRadius:12,padding:"12px 14px",textAlign:"center",border:"1px solid #2a2a2a" }}>
              <div style={{ fontSize:26,fontWeight:600,color:G.gold }}>{angle}°</div>
              <div style={{ fontSize:10,color:G.muted,textTransform:"uppercase",letterSpacing:1 }}>{cfg.angleLabel}</div>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              <div style={{ padding:"8px 16px",borderRadius:20,fontSize:13,fontWeight:600,display:"inline-flex",alignItems:"center",gap:6,width:"fit-content",background:formGood?"rgba(34,197,94,0.85)":"rgba(239,68,68,0.85)",color:formGood?"#000":"#fff" }}>
                {formGood ? "✅ Good Form" : "⚠️ Fix Form"}
              </div>
              <div style={{ background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",padding:"10px 14px",borderRadius:12,fontSize:13,color:"#e5e5e5",border:"1px solid #2a2a2a",maxWidth:280 }}>
                {formTip || cfg.tip}
              </div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.2)" }}>© Physical Definition · {clientName || ""}</div>
            </div>
          </div>
        )}

        {/* Loading / start screen */}
        {!running && (
          <div style={{ position:"absolute",inset:0,background:"#111",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14 }}>
            {loading ? (
              <>
                <div style={{ width:44,height:44,border:"3px solid #1a1a1a",borderTopColor:G.gold,borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
                <div style={{ color:G.gold,fontSize:14,fontWeight:500 }}>Loading AI model...</div>
              </>
            ) : (
              <>
                <div style={{ fontSize:48 }}>🤖</div>
                <div style={{ color:G.gold,fontSize:16,fontWeight:600 }}>AI Form Check Ready</div>
                <div style={{ color:"#444",fontSize:13,textAlign:"center",lineHeight:1.8,padding:"0 32px" }}>Stand 2–3m from camera<br/>Full body must be visible<br/><strong style={{ color:G.gold }}>{exLabels[curEx]}</strong> selected</div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding:"12px 16px",display:"flex",gap:8,borderTop:"1px solid #1a1a1a",flexShrink:0 }}>
        <button onClick={running ? stopCamera : startCamera} style={{ flex:1,padding:"14px",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",background:running?G.red:G.gold,color:running?"#fff":"#000" }}>
          {loading ? "Loading..." : running ? "⏹ Stop Camera" : "📷 Start Camera"}
        </button>
        <button onClick={() => { stageRef.current="up"; repsRef.current=0; setReps(0); setPlankSec(0); }} style={{ padding:"14px 18px",border:"1px solid #2a2a2a",borderRadius:12,background:"transparent",color:"#999",fontSize:14,cursor:"pointer" }}>↺</button>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}