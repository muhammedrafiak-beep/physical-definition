// Functional assessment — what a person can actually do, measured before any
// programme is chosen.
//
// WHY THIS EXISTS
// The assignment engine picks a programme from age, experience, equipment and
// days. Age is a proxy, and a poor one: two eighty-year-olds are not the same
// person. One walks to the shop; the other needs both hands on a chair to
// stand up. Handing them the same programme is guessing.
//
// So the order is: assess first, then build the workout out of the movements
// the person can actually perform. Re-assess, the levels move, the programme
// moves with them.
//
// TWO KINDS OF THING LIVE HERE
//   CAPABILITIES — graded levels (L0..L4). Not pass/fail: "with support" and
//                  "without support" are different rungs of the same ladder,
//                  which is how a trainer actually thinks about it.
//   TESTS        — numbers, re-measured over time. These are the published
//                  instruments, with their protocols, because a number
//                  collected a different way is not comparable to the norms.
//
// ADDING MORE
// Both lists are data. A new test is a new entry, not a new screen. Rafi has
// more tests he uses; they slot in here as the need for them comes up.

// ── Graded capabilities ──────────────────────────────────────
//
// `unlocks` is the point of the whole file: an exercise may only appear in a
// programme if the person meets its level. See exerciseMeta.js.

export const CAPABILITIES = [
  {
    id: "sit_to_stand",
    name: "Sit to stand",
    why: "Getting out of a chair, a bed, a car. The single most load-bearing movement in an independent life.",
    levels: [
      { level: 0, label: "Needs another person" },
      { level: 1, label: "Pushes off the chair with hands" },
      { level: 2, label: "Hands on thighs" },
      { level: 3, label: "Arms crossed on chest, no hands" },
      { level: 4, label: "No hands, stands fast and lowers slowly" },
    ],
    note: "Level 4 is power, not strength. Above about 70, how FAST someone can stand predicts function better than how much they can lift.",
  },
  {
    id: "single_leg",
    name: "Single leg stand",
    why: "Every step is a moment on one leg. This is the most direct measure of whether a person can catch themselves.",
    levels: [
      { level: 0, label: "Cannot" },
      { level: 1, label: "Both hands supported" },
      { level: 2, label: "Fingertip support only" },
      { level: 3, label: "Unsupported, eyes open" },
      { level: 4, label: "Unsupported, eyes closed" },
    ],
    note: "Record each side. A large difference between sides matters as much as the number itself.",
  },
  {
    id: "tandem",
    name: "Tandem stance (heel to toe, one line)",
    why: "Narrows the base of support. Level 3 removes vision, which is what a dark hallway does.",
    levels: [
      { level: 0, label: "Cannot hold the position" },
      { level: 1, label: "Holds it, eyes open, with support" },
      { level: 2, label: "Holds it, eyes open, no support" },
      { level: 3, label: "Holds it, EYES CLOSED (sharpened Romberg)" },
      { level: 4, label: "Walks it — heel to toe, moving" },
    ],
    note: "Closing the eyes takes vision away and leaves the inner ear and proprioception to do the work alone. Falls happen at night, on the way to the bathroom; this is the level that speaks to that.",
  },
  {
    id: "gait",
    name: "Walking",
    why: "Walking speed has been called the sixth vital sign. How far and how unaided is the headline number of independence.",
    levels: [
      { level: 0, label: "Cannot walk without a person helping" },
      { level: 1, label: "Walks with a frame or stick" },
      { level: 2, label: "Walks unsupported, short distances indoors" },
      { level: 3, label: "Walks unsupported, 6 minutes or more" },
      { level: 4, label: "Walks outdoors, uneven ground, kerbs" },
    ],
  },
  {
    id: "floor_transfer",
    name: "Getting to the floor and back up",
    why: "Gates every floor exercise. It is also the thing that decides whether a fall means a bruise or six hours on the floor waiting for someone.",
    levels: [
      { level: 0, label: "Cannot get to the floor" },
      { level: 1, label: "Gets down and up using furniture or a hand" },
      { level: 2, label: "Gets down and up unaided" },
    ],
  },
  {
    id: "overhead",
    name: "Reaching overhead",
    why: "Dressing, a shelf, a seatbelt. Losing this costs independence quietly, long before anyone calls it a problem.",
    levels: [
      { level: 0, label: "Cannot raise arms to shoulder height" },
      { level: 1, label: "To shoulder height only" },
      { level: 2, label: "Overhead, but with pain or compensation" },
      { level: 3, label: "Full overhead, no pain" },
    ],
  },
];

// ── Measured tests ───────────────────────────────────────────
//
// The protocol field is not decoration. A chair-stand count taken from a
// kitchen stool with hands pushing off is not the same measurement as the one
// the published norms describe, and comparing it to them is meaningless.

export const TESTS = [
  {
    id: "chair_stand_30s",
    name: "30-second chair stand",
    unit: "stands in 30 s",
    measures: "Lower-body strength and power",
    protocol: [
      "Chair with a back, seat about 43 cm (17 in) high, placed against a wall so it cannot slide.",
      "Arms crossed at the wrists and held against the chest.",
      "Count full stands completed in 30 seconds.",
    ],
    source: "Rikli & Jones (1999), Senior Fitness Test",
    // The arms-crossed requirement IS sit_to_stand level 3. Below that the
    // test cannot be administered as published — record the level instead and
    // leave this blank rather than writing down a number that means nothing.
    requires: { sit_to_stand: 3 },
    higherIsBetter: true,
  },
  {
    id: "single_leg_hold",
    name: "Single leg hold",
    unit: "seconds (record each side)",
    measures: "Static balance",
    protocol: [
      "Record at the highest level the person can manage, and note which level that was.",
      "Stop the clock when the raised foot touches down or the hands grab support.",
      "Both sides. The difference between them is information.",
    ],
    source: "Standard clinical balance measure",
    higherIsBetter: true,
  },
  {
    id: "tandem_hold",
    name: "Tandem stance hold",
    unit: "seconds",
    measures: "Balance with a narrowed base; eyes closed adds the vestibular and proprioceptive demand",
    protocol: [
      "Heel directly in front of toe, both feet on one line.",
      "Record the level used — eyes open or eyes closed, supported or not.",
      "Have a wall or chair within reach on every attempt, at every level.",
    ],
    source: "Romberg / sharpened Romberg",
    higherIsBetter: true,
  },
  {
    id: "tandem_walk_steps",
    name: "Tandem walk",
    unit: "steps before stepping off the line",
    measures: "Dynamic balance — the kind that actually prevents falls",
    protocol: ["Heel to toe along a line, beside a wall.", "Count steps until the line is broken."],
    higherIsBetter: true,
  },
];

// ── Norms ────────────────────────────────────────────────────
//
// 25th–75th percentile for moderately active older adults (Rikli & Jones
// 1999). Below the range is below average FOR THAT AGE — which is a reason to
// train, not a diagnosis, and should never be shown to a client as one.

const CHAIR_STAND_NORMS = {
  male:   [[60,64,14,19],[65,69,12,18],[70,74,12,17],[75,79,11,17],[80,84,10,15],[85,89,8,14],[90,94,7,12]],
  female: [[60,64,12,17],[65,69,11,16],[70,74,10,15],[75,79,10,15],[80,84,9,14],[85,89,8,13],[90,94,4,11]],
};

export function chairStandNorm(age, gender) {
  const table = CHAIR_STAND_NORMS[String(gender || "").toLowerCase() === "female" ? "female" : "male"];
  const row = table.find(([lo, hi]) => age >= lo && age <= hi);
  return row ? { low: row[2], high: row[3] } : null;
}

// "10-15 for his age" / "below average for his age". Deliberately plain: no
// score, no grade, no traffic light. A number with a label attached to it is
// how a measurement turns into a verdict about a person.
export function describeChairStand(count, age, gender) {
  const norm = chairStandNorm(age, gender);
  if (!Number.isFinite(count) || !norm) return null;
  if (count < norm.low)  return { text: `below the ${norm.low}–${norm.high} range for this age`, below: true };
  if (count > norm.high) return { text: `above the ${norm.low}–${norm.high} range for this age`, below: false };
  return { text: `within the ${norm.low}–${norm.high} range for this age`, below: false };
}

// ── Matching exercises to a person ───────────────────────────

// levels: { sit_to_stand: 2, single_leg: 1, ... }
// requires: { sit_to_stand: 3 }  — every entry must be met.
export function meetsRequirement(levels, requires) {
  if (!requires) return true;                     // no requirement — always allowed
  for (const [id, needed] of Object.entries(requires)) {
    const have = levels?.[id];
    if (!Number.isFinite(have) || have < needed) return false;
  }
  return true;
}

// What is stopping this exercise being used — so the trainer sees the reason,
// not just an absence.
export function blockedBy(levels, requires) {
  if (!requires) return [];
  return Object.entries(requires)
    .filter(([id, needed]) => !Number.isFinite(levels?.[id]) || levels[id] < needed)
    .map(([id, needed]) => {
      const cap = CAPABILITIES.find(c => c.id === id);
      const have = levels?.[id];
      return {
        id,
        name: cap?.name || id,
        needed,
        have: Number.isFinite(have) ? have : null,
        neededLabel: cap?.levels?.[needed]?.label || `level ${needed}`,
      };
    });
}

// ── Physical age ─────────────────────────────────────────────
//
// The norm table read backwards. If a man of 80 completes 17 chair stands, 17
// sits inside the range published for men of 60-64 — so on THIS measure he
// performs like a man twenty years younger. That is not a metaphor and not
// flattery; it is the same table, read from the other end.
//
// The honesty this needs is in the scoping. One test measures one thing.
// A chair stand says something about lower-body strength and power and
// nothing whatever about a heart, a memory or a life expectancy. So the
// wording names the test every time and never generalises to the person:
// "his chair stand is typical of men 65-69", never "his body is 67".
//
// Longevity is the hope behind all of this and it cannot be promised. Nothing
// in this app should ever imply otherwise.

export function chairStandAgeEquivalent(count, gender) {
  if (!Number.isFinite(count)) return null;
  const key = String(gender || "").toLowerCase() === "female" ? "female" : "male";
  const table = CHAIR_STAND_NORMS[key];

  // Youngest band whose range this score at least reaches.
  const band = table.find(([, , low]) => count >= low);
  if (!band) {
    const [lo, hi] = table[table.length - 1];
    return { from: lo, to: hi, below: true, text: `below the published range even for ${lo}-${hi}` };
  }
  const [lo, hi] = band;
  const youngest = table[0];
  if (band === youngest) {
    return { from: lo, to: hi, below: false, text: `at or above the range for ${lo}-${hi}, the youngest band published` };
  }
  return { from: lo, to: hi, below: false, text: `in the range published for ages ${lo}-${hi}` };
}

export const CAPABILITY_BY_ID = Object.fromEntries(CAPABILITIES.map(c => [c.id, c]));
export const TEST_BY_ID = Object.fromEntries(TESTS.map(t => [t.id, t]));
