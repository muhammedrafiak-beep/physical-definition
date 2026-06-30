import { useState, useEffect, useRef, useCallback } from "react";
import { ExerciseIllustration } from "./ExerciseIllustration";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPA_URL, SUPA_KEY);

const VIDEO_BASE = "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-videos";
const DEFAULT_VIDEO = "workout_all.mp4";

function getVideoForExercise(exName) {
  const l = (exName || "").toLowerCase();
  if (l.includes("pull-up") || l.includes("pullup") || l.includes("pull up") || l.includes("chin")) return "workout_all.mp4";
  return null;
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

// Detect duration-based exercises like "30 sec hold", "45s", "1 min" in the reps field
function parseExerciseDurationSeconds(repsVal) {
  if (!repsVal) return null;
  const s = String(repsVal).toLowerCase();
  if (!/(sec|min|hold|\bs\b)/.test(s)) return null;
  const minMatch = s.match(/(\d+)\s*min/);
  if (minMatch) return parseInt(minMatch[1], 10) * 60;
  const secMatch = s.match(/(\d+)\s*(sec|s)\b/);
  if (secMatch) return parseInt(secMatch[1], 10);
  const num = parseInt(s, 10);
  return isNaN(num) ? null : num;
}

function fmtClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Flatten workout system days (or a single day) into ordered list of {dayName, exercise}
const WARMUP_EXERCISES = [
  { name: "Light Jog in Place", sets: 1, reps: "2 min", rest: "0s" },
  { name: "Jumping Jacks", sets: 1, reps: "60 sec", rest: "0s" },
  { name: "Neck Rotations", sets: 1, reps: "30 sec", rest: "0s" },
  { name: "Shoulder Rotations", sets: 1, reps: "30 sec", rest: "0s" },
  { name: "Elbow Circles", sets: 1, reps: "30 sec", rest: "0s" },
  { name: "Wrist Circles", sets: 1, reps: "30 sec", rest: "0s" },
  { name: "Torso Rotations", sets: 1, reps: "30 sec", rest: "0s" },
  { name: "Hip Circles", sets: 1, reps: "30 sec", rest: "0s" },
  { name: "Knee Circles", sets: 1, reps: "30 sec", rest: "0s" },
  { name: "Ankle Rotations", sets: 1, reps: "30 sec", rest: "0s" },
  { name: "Leg Swings", sets: 1, reps: "30 sec", rest: "0s" },
  { name: "Arm Swings", sets: 1, reps: "30 sec", rest: "0s" },
  { name: "Bodyweight Squat", sets: 1, reps: "10", rest: "15s" },
  { name: "Hip Flexor Stretch", sets: 1, reps: "30 sec", rest: "0s" },
];
const COOLDOWN_EXERCISES = [
  { name: "Light Walk in Place", sets: 1, reps: "60 sec", rest: "0s" },
  { name: "Standing Quad Stretch", sets: 1, reps: "30 sec", rest: "10s" },
  { name: "Hamstring Stretch", sets: 1, reps: "30 sec", rest: "10s" },
  { name: "Hip Flexor Stretch", sets: 1, reps: "30 sec", rest: "10s" },
  { name: "Chest Stretch", sets: 1, reps: "30 sec", rest: "10s" },
  { name: "Shoulder Stretch", sets: 1, reps: "30 sec", rest: "10s" },
  { name: "Childs Pose", sets: 1, reps: "60 sec", rest: "0s" },
  { name: "Deep Breathing", sets: 1, reps: "60 sec", rest: "0s" },
];

function flattenWorkout(workoutSystem, dayFilter) {
  if (!workoutSystem || !workoutSystem.days) return [];
  const list = [];
  WARMUP_EXERCISES.forEach(ex => list.push({ dayName: "🔥 Warm-up", exercise: ex }));
  const days = dayFilter
    ? workoutSystem.days.filter((d) => d.name === dayFilter)
    : workoutSystem.days;
  days.forEach((day) => {
    (day.exercises || []).forEach((ex) => {
      list.push({ dayName: day.name, exercise: ex });
    });
  });
  COOLDOWN_EXERCISES.forEach(ex => list.push({ dayName: "🧘 Cool-down", exercise: ex }));
  return list;
}

// Rough MET-based calorie estimate for resistance training (~6 MET average)
function estimateCalories(durationMinutes, weightKg = 75) {
  const MET = 6;
  return Math.round(MET * weightKg * (durationMinutes / 60));
}

export function WorkoutPlayer({
  workoutSystem,
  dayName = null,        // if provided, only play this day's exercises
  client = null,         // client object, used for logging + calorie estimate
  onClose,
  accentColor = "#d4af37",
}) {
  const queue = useRef(flattenWorkout(workoutSystem, dayName)).current;
  const startTimeRef = useRef(Date.now());

  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(1);
  const [phase, setPhase] = useState("exercise"); // "exercise" | "rest" | "done"
  const [restRemaining, setRestRemaining] = useState(0);
  const [exerciseRemaining, setExerciseRemaining] = useState(null); // for duration-based exercises
  const [elapsed, setElapsed] = useState(0); // overall stopwatch, seconds
  const [saving, setSaving] = useState(false);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const stopwatchRef = useRef(null);

  const current = queue[exIdx];
  const totalSets = current ? parseSets(current.exercise.sets) : 1;
  const restSeconds = current ? parseRestSeconds(current.exercise.rest) : 60;
  const exDurationSeconds = current ? parseExerciseDurationSeconds(current.exercise.reps) : null;

  // Overall stopwatch — runs continuously while player is open
  useEffect(() => {
    stopwatchRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(stopwatchRef.current);
  }, []);

  // Reset/start video + duration timer when moving to a new exercise/set
  useEffect(() => {
    if (phase === "exercise" && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    if (phase === "exercise" && exDurationSeconds) {
      setExerciseRemaining(exDurationSeconds);
    } else {
      setExerciseRemaining(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exIdx, setIdx, phase]);

  // Exercise duration countdown — auto-completes the set when it hits zero
  useEffect(() => {
    if (phase !== "exercise" || exerciseRemaining === null) return;
    if (exerciseRemaining <= 0) {
      handleSetDone();
      return;
    }
    const t = setTimeout(() => setExerciseRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, exerciseRemaining]);

  // Rest countdown
  useEffect(() => {
    if (phase !== "rest") return;
    if (restRemaining <= 0) {
      advanceAfterRest();
      return;
    }
    timerRef.current = setTimeout(() => setRestRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, restRemaining]);

  const logWorkout = useCallback(async (exercisesCompleted) => {
    if (!client) return;
    setSaving(true);
    const durationMinutes = elapsed / 60;
    const calories = estimateCalories(durationMinutes, client.weight || 75);
    try {
      await supabase.from("workout_logs").insert([{
        client_id: String(client.id),
        client_name: client.name,
        day_name: dayName || "Full Workout",
        workout_system_id: workoutSystem?.id || null,
        exercises_completed: exercisesCompleted,
        total_exercises: queue.length,
        duration_minutes: Math.round(durationMinutes * 10) / 10,
        estimated_calories: calories,
      }]);
    } catch (e) {
      console.error("Failed to log workout:", e);
    }
    setSaving(false);
  }, [client, dayName, workoutSystem, queue.length, elapsed]);

  const advanceAfterRest = useCallback(() => {
    if (setIdx < totalSets) {
      setSetIdx((s) => s + 1);
      setPhase("exercise");
    } else {
      if (exIdx < queue.length - 1) {
        setExIdx((i) => i + 1);
        setSetIdx(1);
        setPhase("exercise");
      } else {
        logWorkout(queue.length);
        setPhase("done");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIdx, totalSets, exIdx, queue.length, logWorkout]);

  const handleSetDone = () => {
    if (videoRef.current) videoRef.current.pause();
    const isLastSetOfLastExercise = setIdx >= totalSets && exIdx >= queue.length - 1;
    if (isLastSetOfLastExercise) {
      logWorkout(queue.length);
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
      logWorkout(exIdx + 1);
      setPhase("done");
    }
  };

  const handleEndEarly = () => {
    clearTimeout(timerRef.current);
    logWorkout(exIdx);
    onClose();
  };

  if (!queue.length) {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <p style={{ color: "#fff", fontSize: 16 }}>No exercises found{dayName ? ` for ${dayName}` : ""}.</p>
          <button onClick={onClose} style={closeBtnStyle(accentColor)}>Close</button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const durationMinutes = elapsed / 60;
    const calories = estimateCalories(durationMinutes, client?.weight || 75);
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <h2 style={{ color: "#fff", margin: "0 0 8px" }}>Workout Complete!</h2>
          <p style={{ color: "#aaa", marginBottom: 4 }}>{queue.length} exercises &middot; {fmtClock(elapsed)} min</p>
          <p style={{ color: accentColor, fontWeight: 700, marginBottom: 20 }}>≈ {calories} kcal burned</p>
          {saving && <p style={{ color: "#666", fontSize: 12, marginBottom: 10 }}>Saving...</p>}
          <button onClick={onClose} style={closeBtnStyle(accentColor)}>Finish</button>
        </div>
      </div>
    );
  }

  const videoFile = getVideoForExercise(current.exercise.name);
  const videoSrc = videoFile ? `${VIDEO_BASE}/${videoFile}` : null;
  const progressPct = Math.round(((exIdx + (setIdx - 1) / totalSets) / queue.length) * 100);

  return (
    <div style={overlayStyle}>
      <div style={playerCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px" }}>
          <span style={{ color: "#999", fontSize: 13, fontWeight: 600 }}>
            {current.dayName} &middot; Exercise {exIdx + 1}/{queue.length}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: accentColor, fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>
              ⏱ {fmtClock(elapsed)}
            </span>
            <button onClick={handleEndEarly} style={iconBtnStyle}>✕</button>
          </div>
        </div>

        <div style={{ height: 4, background: "#2a2a2a", margin: "0 18px", borderRadius: 2 }}>
          <div style={{ height: 4, width: `${progressPct}%`, background: accentColor, borderRadius: 2, transition: "width .3s" }} />
        </div>

        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000", marginTop: 14 }}>
          {phase === "exercise" && videoSrc && (
            <>
              <video
                ref={videoRef}
                src={videoSrc}
                style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
                loop muted playsInline autoPlay
              />
              {exerciseRemaining !== null && (
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  background: "rgba(0,0,0,0.75)", color: accentColor,
                  fontFamily: "monospace", fontWeight: 800, fontSize: 22,
                  padding: "6px 14px", borderRadius: 8,
                }}>
                  {exerciseRemaining}s
                </div>
              )}
            </>
          )}
          {phase === "exercise" && !videoSrc && (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a1a", padding: 8 }}>
              <ExerciseIllustration exerciseId={current.exercise.name} size={180} />
            </div>
          )}
          {phase === "rest" && (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#111" }}>
              <div style={{ fontSize: 13, color: "#999", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>REST</div>
              <div style={{ fontSize: 56, color: accentColor, fontWeight: 800 }}>{restRemaining}s</div>
            </div>
          )}
        </div>

        <div style={{ padding: "18px 18px 0" }}>
          <h2 style={{ color: "#fff", margin: "0 0 6px", fontSize: 20 }}>{current.exercise.name}</h2>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <Pill label={`Set ${setIdx}/${totalSets}`} color={accentColor} />
            <Pill label={`Reps: ${current.exercise.reps}`} color="#22c55e" />
            <Pill label={`Rest: ${current.exercise.rest}`} color="#3b82f6" />
          </div>
        </div>

        <div style={{ padding: "0 18px 20px", display: "flex", gap: 10 }}>
          {phase === "exercise" ? (
            <button onClick={handleSetDone} style={primaryBtnStyle(accentColor)}>
              {exerciseRemaining !== null ? "✓ Finish Early" : `✓ Set ${setIdx} Done`}
            </button>
          ) : (
            <button onClick={handleSkipRest} style={primaryBtnStyle(accentColor)}>⏭ Skip Rest</button>
          )}
          <button onClick={handleSkipExercise} style={secondaryBtnStyle}>Skip Exercise</button>
        </div>
      </div>
    </div>
  );
}

function Pill({ label, color }) {
  return (
    <span style={{ background: `${color}22`, color, fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
      {label}
    </span>
  );
}

const overlayStyle = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.92)", zIndex: 9999,
  display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
};
const cardStyle = { background: "#181818", borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 360 };
const playerCardStyle = { background: "#181818", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto" };
const iconBtnStyle = { background: "none", border: "none", color: "#999", fontSize: 18, cursor: "pointer", padding: 4 };
function primaryBtnStyle(accent) {
  return { flex: 1, background: accent, color: "#000", border: "none", borderRadius: 10, padding: "14px 0", fontWeight: 700, fontSize: 15, cursor: "pointer" };
}
const secondaryBtnStyle = { background: "#2a2a2a", color: "#ccc", border: "none", borderRadius: 10, padding: "14px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer" };
function closeBtnStyle(accent) {
  return { background: accent, color: "#000", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" };
}





