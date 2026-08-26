import { useState, useEffect, useRef, useCallback } from "react";
import { ExerciseIllustration } from "./ExerciseIllustration";
import { AIFormCheck } from "./AIFormCheck";
import { Icon } from "./Icons";
import { usesExternalLoad, getExerciseRequirement } from "./exerciseMeta";
import { meetsRequirement } from "./assessment";

// No Supabase client here any more. This file used to insert straight into
// workout_logs with the anon key, which is public — it ships in this bundle —
// so anyone could file a workout under anyone's name. Logging now goes through
// /api/client-data, which takes the client id from the signed session token.
const clientToken = () => {
  try { return sessionStorage.getItem("pd_token") || ""; } catch { return ""; }
};

async function post(payload) {
  const r = await fetch("/api/client-data", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${clientToken()}` },
    body: JSON.stringify(payload),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "That didn't work.");
  return d;
}

const VIDEO_BASE = "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-videos";
const DEFAULT_VIDEO = "workout_all.mp4";

function getVideoForExercise(exName) {
  const l = (exName || "").toLowerCase();
  const M = [["side plank",null],["plank shoulder",null],["wall push",null],["incline push","incline_pushups.mp4.mp4"],["push-up","pushups.mp4.mp4"],["pushup","pushups.mp4.mp4"],["push up","pushups.mp4.mp4"],["plank","plank.mp4.mp4"],["mountain climber","mountain_climbers.mp4.mp4"],["bicycle crunch","bicycle_crunches.mp4.mp4"],["dead bug","dead_bug.mp4.mp4"],["bird dog","bird_dog.mp4.mp4"],["superman","superman_hold.mp4.mp4"],["glute bridge","glute_bridges.mp4.mp4"],["bodyweight squat","bodyweight_squats.mp4.mp4"],["air squat","bodyweight_squats.mp4.mp4"],["jumping jack","jumping_jacks.mp4.mp4"],["arm swing","arm_swings.mp4.mp4"],["leg swing","leg_swings.mp4.mp4"],["hip circle","hip_circles.mp4.mp4"],["hip flexor","hip_flexor_stretch.mp4.mp4"],["knee circle","knee_circles.mp4.mp4"],["neck rotation","neck_rotations.mp4.mp4"],["shoulder rotation","shoulder_rotations.mp4.mp4"],["torso rotation","torso_rotations.mp4.mp4"],["chest stretch","chest_stretch.mp4.mp4"],["shoulder stretch","shoulder_stretch.mp4.mp4"],["quad stretch","standing_quad_stretch.mp4.mp4"],["hamstring stretch","hamstring_stretch.mp4.mp4"],["child","childs_pose.mp4.mp4"],["light jog","light_jog_in_place.mp4.mp4"],["light walk","light_walk_in_place.mp4.mp4"]];
  for (const [k,v] of M) { if (l.includes(k)) return v; }
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
  // Time-based: "30 sec", "1 min", "30s", "hold"
  const minMatch = s.match(/(\d+)\s*min/);
  if (minMatch) return parseInt(minMatch[1], 10) * 60;
  const secMatch = s.match(/(\d+)\s*(sec|s)\b/);
  if (secMatch) return parseInt(secMatch[1], 10);
  if (s.includes("hold")) return 30;
  // Rep-based: TUT (Time Under Tension) ~3 sec per rep
  const repMatch = s.match(/(\d+)(?:\s*-\s*(\d+))?/);
  if (repMatch) {
    const lo = parseInt(repMatch[1], 10);
    const hi = repMatch[2] ? parseInt(repMatch[2], 10) : lo;
    const avgReps = Math.round((lo + hi) / 2);
    if (avgReps <= 5) return 20;
    if (avgReps <= 8) return 35;
    if (avgReps <= 12) return 50;
    if (avgReps <= 15) return 65;
    if (avgReps <= 20) return 80;
    return 90;
  }
  return 45;
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

// A system may define its own warm-up / cool-down. It MUST be able to: the shared
// warm-up opens with jogging and jumping jacks, which is unsafe in front of the
// senior, lower-back, shoulder and knee programmes. Only fall back to the shared
// arrays when a system has not specified its own.
function resolveWarmup(workoutSystem) {
  const w = workoutSystem && workoutSystem.warmup;
  return Array.isArray(w) && w.length ? w : WARMUP_EXERCISES;
}
function resolveCooldown(workoutSystem) {
  const c = workoutSystem && workoutSystem.cooldown;
  return Array.isArray(c) && c.length ? c : COOLDOWN_EXERCISES;
}

// `levels` are what this person was last measured able to do. Anything the
// assessment says they are not ready for is left out of the session.
//
// THE GUARD MATTERS AS MUCH AS THE FILTER. With no assessment on file, levels
// is null and NOTHING is filtered — the programme runs exactly as authored.
// Gating an unmeasured person would quietly strip every standing and floor
// movement out of their workout on the strength of a measurement nobody took.
//
// Warm-up and cool-down are never filtered: they are the supported, seated,
// gentle end of the library, and they are what a person who cannot yet do the
// main work most needs to keep doing.
function flattenWorkout(workoutSystem, dayFilter, levels) {
  if (!workoutSystem || !workoutSystem.days) return [];
  const gate = levels && Object.keys(levels).length
    ? (ex) => meetsRequirement(levels, getExerciseRequirement(ex.name))
    : () => true;

  const list = [];
  resolveWarmup(workoutSystem).forEach(ex => list.push({ dayName: "Warm-up", exercise: ex, prep: true }));
  const days = dayFilter
    ? workoutSystem.days.filter((d) => d.name === dayFilter)
    : workoutSystem.days;
  days.forEach((day) => {
    // A circuit is the whole list repeated, not each exercise repeated. The
    // rounds used to live only in the day's NAME — "Repeat 3-4 rounds" — so
    // the player ran the list once and called the session finished. Somebody
    // following it did a third of the programme they were given.
    //
    // Warm-up and cool-down stay outside the loop: they are done once.
    const rounds = Math.max(1, Math.min(10, Number(day.rounds) || 1));
    for (let round = 1; round <= rounds; round++) {
      (day.exercises || []).forEach((ex) => {
        if (!gate(ex)) return;
        // A descending ladder — 21-15-9 and the like — is one exercise whose
        // reps change every round. Without this the player would repeat the
        // first number three times, which is a different and much harder
        // workout than the one written down.
        const reps = Array.isArray(ex.repsByRound) && ex.repsByRound[round - 1] !== undefined
          ? String(ex.repsByRound[round - 1])
          : ex.reps;
        list.push({
          dayName: day.name,
          exercise: reps === ex.reps ? ex : { ...ex, reps },
          round, rounds,
        });
      });
    }
  });
  resolveCooldown(workoutSystem).forEach(ex => list.push({ dayName: "Cool-down", exercise: ex, prep: true }));
  return list;
}

// How many of the day's movements the assessment held back. Shown rather than
// hidden: a session that is quietly three exercises shorter looks like a bug,
// and the trainer should be able to see the gate working.
function countHeldBack(workoutSystem, dayFilter, levels) {
  if (!workoutSystem || !workoutSystem.days || !levels || !Object.keys(levels).length) return 0;
  const days = dayFilter ? workoutSystem.days.filter(d => d.name === dayFilter) : workoutSystem.days;
  let n = 0;
  for (const day of days) {
    // Counted once per movement, not once per round — "3 movements are not in
    // this session yet" is the useful sentence, not "9".
    for (const ex of day.exercises || []) {
      if (!meetsRequirement(levels, getExerciseRequirement(ex.name))) n++;
    }
  }
  return n;
}

// Rough MET-based calorie estimate for resistance training (~6 MET average)
function estimateCalories(durationMinutes, weightKg = 75) {
  const MET = 6;
  return Math.round(MET * weightKg * (durationMinutes / 60));
}

// ── Set logging ──────────────────────────────────────────────
//
// parseExerciseDurationSeconds above returns a number for rep-based work too
// (it estimates time under tension). This asks the narrower question: is the
// prescription itself a duration? A plank is logged in seconds; a bench press
// is logged in kilos and reps, and asking for the wrong pair is how a logging
// screen gets ignored.
function isTimedExercise(repsVal) {
  const s = String(repsVal || "").toLowerCase();
  return /\d+\s*(min|sec|s)\b/.test(s) || s.includes("hold");
}

// "8-12" -> { lo: 8, hi: 12 }.  "10" -> { lo: 10, hi: 10 }.
function parseRepRange(repsVal) {
  const m = String(repsVal || "").match(/(\d+)\s*(?:-\s*(\d+))?/);
  if (!m) return { lo: null, hi: null };
  const lo = parseInt(m[1], 10);
  const hi = m[2] ? parseInt(m[2], 10) : lo;
  return { lo, hi };
}

// Double progression, the plainest version of it: stay at a weight until you
// can complete every set at the TOP of the rep range, then add the smallest
// jump and start again at the bottom.
//
// Deliberately conservative. It suggests a number and pre-fills the box; the
// person lifting decides. Nothing here overrides how they actually feel.
const WEIGHT_STEP_KG = 2.5;

function suggestFromLast(lastEntry, repsVal) {
  const sets = lastEntry?.sets || [];
  if (!sets.length) return null;

  const { lo, hi } = parseRepRange(repsVal);
  const weights = sets.map(s => Number(s.weight_kg)).filter(n => Number.isFinite(n) && n > 0);
  const baseWeight = weights.length ? Math.max(...weights) : 0;

  const hitTop =
    hi != null &&
    sets.length > 1 &&
    sets.every(s => Number.isFinite(Number(s.reps_done)) && Number(s.reps_done) >= hi);

  if (hitTop && baseWeight > 0) {
    return { weight: +(baseWeight + WEIGHT_STEP_KG).toFixed(1), reps: lo ?? hi, progressed: true };
  }
  const lastReps = Number(sets[sets.length - 1].reps_done);
  return {
    weight: baseWeight || "",
    reps: Number.isFinite(lastReps) && lastReps > 0 ? lastReps : (lo ?? ""),
    progressed: false,
  };
}

// "42.5kg x 12, 12, 10", or "45s, 45s" for timed work.
//
// Decides by what is actually in the rows rather than by what the exercise is
// supposed to be, and returns null when there is nothing worth saying. An
// earlier version printed "Last time: 0, 0 reps" for a Wall Sit — a line that
// is worse than no line, because it looks like a record of failing.
function describeLast(lastEntry) {
  const sets = lastEntry?.sets || [];
  if (!sets.length) return null;

  const real = (v) => {
    const n = v === null || v === undefined ? NaN : Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const durations = sets.map(s => real(s.duration_sec)).filter(Boolean);
  const reps      = sets.map(s => real(s.reps_done)).filter(Boolean);
  const weights   = sets.map(s => real(s.weight_kg)).filter(Boolean);

  if (!reps.length) return durations.length ? durations.map(d => `${d}s`).join(", ") : null;

  const line = reps.join(", ");
  return weights.length ? `${Math.max(...weights)}kg x ${line}` : `${line} reps`;
}

export function WorkoutPlayer({
  workoutSystem,
  dayName = null,        // if provided, only play this day's exercises
  client = null,         // client object, used for logging + calorie estimate
  onClose,
  accentColor = "#8FB4EA",
}) {
  const levels = client?.capabilityLevels || client?.capability_levels || null;
  const queue = useRef(flattenWorkout(workoutSystem, dayName, levels)).current;
  const heldBack = useRef(countHeldBack(workoutSystem, dayName, levels)).current;
  const startTimeRef = useRef(Date.now());

  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(1);
  const [showAI, setShowAI] = useState(false);
  const aiRepsRef = useRef(0);
  const aiSetsRef = useRef(0);
    const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState("exercise"); // "exercise" | "rest" | "done"
  const [restRemaining, setRestRemaining] = useState(0);
  const [exerciseRemaining, setExerciseRemaining] = useState(null); // for duration-based exercises
  const [setStarted, setSetStarted] = useState(false);
  // A clip whose file is missing left a black rectangle the height of the
  // screen, indistinguishable from "still loading". If it fails to load we
  // drop it and show the illustration instead. Declared here with the other
  // hooks — below this component there are two early returns, and a hook
  // after one of them is a hook React stops counting.
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [motivation, setMotivation] = useState(null);
  useEffect(() => { setVideoFailed(false); setVideoReady(false); }, [exIdx]);
  const [elapsed, setElapsed] = useState(0); // overall stopwatch, seconds
  const [saving, setSaving] = useState(false);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const stopwatchRef = useRef(null);

  // ── Set logging state ──────────────────────────────────────
  // lastByExercise: what this person did the last time they trained each
  // movement. Fetched once when the player opens so the answer is already
  // there the moment a set ends — nobody waits for a spinner mid-workout.
  const [lastByExercise, setLastByExercise] = useState({});
  const [entry, setEntry] = useState({ weight: "", reps: "" });
  const [progressed, setProgressed] = useState(false);
  // Reps in reserve for the set just finished. Optional and one tap — asking
  // someone to type a number between sets is how a logging screen gets
  // ignored. Unlike the weight, it is cleared for every set: effort is not
  // carried over the way a load is.
  const [rir, setRir] = useState(null);
  // Bodyweight movements hide the weight box, but some people do load them —
  // a dumbbell on the hips for a glute bridge, ankle weights, a vest. This
  // lets them ask for the box back, per exercise.
  const [forceWeight, setForceWeight] = useState(false);
  const savedRef = useRef(new Set());       // "exIdx:setIdx" already written
  // "exIdx:setIdx" -> seconds actually held, filled in the moment a timed set
  // ends. A hold is written from here and never from the prescription.
  const heldRef = useRef(new Map());

  // The session row is created lazily, on the first set actually logged. Held
  // as a PROMISE, not an id: two sets saved in quick succession would
  // otherwise each start their own session.
  const sessionPromise = useRef(null);

  // `prep` is set where the queue is built. It used to be inferred by
  // comparing dayName to "🔥 Warm-up" — a display string, emoji and all,
  // load-bearing for whether a set gets written to the database.
  const isWarmupOrCooldown = (item) => !!item && item.prep === true;

  useEffect(() => {
    const names = [...new Set(
      queue.filter(q => !isWarmupOrCooldown(q)).map(q => q.exercise.name)
    )];
    if (!names.length || !client) return;
    let cancelled = false;
    post({ action: "sets.last", exercises: names })
      .then(d => { if (!cancelled) setLastByExercise(d.last || {}); })
      .catch(e => console.error("last sets:", e.message));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id]);
    // Pause/play video based on phase
    useEffect(() => {
      if (!videoRef.current) return;
      if (phase === "exercise" && setStarted && !isPaused) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }, [phase, setStarted, isPaused]);

  const current = queue[exIdx];
  const totalSets = current ? parseSets(current.exercise.sets) : 1;
    const restSeconds = current ? Math.max(parseRestSeconds(current.exercise.rest), 2) : 60;
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
    if (videoRef.current) {
      if (phase === "exercise" && setStarted) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
      setSetStarted(exIdx > 0 || setIdx > 1);
      const autoStart = exIdx > 0 || setIdx > 1;
      const d = current ? parseExerciseDurationSeconds(current.exercise.reps) : null;
      setExerciseRemaining(autoStart && d ? d : null);
  }, [exIdx, setIdx, phase]);

  // Start timer when user presses Start
  useEffect(() => {
    if (!setStarted || phase !== "exercise") return;
    const dur = current ? parseExerciseDurationSeconds(current.exercise.reps) : null;
    if (dur) setExerciseRemaining(dur);
    }, [setStarted, exIdx, setIdx, phase]);

  // Exercise duration countdown — auto-completes the set when it hits zero
  useEffect(() => {
      if (phase !== "exercise" || exerciseRemaining === null || isPaused) return;
    if (exerciseRemaining <= 0) {
      handleSetDone();
      return;
    }
    const t = setTimeout(() => setExerciseRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, exerciseRemaining, isPaused]);

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
      // client_id and client_name are NOT sent. The server fills both in from
      // the session token, so a workout can only ever be filed against the
      // person who is actually signed in.
      const totals = {
        exercises_completed: exercisesCompleted,
        total_exercises: queue.length,
        duration_minutes: Math.round(durationMinutes * 10) / 10,
        estimated_calories: calories,
      };

      // If any set was logged, a session row already exists — finish it rather
      // than writing a second one. If none was (a warm-up-only session, or
      // every exercise skipped) there is nothing to finish, so create the row
      // the way this always used to.
      if (sessionPromise.current) {
        const sessionId = await sessionPromise.current;
        await post({ action: "logs.finish", sessionId, ...totals });
      } else {
        await post({
          action: "logs.add",
          day_name: dayName || "Full Workout",
          workout_system_id: workoutSystem?.id || null,
          ...totals,
        });
      }
    } catch (e) {
      console.error("Failed to log workout:", e.message || e);
    }
    setSaving(false);
  }, [client, dayName, workoutSystem, queue.length, elapsed]);

  // Pre-fill when a NEW EXERCISE comes up — not on every set. Within an
  // exercise the boxes keep whatever was entered for the previous set, which
  // is almost always right and means most sets need no typing at all.
  useEffect(() => {
    setForceWeight(false);
    const item = queue[exIdx];
    if (!item || isWarmupOrCooldown(item)) { setProgressed(false); return; }
    const s = suggestFromLast(lastByExercise[item.exercise.name], item.exercise.reps);
    if (s) {
      setEntry({ weight: s.weight === "" ? "" : String(s.weight), reps: s.reps === "" ? "" : String(s.reps) });
      setProgressed(!!s.progressed);
    } else {
      const { lo } = parseRepRange(item.exercise.reps);
      setEntry({ weight: "", reps: lo != null ? String(lo) : "" });
      setProgressed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exIdx, lastByExercise]);

  // Effort is asked again for every set, so it starts blank for every set.
  useEffect(() => { setRir(null); }, [exIdx, setIdx]);

  // One session row per workout, created the first time a set is actually
  // logged. Kept as a promise so simultaneous saves share it.
  const getSessionId = useCallback(() => {
    if (!sessionPromise.current) {
      sessionPromise.current = post({
        action: "logs.start",
        day_name: dayName || "Full Workout",
        workout_system_id: workoutSystem?.id || null,
        total_exercises: queue.length,
      }).then(d => d.sessionId);
    }
    return sessionPromise.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayName, workoutSystem, queue.length]);

  // Called when a completed set is left behind. Fire-and-forget on purpose:
  // a slow network must never hold up the rest timer. A failed write is logged
  // and the workout carries on — losing one set is bad, stalling mid-workout
  // is worse.
  const saveCurrentSet = useCallback(() => {
    const item = queue[exIdx];
    if (!item || !client || isWarmupOrCooldown(item)) return;

    const key = `${exIdx}:${setIdx}`;
    if (savedRef.current.has(key)) return;

    // The stored set number has to be unique for this exercise across the
    // whole session, and a circuit brings the same exercise back every round.
    // Without the round in here, round 2 would upsert straight over round 1
    // (the table is unique on session + exercise + set_no) and a three-round
    // circuit would be recorded as one.
    const setsPerRound = parseSets(item.exercise.sets);
    const roundNo = Number(item.round) || 1;
    const setNo = (roundNo - 1) * setsPerRound + setIdx;

    const timed = isTimedExercise(item.exercise.reps);
    const weight = timed ? null : parseFloat(entry.weight);
    const reps = timed ? null : parseInt(entry.reps, 10);

    // How long the hold ACTUALLY lasted, put here by handleSetDone. What used
    // to be stored was the prescribed number — so a plank was recorded as 30
    // seconds whether it lasted 30 or 12, and a personal best could never
    // appear. If the timer never ran there is no honest number to write.
    const held = timed ? heldRef.current.get(key) : null;

    // Nothing worth recording for a weighted set with no numbers in it.
    if (!timed && !Number.isFinite(weight) && !Number.isFinite(reps)) return;
    if (timed && !Number.isFinite(held)) return;

    savedRef.current.add(key);

    getSessionId()
      .then(sessionId => post({
        action: "sets.add",
        sessionId,
        exercise_name: item.exercise.name,
        set_no: setNo,
        weight_kg: Number.isFinite(weight) ? weight : null,
        reps_done: Number.isFinite(reps) ? reps : null,
        duration_sec: timed ? held : null,
        rir: Number.isFinite(rir) ? rir : null,
        is_warmup: false,
      }))
      .catch(e => {
        savedRef.current.delete(key);
        console.error("save set:", e.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exIdx, setIdx, entry, rir, client, getSessionId]);

  const advanceAfterRest = useCallback(() => {
    saveCurrentSet();
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
  }, [setIdx, totalSets, exIdx, queue.length, logWorkout, saveCurrentSet]);

  const MOTIVATIONS = ["Good set.", "Keep going.", "That is the one.", "Strong.", "Logged."];
  const handleSetDone = () => {
    if (videoRef.current) videoRef.current.pause();

    // Read the clock BEFORE anything resets it. Moving to the rest phase
    // re-arms the countdown for the next set, so by the time the set is
    // written this number is gone — which is why it is kept in a ref rather
    // than read again later.
    {
      const item = queue[exIdx];
      if (item && isTimedExercise(item.exercise.reps)) {
        const prescribed = parseExerciseDurationSeconds(item.exercise.reps);
        const left = Number.isFinite(exerciseRemaining) ? Math.max(0, exerciseRemaining) : null;
        // left === null means the timer never started: nobody watched this
        // hold, so nothing is recorded for it.
        if (Number.isFinite(prescribed) && left !== null) {
          heldRef.current.set(`${exIdx}:${setIdx}`, Math.max(0, prescribed - left));
        }
      }
    }

    setSetStarted(false);
    const msg = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
    setMotivation(msg);
    setTimeout(() => setMotivation(null), 1500);
    const isLastSetOfLastExercise = setIdx >= totalSets && exIdx >= queue.length - 1;
    if (isLastSetOfLastExercise) {
      // The final set goes straight to the done screen and never passes
      // through advanceAfterRest, so it has to be saved here or it is lost.
      saveCurrentSet();
      logWorkout(queue.length);
      setTimeout(() => setPhase("done"), 1500);
      return;
    }
    setTimeout(() => { setRestRemaining(restSeconds); setPhase("rest"); }, 1500);
  };

  const handleSkipRest = () => {
    clearTimeout(timerRef.current);
    advanceAfterRest();
  };

  const handleSkipExercise = () => {
    clearTimeout(timerRef.current);
    // Being on the rest screen means the previous set was finished. Whichever
    // way someone leaves from there, that set is real and must be kept.
    if (phase === "rest") saveCurrentSet();
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
    // Same here, and this is the one that actually bites: people stop training
    // right AFTER a hard set, with the numbers still on screen.
    if (phase === "rest") saveCurrentSet();
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
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><div style={{ width: 60, height: 60, borderRadius: 20, background: "#1B3350", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon n="check" s={28} c="#4FBF97" /></div></div>
          <h2 style={{ color: "#fff", margin: "0 0 8px" }}>Workout Complete!</h2>
          <p style={{ color: "#A9BBD2", marginBottom: 4 }}>{queue.length} exercises &middot; {fmtClock(elapsed)} min</p>
          <p style={{ color: accentColor, fontWeight: 700, marginBottom: heldBack ? 12 : 20 }}>≈ {calories} kcal burned</p>
          {heldBack > 0 && (
            <p style={{ color: "#8FA3BE", fontSize: 12, marginBottom: 18, lineHeight: 1.6 }}>
              {heldBack} {heldBack === 1 ? "movement is" : "movements are"} not in this session yet —
              they open up at the next assessment.
            </p>
          )}
          {saving && <p style={{ color: "#7E93B0", fontSize: 12, marginBottom: 10 }}>Saving...</p>}
          <button onClick={onClose} style={closeBtnStyle(accentColor)}>Finish</button>
        </div>
      </div>
    );
  }

  const loggable = !isWarmupOrCooldown(current) && !isTimedExercise(current.exercise.reps) && !!client;
  const showLogger = phase === "rest" && loggable;
  // A weight box in front of a Glute Bridge is noise, and noise is what stops
  // people logging at all. Show it only where there is a load to record —
  // unless this person has said there is one.
  const showWeight = forceWeight || usesExternalLoad(current.exercise.name);
  const lastLine = isWarmupOrCooldown(current) ? null : describeLast(lastByExercise[current.exercise.name]);

  const videoFile = getVideoForExercise(current.exercise.name);
  const videoSrc = videoFile && !videoFailed ? `${VIDEO_BASE}/${videoFile}` : null;
  const progressPct = Math.round(((exIdx + (setIdx - 1) / totalSets) / queue.length) * 100);
  if (showAI) return (<AIFormCheck onClose={() => setShowAI(false)} exerciseName={current?.exercise?.name} targetReps={current?.exercise?.reps} clientName={client?.name} onRepsComplete={(n) => { aiRepsRef.current += (n||0); aiSetsRef.current += 1; setShowAI(false); handleSetDone(); }} />);

  return (
    <div className="night" style={overlayStyle}>
      <div style={playerCardStyle}>
        {/* At 390px this wrapped onto two lines and shoved the clock around.
            The label truncates; the controls never move. */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "14px 16px" }}>
          <span style={{ color: "#8FA3BE", fontSize: 12.5, fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {current.rounds > 1 && <span style={{ color: accentColor }}>Round {current.round}/{current.rounds} &middot; </span>}
            {current.dayName} &middot; Exercise {exIdx + 1}/{queue.length}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ color: accentColor, fontSize: 13, fontWeight: 600, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontVariantNumeric: "tabular-nums" }}>
              {fmtClock(elapsed)}
            </span>
              {setStarted && phase === "exercise" && (
                <button onClick={() => setIsPaused(p => !p)} aria-label={isPaused ? "Resume" : "Pause"} style={{ background:"#1B3350",border:"1px solid #24405F",borderRadius:10,color:"#FCFCFD",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><Icon n={isPaused ? "play" : "pause"} s={14} c="#FCFCFD" w={2} /></button>
              )}
            <button onClick={() => setShowAI(true)} aria-label="Form check" title="Form check" style={{ background:"rgba(143,180,234,0.14)",border:"1px solid #24405F",borderRadius:10,color:"#8FB4EA",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><Icon n="ai" s={15} c="#8FB4EA" /></button>
            <button onClick={handleEndEarly} style={{ ...iconBtnStyle, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1px solid #24405F" }} aria-label="End workout"><Icon n="close" s={15} c="#8FA3BE" w={2} /></button>
          </div>
        </div>

        <div style={{ height: 4, background: "#24405F", margin: "0 18px", borderRadius: 2 }}>
          <div style={{ height: 4, width: `${progressPct}%`, background: accentColor, borderRadius: 2, transition: "width .3s" }} />
        </div>

          <div style={{ position: "relative", width: "100%", flex: 1, background: "#0A1727", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {phase === "exercise" && videoSrc && (
            <>
              <video
                key={videoSrc}
                ref={videoRef}
                src={videoSrc}
                preload="auto"
                style={{ width: "100%", height: "100%", objectFit: "contain", background: "#0A1727", pointerEvents: "none", display: "block" }}
                loop muted playsInline autoPlay
                onError={() => setVideoFailed(true)}
                onLoadedData={() => setVideoReady(true)}
              />
              {/* The clips are 1–3 MB and sit on object storage. Until one has
                  a frame to show, a <video> paints nothing — which on a phone
                  meant a black screen the height of the display, with no way
                  to tell it from a broken app. The illustration holds the
                  space, and the spinner says which of the two it is. */}
              {!videoReady && (
                <div style={{ position: "absolute", inset: 0, background: "#152B45", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "#8FA3BE", padding: 16 }}>
                  <ExerciseIllustration exerciseId={current.exercise.name} size={150} />
                  <div className="sp" style={{ width: 22, height: 22, borderWidth: 2 }} />
                </div>
              )}
              {exerciseRemaining !== null && (
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  background: exerciseRemaining <= 5 ? "rgba(220,38,38,0.9)" : exerciseRemaining <= 10 ? "rgba(234,88,12,0.85)" : "rgba(0,0,0,0.75)",
                  color: exerciseRemaining <= 10 ? "#fff" : accentColor,
                  fontFamily: "monospace", fontWeight: 800, fontSize: 22,
                  padding: "6px 14px", borderRadius: 8,
                  animation: exerciseRemaining <= 5 ? "pulse 0.5s infinite" : "none",
                }}>
                  {exerciseRemaining}s
                </div>
              )}
            </>
          )}
          {phase === "exercise" && !videoSrc && (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1B3350", padding: 8, position: "relative" }}>
              <ExerciseIllustration exerciseId={current.exercise.name} size={180} />
              {exerciseRemaining !== null && (
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  background: exerciseRemaining <= 5 ? "rgba(220,38,38,0.9)" : exerciseRemaining <= 10 ? "rgba(234,88,12,0.85)" : "rgba(0,0,0,0.75)",
                  color: exerciseRemaining <= 10 ? "#fff" : accentColor,
                  fontFamily: "monospace", fontWeight: 800, fontSize: 22,
                  padding: "6px 14px", borderRadius: 8,
                  animation: exerciseRemaining <= 5 ? "pulse 0.5s infinite" : "none",
                }}>
                  {exerciseRemaining}s
                </div>
              )}
            </div>
          )}
          {phase === "rest" && (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0E2035", padding: 16 }}>
              <div style={{ fontSize: 13, color: "#8FA3BE", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>REST</div>
              <div className="sf" style={{ fontSize: 64, lineHeight: 1, color: accentColor, marginBottom: showLogger ? 20 : 0, letterSpacing: "-.02em" }}>{restRemaining}s</div>

              {/* Logging the set happens HERE, while resting — the set is
                  fresh, the hands are free, and nothing is being interrupted.
                  The boxes are already filled in with what the suggestion says,
                  so the common case is to touch nothing at all: whatever is on
                  screen is saved when the rest ends. */}
              {showLogger && (
                <div style={{ width: "100%", maxWidth: 320 }}>
                  <div style={{ fontSize: 11, color: "#7E93B0", textAlign: "center", marginBottom: 8, letterSpacing: 1 }}>
                    SET {setIdx} - ADJUST IF IT WAS DIFFERENT
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {showWeight && (
                      <NumField
                        label="WEIGHT (KG)" value={entry.weight} step={2.5} accent={accentColor}
                        onChange={(v) => setEntry(e => ({ ...e, weight: v }))}
                      />
                    )}
                    <NumField
                      label="REPS" value={entry.reps} step={1} accent={accentColor}
                      onChange={(v) => setEntry(e => ({ ...e, reps: v }))}
                    />
                  </div>
                  {!showWeight && (
                    <button
                      type="button"
                      onClick={() => setForceWeight(true)}
                      style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: "#7E93B0", fontSize: 11, cursor: "pointer", textDecoration: "underline" }}
                    >
                      + add weight
                    </button>
                  )}
                  {/* Reps in reserve, asked in words rather than jargon. Four
                      taps, all optional — a set with no answer here is still a
                      set, and pretending otherwise would cost the logging. */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 10, color: "#7E93B0", textAlign: "center", marginBottom: 6, letterSpacing: 1 }}>
                      HOW MANY MORE COULD YOU HAVE DONE?
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[
                        { v: 3, label: "3+" },
                        { v: 2, label: "2" },
                        { v: 1, label: "1" },
                        { v: 0, label: "None" },
                      ].map((o) => {
                        const on = rir === o.v;
                        return (
                          <button key={o.v} type="button"
                            onClick={() => setRir(on ? null : o.v)}
                            style={{
                              flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
                              fontSize: 12, fontWeight: 700,
                              background: on ? accentColor : "#1B3350",
                              color: on ? "#0E2035" : "#8FA3BE",
                              border: `1px solid ${on ? accentColor : "#24405F"}`,
                            }}>{o.label}</button>
                        );
                      })}
                    </div>
                  </div>
                  {progressed && (
                    <div style={{ marginTop: 10, textAlign: "center", fontSize: 11, color: "#4FBF97", fontWeight: 700 }}>
                      You hit the top of the range last time - this is a step up
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: "18px 18px 0" }}>
          <h2 style={{ color: "#fff", margin: "0 0 6px", fontSize: 20 }}>{current.exercise.name}</h2>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <Pill label={`Set ${setIdx}/${totalSets}`} />
            <Pill label={`Reps: ${current.exercise.reps}`} />
            <Pill label={`Rest: ${current.exercise.rest}`} />
          </div>
          {/* The one line that turns a workout list into training: what this
              person actually did the last time they stood here. */}
          {lastLine && (
            <div style={{ marginTop: -6, marginBottom: 14, fontSize: 12, color: "#8FA3BE" }}>
              Last time: <span style={{ color: "#C8D6EA", fontWeight: 700 }}>{lastLine}</span>
            </div>
          )}
        </div>

        {motivation && (
          <div style={{ margin: "0 18px 8px", background: "#12795A", color: "#FCFCFD", borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 18, fontWeight: 800 }}>
            {motivation}
          </div>
        )}
        <div style={{ padding: "0 18px 20px", display: "flex", gap: 10, flexWrap: "wrap" }}>
          {phase === "exercise" ? (
            !setStarted ? (
              <button onClick={() => setSetStarted(true)} style={{ ...primaryBtnStyle(accentColor), fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                <Icon n="play" s={15} c="#0E2035" /> Start set {setIdx}
              </button>
            ) : (
              <button onClick={handleSetDone} style={primaryBtnStyle(accentColor)}>
                {exerciseRemaining !== null ? "Finish early" : `Set ${setIdx} done`}
              </button>
            )
          ) : (
            <button onClick={handleSkipRest} style={primaryBtnStyle(accentColor)}>⏭ Skip Rest</button>
          )}
          <button onClick={handleSkipExercise} style={secondaryBtnStyle}>Skip</button>
        </div>
      </div>
    </div>
  );
}

// A number box with big +/- buttons either side. Thumbs, not keyboards: this
// is used mid-workout, one-handed, often with chalk on your hands.
function NumField({ label, value, step, accent, onChange }) {
  const bump = (dir) => {
    const n = parseFloat(value);
    const base = Number.isFinite(n) ? n : 0;
    const next = Math.max(0, +(base + dir * step).toFixed(2));
    onChange(String(next));
  };
  const btn = {
    width: 40, height: 44, flexShrink: 0, borderRadius: 8, cursor: "pointer",
    background: "#1B3350", border: "1px solid #24405F",
    color: "#fff", fontSize: 20, fontWeight: 700, lineHeight: 1,
  };
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 9, color: "#7E93B0", letterSpacing: 1.2, textAlign: "center", marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", gap: 5 }}>
        <button type="button" onClick={() => bump(-1)} style={btn}>-</button>
        <input
          type="number" inputMode="decimal" value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1, minWidth: 0, height: 44, textAlign: "center", borderRadius: 8,
            background: "#0E2035", border: `1px solid ${accent}55`,
            color: "#fff", fontSize: 19, fontWeight: 800,
          }}
        />
        <button type="button" onClick={() => bump(1)} style={btn}>+</button>
      </div>
    </div>
  );
}

// Three pills in three colours, one of them a saturated green, over a dark
// field: there is nothing to rank between them, and the green read as a
// state rather than a fact. One style, three facts.
function Pill({ label }) {
  return (
    <span style={{ background: "#1B3350", border: "1px solid #24405F", color: "#C8D6EA", fontSize: 12, fontWeight: 500, padding: "5px 11px", borderRadius: 20, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

const overlayStyle = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.92)", zIndex: 9999,
  display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
};
const cardStyle = { background: "#152B45", borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 360 };
const playerCardStyle = { background: "#152B45", borderRadius: 0, width: "100%", maxWidth: "100%", height: "100vh", maxHeight: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" };
const iconBtnStyle = { background: "none", border: "none", color: "#8FA3BE", fontSize: 18, cursor: "pointer", padding: 4 };
function primaryBtnStyle(accent) {
  return { flex: 1, background: accent, color: "#0E2035", border: "none", borderRadius: 10, padding: "14px 0", fontWeight: 700, fontSize: 15, cursor: "pointer" };
}
const secondaryBtnStyle = { background: "#24405F", color: "#C8D6EA", border: "none", borderRadius: 10, padding: "14px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer" };
function closeBtnStyle(accent) {
  return { background: accent, color: "#0E2035", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" };
}










