// Picks a training system from a client's intake answers.
//
// A pure function on purpose: no database, no network, no React. It can be
// read, argued with, and tested on its own — which matters, because these are
// coaching decisions, not code decisions.

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

export function assignSystem(intake) {
  const {
    age = 30,
    experience = "beginner",     // beginner | intermediate | advanced
    daysPerWeek = 3,             // 2 | 3 | 4 | 5
    equipment = "full_gym",      // full_gym | home_basic | none
    limitation = "none",         // none | knee | back | shoulder
    goal = "General Fitness",
    parqFlags = [],              // ids of any PAR-Q question answered YES
  } = intake || {};

  const warnings = [];

  // 1. Any PAR-Q yes → no automatic programme. A stranger who ticks "chest
  //    pain" must not be handed a workout by a piece of software.
  if (parqFlags.length > 0) {
    return {
      systemId: null,
      needsTrainerContact: true,
      reason: "PAR-Q flagged — medical clearance needed before any programme",
      warnings: ["Ask them to speak to their doctor, and to you, before training."],
    };
  }

  // 2. Age. Not a limitation, but the training looks different enough that it
  //    gets its own programme.
  if (age >= 65) {
    return {
      systemId: "senior75",
      needsTrainerContact: true,
      reason: `Age ${age} — gentle, supported programme`,
      warnings: ["Confirm this suits them personally before they start."],
    };
  }

  // 3. Reported limitation → the matching conditioning programme, but always
  //    with a human in the loop. These are named "rehab" and "pain relief";
  //    handing one to an unassessed stranger is not something software should
  //    do on its own.
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

  // 4. No equipment → bodyweight, whatever else they said.
  if (equipment === "none") {
    return { systemId: "homebw", needsTrainerContact: false, reason: "No equipment available", warnings: [] };
  }

  // 5. Dumbbells and bands at home: a beginner is well served by the bodyweight
  //    programme; anyone further along can run full body with what they have.
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
