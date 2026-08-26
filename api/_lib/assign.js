// Picks a training system from a client's intake answers — and from an
// assessment, when there is one.
//
// A pure function on purpose: no database, no network, no React. It can be
// read, argued with, and tested on its own — which matters, because these are
// coaching decisions, not code decisions.
//
// THE ORDER OF AUTHORITY, HIGHEST FIRST
//   1. PAR-Q          — a red flag is never cleared by a good measurement.
//   2. What was measured — capability levels from an assessment.
//   3. Age            — an estimate, used where nothing has been measured, or
//                       where the measurement agrees with it.
//   4. Everything else — equipment, experience, days.
//
// Age sits BELOW measurement on purpose. Two eighty-year-olds are not the same
// person: one walks to the shop, the other needs both hands on a chair to
// stand up. Where somebody has actually been watched doing the movements,
// that is the better information and it is used instead.
//
// What this must never become is a promise. An assessment says what a person
// could do on a day, on those tests. It is not a statement about a heart, and
// nothing here should imply anything about how long anybody will live.

// PAR-Q+ red flags. Any one of these means no automatic programme at all.
export const PARQ_QUESTIONS = [
  { id: "heart",     q: "Has a doctor ever said you have a heart condition, or that you should only do physical activity supervised by a doctor?" },
  { id: "chestPain", q: "Do you feel pain in your chest when you do physical activity, or in the last month while at rest?" },
  { id: "dizzy",     q: "Do you lose balance from dizziness, or have you lost consciousness in the last 12 months?" },
  { id: "bonejoint", q: "Do you have a bone or joint problem that could be made worse by exercise?" },
  { id: "bp",        q: "Are you taking medication for blood pressure or a heart condition?" },
  { id: "pregnancy", q: "Are you pregnant, or have you given birth in the last 6 months?" },
  { id: "surgery",   q: "Have you had surgery in the last 6 months?" },
  { id: "other",     q: "Is there any other reason you should not do physical activity?" },
];

// ── Reading an assessment ────────────────────────────────────
//
// The rungs referred to here are the ladders in src/assessment.js. The labels
// are written out rather than left as bare numbers so that a change over there
// is visible as a contradiction here rather than as silence.
//
// THE TWO LISTS ARE NOT SYMMETRICAL, AND THAT IS DELIBERATE.
// One recorded rung is enough to move somebody onto the supported programme.
// Moving somebody OFF it needs every one of the four to have been recorded and
// met. An incomplete assessment can therefore make the choice safer and can
// never make it bolder.

const NEEDS_SUPPORT = [
  { id: "sit_to_stand", atOrBelow: 1, says: "cannot stand from a chair without pushing off with the hands" },
  { id: "gait",         atOrBelow: 1, says: "cannot walk without a frame, a stick or a person" },
  { id: "single_leg",   atOrBelow: 1, says: "cannot stand on one leg without holding on with both hands" },
];

const ROBUST = [
  { id: "sit_to_stand",   atLeast: 3, says: "stands from a chair with arms crossed, no hands" },
  { id: "single_leg",     atLeast: 3, says: "stands on one leg unsupported" },
  { id: "gait",           atLeast: 3, says: "walks unsupported for six minutes or more" },
  { id: "floor_transfer", atLeast: 2, says: "gets down to the floor and back up unaided" },
];

function readCapability(levels) {
  const lv = (id) => {
    const v = levels?.[id];
    return Number.isFinite(v) ? v : null;
  };
  const known = !!levels && ROBUST.concat(NEEDS_SUPPORT).some((r) => lv(r.id) !== null);

  const supportReasons = NEEDS_SUPPORT
    .filter((r) => lv(r.id) !== null && lv(r.id) <= r.atOrBelow)
    .map((r) => r.says);

  // What is still missing before the robust rungs are all met. A level that
  // falls short and a level never recorded at all are both missing, because
  // neither is evidence that the person can do the thing.
  const missingForRobust = ROBUST
    .filter((r) => lv(r.id) === null || lv(r.id) < r.atLeast)
    .map((r) => (lv(r.id) === null ? `${r.says} (not assessed)` : r.says));

  return { known, supportReasons, robust: missingForRobust.length === 0, missingForRobust };
}

export function assignSystem(intake) {
  const {
    age = 30,
    experience = "beginner",     // beginner | intermediate | advanced
    daysPerWeek = 3,             // 2 | 3 | 4 | 5
    equipment = "full_gym",      // full_gym | home_basic | none
    limitation = "none",         // none | knee | back | shoulder
    parqFlags = [],              // ids of any PAR-Q question answered YES
    // Capability levels from the most recent assessment, when one exists:
    // { sit_to_stand: 3, single_leg: 2, ... }. Absent for a self-serve
    // signup, which is why every branch below still works without it.
    levels = null,
  } = intake || {};

  // 1. Any PAR-Q yes → no automatic programme. A stranger who ticks "chest
  //    pain" must not be handed a workout by a piece of software, and no
  //    measurement changes that — a person can have an excellent chair stand
  //    and a heart condition on the same afternoon.
  if (parqFlags.length > 0) {
    return {
      systemId: null,
      needsTrainerContact: true,
      reason: "PAR-Q flagged — medical clearance needed before any programme",
      warnings: ["Ask them to speak to their doctor, and to you, before training."],
    };
  }

  const cap = readCapability(levels);

  // 2. Measured below the line, at any age. This is the half of the principle
  //    that is easy to forget: a fifty-five-year-old who cannot stand up
  //    without pushing off needs the supported programme just as much as an
  //    eighty-year-old does, and his birthday will never say so.
  if (cap.supportReasons.length > 0) {
    return {
      systemId: "senior75",
      needsTrainerContact: true,
      reason: `Assessed: ${cap.supportReasons.join("; ")}`,
      warnings: [
        "Chosen from what was measured, not from age.",
        "Re-assess and this moves with them — the programme is not a verdict.",
      ],
    };
  }

  // 3. Age, now that measurement has had its say. Someone 65 or over goes to
  //    the supported programme UNLESS an assessment has shown all four
  //    capabilities at or above the robust rungs.
  if (age >= 65 && !cap.robust) {
    return {
      systemId: "senior75",
      needsTrainerContact: true,
      reason: cap.known
        ? `Age ${age}, and not yet assessed as able to: ${cap.missingForRobust.join("; ")}`
        : `Age ${age} — gentle, supported programme (no assessment on file)`,
      warnings: [
        cap.known
          ? "Assess the missing capabilities and this can change."
          : "Age is an estimate of a body, not a measurement of one. Assess them and this choice can be made properly.",
      ],
    };
  }

  const base = byIntake({ experience, daysPerWeek, equipment, limitation });

  // 4. Measured above the line at 65 or over. The programme follows the
  //    measurement — but a person confirms it, because moving an older client
  //    off the supported programme is not a decision software should take on
  //    its own, however good the numbers were on the day.
  if (age >= 65 && cap.robust && base.systemId) {
    return {
      ...base,
      needsTrainerContact: true,
      reason: `${base.reason} — assessed capability rather than age ${age}`,
      warnings: [
        ...base.warnings,
        `Assessed: ${ROBUST.map((r) => r.says).join("; ")}.`,
        "Confirm this yourself before they start, and keep the balance work in whatever they train.",
      ],
    };
  }

  return base;
}

// Everything that does not depend on age or on an assessment.
function byIntake({ experience, daysPerWeek, equipment, limitation }) {
  // Reported limitation → the matching conditioning programme, but always with
  // a human in the loop. These are named "rehab" and "pain relief"; handing one
  // to an unassessed stranger is not something software should do on its own.
  if (limitation && limitation !== "none") {
    return {
      systemId: null,
      needsTrainerContact: true,
      reason: `Reported ${limitation} discomfort — needs a person to look at it`,
      warnings: [
        "Software cannot tell whether this is muscular, structural, or something that needs a doctor.",
        "Assign the matching programme yourself after speaking to them.",
      ],
    };
  }

  // No equipment → bodyweight, whatever else they said.
  if (equipment === "none") {
    return { systemId: "homebw", needsTrainerContact: false, reason: "No equipment available", warnings: [] };
  }

  // Dumbbells and bands at home: a beginner is well served by the bodyweight
  // programme; anyone further along can run full body with what they have.
  if (equipment === "home_basic") {
    return experience === "beginner"
      ? { systemId: "homebw", needsTrainerContact: false, reason: "Training at home, starting out", warnings: [] }
      : { systemId: "fullbody", needsTrainerContact: false, reason: "Training at home with basic equipment", warnings: [] };
  }

  // ── Full gym from here ──────────────────────────────────────
  const d = Number(daysPerWeek) || 3;

  if (experience === "beginner") {
    // Two or three days: full body every session beats a split — each muscle
    // gets trained 2-3x a week instead of once.
    if (d <= 3) return { systemId: "fullbody", needsTrainerContact: false, reason: `Beginner, ${d} days a week`, warnings: [] };
    return { systemId: "upperlower", needsTrainerContact: false, reason: `Beginner, ${d} days a week`, warnings: [] };
  }

  if (experience === "intermediate") {
    if (d <= 3) {
      // Push/Pull/Legs at 3 days hits each muscle only once a week, which is
      // under-dosed. Supersets cover more in the same time.
      return { systemId: "superset", needsTrainerContact: false, reason: "Intermediate, 3 days — time-efficient pairing", warnings: [] };
    }
    if (d === 4) return { systemId: "upperlower", needsTrainerContact: false, reason: "Intermediate, 4 days", warnings: [] };
    return { systemId: "ppl", needsTrainerContact: false, reason: "Intermediate, 5+ days — run the rotation twice", warnings: ["Push/Pull/Legs needs two rotations a week to be a complete programme."] };
  }

  // advanced
  if (d <= 3) return { systemId: "superset", needsTrainerContact: false, reason: "Advanced, limited days", warnings: [] };
  if (d === 4) return { systemId: "upperlower", needsTrainerContact: false, reason: "Advanced, 4 days", warnings: [] };
  return { systemId: "ppl", needsTrainerContact: false, reason: `Advanced, ${d} days — run the rotation twice`, warnings: [] };

  // Deliberately never auto-assigned — the trainer picks these himself:
  //   crossfit — barbell power cleans and Fran at 42.5kg, with no way for
  //              software to check whether someone can actually do them.
  //   arnold   — around 30 sets a week for chest and back, roughly triple the
  //              ~10 sets/muscle/week the evidence supports. Fine as a choice
  //              a coach makes for someone; not something to hand a stranger.
  //   fst7     — every muscle only once a week, and its "fascia stretching"
  //              premise has no controlled evidence behind it.
  //   hiit, circuit — good programmes, but conditioning add-ons rather than a
  //              complete plan for someone starting out.
  //   the four clinical programmes — see the limitation branch above.
}
