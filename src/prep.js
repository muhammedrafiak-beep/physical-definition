// What to warm up, decided by what the session actually trains.
//
// Before this, every one of the ten general systems fell through to the same
// fourteen-item list: wrist circles before leg day, knee circles before chest
// day, and a two-minute jog in front of all of it. Fourteen items is also
// long enough that people skip the warm-up entirely, which is the worst
// outcome of the three.
//
// So the warm-up is now BUILT from the day in front of the person. The day's
// exercises carry muscle tags in EXERCISE_META; those tags map to a handful of
// body regions; each region owns one or two drills. A push day gets shoulders,
// chest and arms. A leg day gets hips, knees and ankles. Nothing else appears.
//
// The four clinical systems are untouched: senior75, lowback, shoulder and
// kneefriendly each author their own warm-up and cool-down, and those were
// written around a limitation. An authored list always wins - see
// resolveWarmup in WorkoutPlayer.jsx.

import { EXERCISE_META } from "./exerciseMeta";

// ── tags → regions ─────────────────────────────────────────
// Head to toe. The order of this object is the order the drills come out in,
// which is the order a person would warm themselves up in anyway.
const REGION_OF = {
  Traps: "neck",
  Delts: "shoulder", "Front Delts": "shoulder", "Side Delts": "shoulder",
  "Rear Delts": "shoulder", "Rotator Cuff": "shoulder",
  Chest: "chest", "Upper Chest": "chest",
  Biceps: "arms", Triceps: "arms", Forearms: "arms",
  Lats: "back", "Mid Back": "back", "Lower Back": "back",
  Core: "core", Obliques: "core", Stabilizers: "core",
  Glutes: "hips", "Hip Flexors": "hips", "Hip Abductors": "hips", Adductors: "hips",
  Quads: "legs", Hamstrings: "legs",
  Calves: "calves", Ankles: "calves",
  // Mobility, Balance, Cardio, Recovery and Full Body describe how an exercise
  // is done rather than what it loads. They name no region and add no drill.
};

const ORDER = ["neck", "shoulder", "chest", "arms", "back", "core", "hips", "legs", "calves"];

const secs = (name, s) => ({ name, sets: 1, reps: `${s} sec`, rest: "0s" });

// One or two drills per region. Every name here exists in the library, so the
// player and the printed plan both find a picture for it.
const WARM = {
  neck:     [secs("Neck Rotations", 30)],
  shoulder: [secs("Shoulder Rotations", 30), secs("Arm Swings", 30)],
  chest:    [secs("Arm Swings", 30)],
  arms:     [secs("Elbow Circles", 30), secs("Wrist Circles", 30)],
  back:     [secs("Cat-Cow Stretch", 30), secs("Torso Rotations", 30)],
  core:     [secs("Torso Rotations", 30)],
  hips:     [secs("Hip Circles", 30), secs("Leg Swings", 30)],
  legs:     [secs("Knee Circles", 30), { name: "Bodyweight Squat", sets: 1, reps: "10", rest: "15s" }],
  calves:   [secs("Ankle Rotations", 30)],
};

const held = (name, s) => ({ name, sets: 1, reps: `${s} sec`, rest: "10s" });

const STRETCH = {
  neck:     [held("Upper Trap Stretch", 30)],
  shoulder: [held("Cross-body Shoulder Stretch", 30)],
  chest:    [held("Doorway Chest Stretch", 30)],
  arms:     [held("Shoulder Stretch", 30)],
  back:     [held("Childs Pose", 45)],
  core:     [held("Cat-Cow Stretch", 30)],
  hips:     [held("Hip Flexor Stretch", 30)],
  legs:     [held("Standing Quad Stretch", 30), held("Hamstring Stretch", 30)],
  calves:   [held("Calf Stretch (wall)", 30)],
};

// The pulse raiser and the finish. A warm-up with no rise in temperature is a
// mobility routine, and a cool-down with no breathing is just more stretching.
const RAISE  = { name: "Light Jog in Place", sets: 1, reps: "2 min", rest: "0s" };
const SETTLE = { name: "Deep Breathing", sets: 1, reps: "60 sec", rest: "0s" };
const WALK   = { name: "Light Walk in Place", sets: 1, reps: "60 sec", rest: "0s" };

// Long enough to do the job, short enough that nobody skips it.
const MAX_WARM = 7;
const MAX_COOL = 7;

function regionsIn(days) {
  const found = new Set();
  for (const day of days || []) {
    for (const ex of day.exercises || []) {
      const meta = EXERCISE_META[ex.name];
      if (!meta) continue;
      for (const tag of [...(meta.p || []), ...(meta.s || [])]) {
        const region = REGION_OF[tag];
        if (region) found.add(region);
      }
    }
  }
  return found;
}

function build(days, table, lead, tail, max) {
  const found = regionsIn(days);
  // Nothing recognised - an all-Cardio day, or a day of names not yet in
  // EXERCISE_META. Warming up the whole body is the safe answer, not warming
  // up nothing.
  const regions = found.size ? ORDER.filter(r => found.has(r)) : ORDER;

  const out = [lead];
  const seen = new Set([lead.name]);
  // One pass per rank so that with many regions every region still gets its
  // first drill before any region gets its second.
  for (let rank = 0; rank < 2; rank++) {
    for (const r of regions) {
      const item = (table[r] || [])[rank];
      if (!item || seen.has(item.name)) continue;
      seen.add(item.name);
      out.push(item);
      if (out.length >= max) return tail ? [...out, tail] : out;
    }
  }
  return tail ? [...out, tail] : out;
}

export function warmupFor(days) {
  return build(days, WARM, RAISE, null, MAX_WARM);
}

export function cooldownFor(days) {
  return build(days, STRETCH, WALK, SETTLE, MAX_COOL - 1);
}
