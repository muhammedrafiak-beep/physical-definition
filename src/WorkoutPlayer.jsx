import { useState, useEffect, useRef, useCallback } from "react";

const VIDEO_BASE = "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-videos";

// Map exercise name -> video filename. Default fallback covers everything for now.
const DEFAULT_VIDEO = "workout_all.mp4";
function getVideoForExercise(exName) {
  const l = (exName || "").toLowerCase();
  // Add specific mappings here as more videos are created, e.g.:
  // if (l.includes("bench press")) return "bench_press.mp4";
  return DEFAULT_VIDEO;
}

function parseRestSeconds(restStr) {
  if (!restStr) return 60;
  const s = String(restStr).toLowerCase();
  const minMatch = s.match(/(\d+)\s*min/);
  if (minMatch) return parseInt(minMatch[1], 10) * 60;
  const secMatch = s.match(/(\d+)\s*s/);
  if (secMatch) return parseInt(secMatch[1], 10);
  const num = parseInt(s, 10);
  return isNaN(num) ? 60 : num;
}

function parseSets(setsVal) {
  const n = parseInt(setsVal, 10);
  return isNaN(n) || n < 1 ? 1 : n;
}

// Flatten workout system days into a single ordered list of {dayName, exercise}
function flattenWorkout(workoutSystem) {
  if (!workoutSystem || !workoutSystem.days) return [];
  const list = [];
  workoutSystem.days.forEach((day) => {
    (day.exercises || []).forEach((ex) => {
      list.push({ dayName: day.name, exercise: ex });
    });
  });
  return list;
}

export function WorkoutPlayer({ workoutSystem, onClose, accentColor = "#d4af37" }) {
  const queue = useRef(flattenWorkout(workoutSystem)).current;

  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(1); // 1-indexed current set
  const [phase, setPhase] = useState("exercise"); // "exercise" | "rest" | "done"
  const [restRemaining, setRestRemaining] = useState(0);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  const current = queue[exIdx];
  const totalSets = current ? parseSets(current.exercise.sets) : 1;
  const restSeconds = current ? parseRestSeconds(current.exercise.rest) : 60;

  // Reset video play state whenever we move to a new exercise/set in "exercise" phase
  useEffect(() => {
    if (phase === "exercise" && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [exIdx, setIdx, phase]);

  // Rest countdown effect
  useEffect(() => {
    if (phase !== "rest") return;
    if (restRemaining <= 0) {
      // rest finished -> advance
      advanceAfterRest();
      return;
    }
    timerRef.current = setTimeout(() => {
      setRestRemaining((r) => r - 1);
    }, 1000);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, restRemaining]);

  const advanceAfterRest = useCallback(() => {
    if (setIdx < totalSets) {
      setSetIdx((s) => s + 1);
      setPhase("exercise");
    } else {
      // move to next exercise
      if (exIdx < queue.length - 1) {
        setExIdx((i) => i + 1);
        setSetIdx(1);
        setPhase("exercise");
      } else {
        setPhase("done");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIdx, totalSets, exIdx, queue.length]);

  const handleSetDone = () => {
    if (videoRef.current) videoRef.current.pause();
    const isLastSetOfLastExercise =
      setIdx >= totalSets && exIdx >= queue.length - 1;
    if (isLastSetOfLastExercise) {
      setPhase("done");
      return;
    }
    setRestRemaining(restSeconds);
    setPhase("rest");
  };

  const handleSkipRest = () => {
    clearTimeout(timerRef.current);
    advanceAfterRest();
  };

  const handleSkipExercise = () => {
    clearTimeout(timerRef.current);
    if (exIdx < queue.length - 1) {
      setExIdx((i) => i + 1);
      setSetIdx(1);
      setPhase("exercise");
    } else {
      setPhase("done");
    }
  };

  if (!queue.length) {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <p style={{ color: "#fff", fontSize: 16 }}>No exercises found in this workout plan.</p>
          <button onClick={onClose} style={closeBtnStyle(accentColor)}>Close</button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <h2 style={{ color: "#fff", margin: "0 0 8px" }}>Workout Complete!</h2>
          <p style={{ color: "#aaa", marginBottom: 24 }}>Great job finishing all {queue.length} exercises.</p>
          <button onClick={onClose} style={closeBtnStyle(accentColor)}>Finish</button>
        </div>
      </div>
    );
  }

  const videoSrc = `${VIDEO_BASE}/${getVideoForExercise(current.exercise.name)}`;
  const progressPct = Math.round(((exIdx + (setIdx - 1) / totalSets) / queue.length) * 100);

  return (
    <div style={overlayStyle}>
      <div style={playerCardStyle}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px" }}>
          <span style={{ color: "#999", fontSize: 13, fontWeight: 600 }}>
            {current.dayName} &middot; Exercise {exIdx + 1}/{queue.length}
          </span>
          <button onClick={onClose} style={iconBtnStyle}>✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: "#2a2a2a", margin: "0 18px", borderRadius: 2 }}>
          <div style={{ height: 4, width: `${progressPct}%`, background: accentColor, borderRadius: 2, transition: "width .3s" }} />
        </div>

        {/* Video / Rest area */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000", marginTop: 14 }}>
          {phase === "exercise" && (
            <video
              ref={videoRef}
              src={videoSrc}
              style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
              loop
              muted
              playsInline
              autoPlay
            />
          )}
          {phase === "rest" && (
            <div style={{
              width: "100%", height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", background: "#111",
            }}>
              <div style={{ fontSize: 13, color: "#999", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>REST</div>
              <div style={{ fontSize: 56, color: accentColor, fontWeight: 800 }}>{restRemaining}s</div>
              <div style={{ fontSize: 13, color: "#777", marginTop: 8 }}>Next: Set {setIdx < totalSets ? setIdx + 1 : 1} of {setIdx < totalSets ? totalSets : (exIdx < queue.length - 1 ? parseSets(queue[exIdx + 1].exercise.sets) : 1)}</div>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "18px 18px 0" }}>
          <h2 style={{ color: "#fff", margin: "0 0 6px", fontSize: 20 }}>{current.exercise.name}</h2>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <Pill label={`Set ${setIdx}/${totalSets}`} color={accentColor} />
            <Pill label={`Reps: ${current.exercise.reps}`} color="#22c55e" />
            <Pill label={`Rest: ${current.exercise.rest}`} color="#3b82f6" />
          </div>
        </div>

        {/* Controls */}
        <div style={{ padding: "0 18px 20px", display: "flex", gap: 10 }}>
          {phase === "exercise" ? (
            <button onClick={handleSetDone} style={primaryBtnStyle(accentColor)}>
              ✓ Set {setIdx} Done
            </button>
          ) : (
            <button onClick={handleSkipRest} style={primaryBtnStyle(accentColor)}>
              ⏭ Skip Rest
            </button>
          )}
          <button onClick={handleSkipExercise} style={secondaryBtnStyle}>
            Skip Exercise
          </button>
        </div>
      </div>
    </div>
  );
}

function Pill({ label, color }) {
  return (
    <span style={{
      background: `${color}22`, color, fontSize: 12, fontWeight: 700,
      padding: "4px 10px", borderRadius: 20,
    }}>
      {label}
    </span>
  );
}

const overlayStyle = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.92)", zIndex: 9999,
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: 16,
};

const cardStyle = {
  background: "#181818", borderRadius: 16, padding: 32,
  textAlign: "center", maxWidth: 360,
};

const playerCardStyle = {
  background: "#181818", borderRadius: 16, width: "100%", maxWidth: 480,
  maxHeight: "92vh", overflowY: "auto",
};

const iconBtnStyle = {
  background: "none", border: "none", color: "#999", fontSize: 18,
  cursor: "pointer", padding: 4,
};

function primaryBtnStyle(accent) {
  return {
    flex: 1, background: accent, color: "#000", border: "none",
    borderRadius: 10, padding: "14px 0", fontWeight: 700, fontSize: 15,
    cursor: "pointer",
  };
}

const secondaryBtnStyle = {
  background: "#2a2a2a", color: "#ccc", border: "none",
  borderRadius: 10, padding: "14px 18px", fontWeight: 600, fontSize: 14,
  cursor: "pointer",
};

function closeBtnStyle(accent) {
  return {
    background: accent, color: "#000", border: "none",
    borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 15,
    cursor: "pointer",
  };
}
