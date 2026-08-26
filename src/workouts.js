// The workout library: 14 systems, 41 training days, 193 exercise entries,
// and the level gate that decides who may be shown what.
//
// This is 700 lines of DATA. It was the first thing in App.jsx and it is the
// thing most often edited — a programme changes far more often than the code
// that renders it — so it has no business being in the same file as the app
// shell. Nothing here imports anything; it is a list.

// ── WORKOUT SYSTEMS ────────────────────────────────────────
export const WORKOUT_SYSTEMS = [
  {
    id: "ppl", level: "intermediate", name: "Push / Pull / Legs", nameAr: "دفع / سحب / أرجل",
    color: "#A63A3A", emoji: "💪",
    desc: "Push / Pull / Legs run TWICE a week (6 days) \u2014 at 3 days each muscle is trained only once, which is too little",
    descAr: "دفع/سحب/أرجل مرتين أسبوعياً (6 أيام) — 3 أيام تعني تدريب كل عضلة مرة واحدة فقط وهو غير كافٍ",
    weeks: 8, deloadEvery: 4,
    days: [
      {
        name: "Day 1 — Push (Chest, Shoulders, Triceps)",
        exercises: [
          { name: "Bench Press", sets: "4", reps: "8-12", rest: "90s", notes: "Compound — chest focus" },
          { name: "Overhead Press", sets: "4", reps: "8-10", rest: "90s", notes: "Shoulder strength" },
          { name: "Incline Dumbbell Press", sets: "3", reps: "10-12", rest: "60s", notes: "Upper chest" },
          { name: "Lateral Raises", sets: "3", reps: "12-15", rest: "60s", notes: "Side delts" },
          { name: "Tricep Pushdown", sets: "3", reps: "12-15", rest: "60s", notes: "Cable/rope" },
          { name: "Overhead Tricep Extension", sets: "3", reps: "12", rest: "60s", notes: "Long head" },
        ]
      },
      {
        name: "Day 2 — Pull (Back, Biceps)",
        exercises: [
          { name: "Deadlift", sets: "4", reps: "5-8", rest: "2min", notes: "Compound — full back" },
          { name: "Pull-ups / Lat Pulldown", sets: "4", reps: "8-12", rest: "90s", notes: "Lat width" },
          { name: "Barbell Row", sets: "4", reps: "8-10", rest: "90s", notes: "Mid back thickness" },
          { name: "Face Pulls", sets: "3", reps: "15-20", rest: "60s", notes: "Rear delts + rotator cuff" },
          { name: "Barbell Curl", sets: "3", reps: "10-12", rest: "60s", notes: "Bicep peak" },
          { name: "Hammer Curl", sets: "3", reps: "12", rest: "60s", notes: "Brachialis" },
        ]
      },
      {
        name: "Day 3 — Legs (Quads, Hamstrings, Glutes, Calves)",
        exercises: [
          { name: "Barbell Squat", sets: "4", reps: "8-12", rest: "2min", notes: "King of leg exercises" },
          { name: "Romanian Deadlift", sets: "4", reps: "10-12", rest: "90s", notes: "Hamstring focus" },
          { name: "Leg Press", sets: "3", reps: "12-15", rest: "90s", notes: "Quad dominant" },
          { name: "Leg Curl", sets: "3", reps: "12-15", rest: "60s", notes: "Hamstring isolation" },
          { name: "Leg Extension", sets: "3", reps: "15", rest: "60s", notes: "Quad isolation" },
          { name: "Standing Calf Raise", sets: "4", reps: "15-20", rest: "45s", notes: "Calf size" },
        ]
      }
    ]
  },
  {
    id: "upperlower", level: "beginner", name: "Upper / Lower Split", nameAr: "تقسيم علوي / سفلي",
    color: "#9A6212", emoji: "⚡",
    desc: "4-day split alternating upper and lower body training",
    descAr: "تقسيم 4 أيام بين الجزء العلوي والسفلي",
    weeks: 8, deloadEvery: 4,
    days: [
      {
        name: "Day 1 — Upper A (Strength)",
        exercises: [
          { name: "Bench Press", sets: "4", reps: "5-6", rest: "2min", notes: "Heavy — strength focus" },
          { name: "Barbell Row", sets: "4", reps: "5-6", rest: "2min", notes: "Heavy pulling" },
          { name: "Overhead Press", sets: "3", reps: "6-8", rest: "90s", notes: "Shoulder strength" },
          { name: "Pull-ups", sets: "3", reps: "6-8", rest: "90s", notes: "Bodyweight" },
          { name: "Dumbbell Curl", sets: "3", reps: "10", rest: "60s", notes: "" },
          { name: "Skull Crushers", sets: "3", reps: "10", rest: "60s", notes: "" },
        ]
      },
      {
        name: "Day 2 — Lower A (Strength)",
        exercises: [
          { name: "Barbell Squat", sets: "4", reps: "5-6", rest: "2min", notes: "Heavy — strength focus" },
          { name: "Romanian Deadlift", sets: "3", reps: "6-8", rest: "2min", notes: "Hamstrings" },
          { name: "Leg Press", sets: "3", reps: "10", rest: "90s", notes: "" },
          { name: "Leg Curl", sets: "3", reps: "10-12", rest: "60s", notes: "" },
          { name: "Calf Raise", sets: "4", reps: "15", rest: "45s", notes: "" },
          { name: "Plank", sets: "3", reps: "45 sec", rest: "30s", notes: "Core stability" },
        ]
      },
      {
        name: "Day 3 — Upper B (Hypertrophy)",
        exercises: [
          { name: "Incline Dumbbell Press", sets: "4", reps: "10-12", rest: "60s", notes: "Volume focus" },
          { name: "Cable Row", sets: "4", reps: "10-12", rest: "60s", notes: "" },
          { name: "Lateral Raises", sets: "4", reps: "12-15", rest: "45s", notes: "" },
          { name: "Face Pulls", sets: "3", reps: "15", rest: "45s", notes: "" },
          { name: "Cable Fly", sets: "3", reps: "12-15", rest: "60s", notes: "Brings weekly chest volume in line with the rest" },
          { name: "Preacher Curl", sets: "3", reps: "12", rest: "60s", notes: "" },
          { name: "Tricep Pushdown", sets: "3", reps: "12-15", rest: "60s", notes: "" },
        ]
      },
      {
        name: "Day 4 — Lower B (Hypertrophy)",
        exercises: [
          { name: "Hack Squat / Leg Press", sets: "4", reps: "10-15", rest: "90s", notes: "Volume focus" },
          { name: "Walking Lunges", sets: "3", reps: "12 each", rest: "60s", notes: "" },
          { name: "Leg Curl", sets: "4", reps: "12-15", rest: "60s", notes: "" },
          { name: "Leg Extension", sets: "3", reps: "15", rest: "60s", notes: "" },
          { name: "Seated Calf Raise", sets: "4", reps: "15-20", rest: "45s", notes: "" },
          { name: "Ab Wheel Rollout", sets: "3", reps: "10", rest: "60s", notes: "" },
        ]
      }
    ]
  },
  {
    id: "fst7", level: "advanced", name: "FST-7 Training", nameAr: "تدريب FST-7",
    color: "#6B4FA8", emoji: "🔥",
    desc: "Seven sets of twelve on the last exercise, thirty seconds' rest — high volume on an isolation movement to finish",
    descAr: "سبع مجموعات من 12 تكراراً في التمرين الأخير، راحة 30 ثانية — حجم عالٍ في تمرين عزل كخاتمة",
    weeks: 6, deloadEvery: 3,
    days: [
      {
        name: "Day 1 — Chest (FST-7)",
        exercises: [
          { name: "Incline Barbell Press", sets: "4", reps: "8-10", rest: "90s", notes: "Warm up chest" },
          { name: "Flat Dumbbell Press", sets: "4", reps: "10-12", rest: "75s", notes: "" },
          { name: "Pec Dec / Cable Fly", sets: "7", reps: "12", rest: "30s", notes: "The 7: short rest, high volume to finish" },
        ]
      },
      {
        name: "Day 2 — Back (FST-7)",
        exercises: [
          { name: "Deadlift", sets: "4", reps: "6-8", rest: "2min", notes: "Heavy compound" },
          { name: "T-Bar Row", sets: "4", reps: "10", rest: "90s", notes: "" },
          { name: "Straight Arm Pulldown", sets: "7", reps: "12", rest: "30s", notes: "The 7: short rest, full range on the lats" },
        ]
      },
      {
        name: "Day 3 — Shoulders (FST-7)",
        exercises: [
          { name: "Seated DB Overhead Press", sets: "4", reps: "10-12", rest: "90s", notes: "" },
          { name: "Lateral Raises", sets: "4", reps: "12-15", rest: "60s", notes: "" },
          { name: "Cable Lateral Raise", sets: "7", reps: "12", rest: "30s", notes: "The 7: short rest, side delts" },
        ]
      },
      {
        name: "Day 4 — Arms (FST-7)",
        exercises: [
          { name: "Barbell Curl", sets: "4", reps: "10", rest: "75s", notes: "" },
          { name: "Close Grip Bench Press", sets: "4", reps: "10", rest: "75s", notes: "" },
          { name: "Cable Curl", sets: "7", reps: "12", rest: "30s", notes: "The 7: short rest, biceps" },
          { name: "Cable Pushdown", sets: "7", reps: "12", rest: "30s", notes: "The 7: short rest, triceps" },
        ]
      },
      {
        name: "Day 5 — Legs (FST-7)",
        exercises: [
          { name: "Squat", sets: "4", reps: "10-12", rest: "2min", notes: "" },
          { name: "Leg Press", sets: "4", reps: "12-15", rest: "90s", notes: "" },
          { name: "Leg Extension", sets: "7", reps: "12", rest: "30s", notes: "The 7: short rest, quads" },
          { name: "Leg Curl", sets: "7", reps: "12", rest: "30s", notes: "The 7: short rest, hamstrings" },
        ]
      }
    ]
  },
  {
    id: "superset", level: "intermediate", name: "Superset Training", nameAr: "تدريب السوبرسيت",
    color: "#12795A", emoji: "⚡",
    desc: "Pair antagonist muscles — maximum efficiency, time-saving",
    descAr: "تدريب العضلات المتعاكسة معاً — كفاءة عالية",
    weeks: 8, deloadEvery: 4,
    days: [
      {
        name: "Day 1 — Chest + Back (Superset)",
        exercises: [
          { name: "SS1A: Bench Press", sets: "4", reps: "10", rest: "0s", notes: "↓ Go immediately to SS1B" },
          { name: "SS1B: Barbell Row", sets: "4", reps: "10", rest: "90s", notes: "Rest after both" },
          { name: "SS2A: Incline DB Press", sets: "3", reps: "12", rest: "0s", notes: "↓ Go immediately to SS2B" },
          { name: "SS2B: Lat Pulldown", sets: "3", reps: "12", rest: "75s", notes: "Rest after both" },
          { name: "SS3A: Cable Fly", sets: "3", reps: "15", rest: "0s", notes: "↓" },
          { name: "SS3B: Face Pull", sets: "3", reps: "15", rest: "60s", notes: "Rest after both" },
        ]
      },
      {
        name: "Day 2 — Shoulders + Arms (Superset)",
        exercises: [
          { name: "SS1A: OHP", sets: "4", reps: "10", rest: "0s", notes: "↓" },
          { name: "SS1B: Pull-ups", sets: "4", reps: "8", rest: "90s", notes: "Rest after both" },
          { name: "SS2A: Barbell Curl", sets: "3", reps: "12", rest: "0s", notes: "↓" },
          { name: "SS2B: Skull Crusher", sets: "3", reps: "12", rest: "75s", notes: "Bicep + Tricep" },
          { name: "SS3A: Lateral Raise", sets: "3", reps: "15", rest: "0s", notes: "↓" },
          { name: "SS3B: Tricep Pushdown", sets: "3", reps: "15", rest: "60s", notes: "" },
        ]
      },
      {
        name: "Day 3 — Legs (Superset)",
        exercises: [
          { name: "SS1A: Squat", sets: "4", reps: "10", rest: "0s", notes: "↓" },
          { name: "SS1B: Leg Curl", sets: "4", reps: "12", rest: "90s", notes: "Quad + Hamstring" },
          { name: "SS2A: Leg Press", sets: "3", reps: "15", rest: "0s", notes: "↓" },
          { name: "SS2B: Romanian Deadlift", sets: "3", reps: "12", rest: "75s", notes: "" },
          { name: "SS3A: Leg Extension", sets: "3", reps: "15", rest: "0s", notes: "↓" },
          { name: "SS3B: Calf Raise", sets: "3", reps: "20", rest: "60s", notes: "" },
        ]
      }
    ]
  },
  {
    id: "circuit", level: "beginner", name: "Circuit Training", nameAr: "التدريب الدائري",
    color: "#21509B", emoji: "🔄",
    desc: "Every exercise back-to-back with little rest, three times through — start at three rounds and add a fourth when three stop being hard",
    descAr: "جميع التمارين متتالية مع راحة قليلة",
    weeks: 8, deloadEvery: 4,
    days: [
      {
        name: "Circuit A — Full Body",
        // The rounds are DATA, not a line in the title. Written as a name, the
        // player had no way to know about them and ran the list once — a third
        // of the session, delivered as if it were the whole thing.
        rounds: 3,
        exercises: [
          { name: "Jump Squats", sets: "1", reps: "15", rest: "15s", notes: "Explosive" },
          { name: "Push-ups", sets: "1", reps: "15", rest: "15s", notes: "" },
          { name: "Dumbbell Row", sets: "1", reps: "12 each", rest: "15s", notes: "" },
          { name: "Reverse Lunges", sets: "1", reps: "12 each", rest: "15s", notes: "" },
          { name: "Dumbbell Shoulder Press", sets: "1", reps: "12", rest: "15s", notes: "" },
          { name: "Mountain Climbers", sets: "1", reps: "30 sec", rest: "15s", notes: "Core" },
          { name: "Burpees", sets: "1", reps: "10", rest: "60s", notes: "Rest 60s between rounds" },
        ]
      },
      {
        name: "Circuit B — Upper Body Focus",
        // The rounds are DATA, not a line in the title. Written as a name, the
        // player had no way to know about them and ran the list once — a third
        // of the session, delivered as if it were the whole thing.
        rounds: 3,
        exercises: [
          { name: "Pull-ups / Assisted Pull-ups", sets: "1", reps: "10", rest: "15s", notes: "" },
          { name: "Dumbbell Press", sets: "1", reps: "12", rest: "15s", notes: "" },
          { name: "Cable Row", sets: "1", reps: "12", rest: "15s", notes: "" },
          { name: "Arnold Press", sets: "1", reps: "12", rest: "15s", notes: "" },
          { name: "Dumbbell Curl", sets: "1", reps: "12", rest: "15s", notes: "" },
          { name: "Tricep Dips", sets: "1", reps: "12", rest: "15s", notes: "" },
          { name: "Plank", sets: "1", reps: "45 sec", rest: "60s", notes: "Rest between rounds" },
        ]
      },
      {
        name: "Circuit C — Lower Body + Core",
        // The rounds are DATA, not a line in the title. Written as a name, the
        // player had no way to know about them and ran the list once — a third
        // of the session, delivered as if it were the whole thing.
        rounds: 3,
        exercises: [
          { name: "Goblet Squat", sets: "1", reps: "15", rest: "15s", notes: "" },
          { name: "Hip Thrust", sets: "1", reps: "15", rest: "15s", notes: "" },
          { name: "Step-ups", sets: "1", reps: "12 each", rest: "15s", notes: "" },
          { name: "Sumo Deadlift", sets: "1", reps: "12", rest: "15s", notes: "" },
          { name: "Calf Raises", sets: "1", reps: "20", rest: "15s", notes: "" },
          { name: "Russian Twists", sets: "1", reps: "20", rest: "15s", notes: "" },
          { name: "Leg Raises", sets: "1", reps: "15", rest: "60s", notes: "Rest between rounds" },
        ]
      }
    ]
  },
  {
    id: "fullbody", level: "beginner", name: "Full Body Training", nameAr: "تدريب الجسم الكامل",
    color: "#8b5cf6", emoji: "\ud83c\udfcb\ufe0f",
    desc: "3 days a week, whole body each session \u2014 every muscle trained 3\u00d7 weekly, which is what makes it work for beginners",
    descAr: "3 أيام أسبوعياً، الجسم كامل في كل جلسة — كل عضلة 3 مرات أسبوعياً",
    weeks: 8, deloadEvery: 4,
    days: [
      {
        name: "Day A \u2014 Full Body (Mon)",
        exercises: [
          { name: "Barbell Squat", sets: "3", reps: "6-8", rest: "2min", notes: "Main lift \u2014 add weight when all 3 sets hit 8" },
          { name: "Bench Press", sets: "3", reps: "6-8", rest: "2min", notes: "Main upper push" },
          { name: "Barbell Row", sets: "3", reps: "8-10", rest: "90s", notes: "Main upper pull" },
          { name: "Overhead Press", sets: "2", reps: "8-10", rest: "90s", notes: "" },
          { name: "Plank", sets: "3", reps: "45 sec", rest: "30s", notes: "Core" },
        ]
      },
      {
        name: "Day B \u2014 Full Body (Wed)",
        exercises: [
          { name: "Romanian Deadlift", sets: "3", reps: "8-10", rest: "90s", notes: "Hinge \u2014 moderate load, not a max effort" },
          { name: "Incline DB Press", sets: "3", reps: "10-12", rest: "75s", notes: "Upper chest" },
          { name: "Pull-ups / Lat Pulldown", sets: "3", reps: "8-12", rest: "90s", notes: "Vertical pull" },
          { name: "Leg Press", sets: "3", reps: "12-15", rest: "75s", notes: "Quads" },
          { name: "Lateral Raises", sets: "2", reps: "12-15", rest: "60s", notes: "Side delts" },
          { name: "Dead Bug", sets: "3", reps: "8 each side", rest: "45s", notes: "Core \u2014 slow and controlled" },
        ]
      },
      {
        name: "Day C \u2014 Full Body (Fri)",
        exercises: [
          { name: "Deadlift", sets: "3", reps: "5", rest: "2min", notes: "The one heavy pull of the week \u2014 kept on its own day" },
          { name: "Goblet Squat", sets: "3", reps: "10-12", rest: "90s", notes: "Lighter squat pattern after the deadlift" },
          { name: "Dumbbell Press", sets: "3", reps: "10-12", rest: "75s", notes: "" },
          { name: "Cable Row", sets: "3", reps: "10-12", rest: "75s", notes: "" },
          { name: "Barbell Curl", sets: "2", reps: "10-12", rest: "60s", notes: "" },
          { name: "Tricep Pushdown", sets: "2", reps: "12-15", rest: "60s", notes: "" },
        ]
      }
    ]
  },
  {
    id: "hiit", level: "intermediate", name: "HIIT Training", nameAr: "تدريب HIIT",
    color: "#A63A3A", emoji: "🔥",
    desc: "High Intensity Interval Training — maximum calorie burn",
    descAr: "تدريب متقطع عالي الكثافة — حرق أقصى للسعرات",
    weeks: 6, deloadEvery: 3,
    days: [
      {
        name: "HIIT Session 1 — Cardio Intervals (20-30 min)",
        exercises: [
          { name: "Warm-up Jog", sets: "1", reps: "5 min", rest: "0s", notes: "Light pace" },
          { name: "Sprint", sets: "8", reps: "30 sec", rest: "30s", notes: "All out effort" },
          { name: "High Knees", sets: "4", reps: "40 sec", rest: "20s", notes: "" },
          { name: "Jump Rope", sets: "4", reps: "40 sec", rest: "20s", notes: "" },
          { name: "Burpees", sets: "4", reps: "10", rest: "30s", notes: "" },
          { name: "Cool Down Walk", sets: "1", reps: "5 min", rest: "0s", notes: "" },
        ]
      },
      {
        name: "HIIT Session 2 — Strength Intervals",
        exercises: [
          { name: "Jump Squats", sets: "5", reps: "20 sec on / 10 sec off", rest: "60s", notes: "20 on, 10 off — hard on the 20" },
          { name: "Push-up Burpees", sets: "5", reps: "20 sec on / 10 sec off", rest: "60s", notes: "" },
          { name: "Kettlebell Swing", sets: "5", reps: "20 sec on / 10 sec off", rest: "60s", notes: "" },
          { name: "Box Jumps", sets: "5", reps: "20 sec on / 10 sec off", rest: "60s", notes: "" },
          { name: "Mountain Climbers", sets: "5", reps: "20 sec on / 10 sec off", rest: "60s", notes: "" },
        ]
      },
      {
        name: "HIIT Session 3 — Metabolic Conditioning",
        exercises: [
          { name: "Thrusters (DB)", sets: "4", reps: "12", rest: "30s", notes: "" },
          { name: "Pull-ups", sets: "4", reps: "8-10", rest: "30s", notes: "" },
          { name: "Box Step-ups", sets: "4", reps: "10 each", rest: "30s", notes: "" },
          { name: "Battle Ropes", sets: "4", reps: "30 sec", rest: "30s", notes: "" },
          { name: "Slam Ball", sets: "4", reps: "15", rest: "30s", notes: "" },
          { name: "Rowing Machine", sets: "4", reps: "250m", rest: "45s", notes: "" },
        ]
      }
    ]
  },
  {
    id: "crossfit", level: "advanced", name: "CrossFit Style", nameAr: "أسلوب كروسفيت",
    color: "#0ea5e9", emoji: "🏆",
    desc: "Functional fitness — strength, cardio and gymnastics combined. The benchmark workouts here are scaled: add rounds and load over months, and only once the movements are clean",
    descAr: "لياقة وظيفية — قوة وكارديو وجمباز معاً",
    weeks: 8, deloadEvery: 4,
    days: [
      // ── Why these two are scaled from the published versions ──
      //
      // "Fran" as written is 45 thrusters at 42.5 kg and 45 pull-ups for time;
      // "Cindy" is as many rounds as possible in 20 minutes, which is commonly
      // 15-20 rounds — 75-100 pull-ups and 150-200 push-ups. Two things in the
      // literature say a person meeting this through an app should not be
      // handed those numbers:
      //
      //   - Novices in CrossFit are injured at 9.5-10.6 per 1000 hours against
      //     0.74-3.3 for experienced participants; 14.9% were injured inside
      //     eight weeks, lower back and knee first. An introductory class made
      //     no measurable difference. (Pediatr/Sports Med prospective cohort,
      //     PMC7077206.)
      //   - The rhabdomyolysis case reviews centre on exactly this shape of
      //     work: high-repetition pull-ups and chin-ups, 100+ push-ups, and
      //     "Murph". The two biggest risk factors are being unfamiliar with
      //     the training and coming back after a break. (Apunts systematic
      //     review, 63 cases.)
      //
      // So the ladder is shorter, the pull is horizontal, and the AMRAP has a
      // round ceiling instead of an open clock. The published versions are
      // named in the notes as what these progress towards — scaled is not the
      // same as hidden.
      {
        name: "WOD 1 — \"Fran\" (scaled)",
        rounds: 3,
        exercises: [
          { name: "Thrusters (Barbell 30kg)", sets: "1", reps: "15", repsByRound: [15, 12, 9], rest: "As needed", notes: "For time. Rx is 42.5kg — earn it over months, not weeks" },
          { name: "Ring Rows", sets: "1", reps: "15", repsByRound: [15, 12, 9], rest: "As needed", notes: "Rx is strict pull-ups. High-rep pull-ups are the single most common trigger in the rhabdomyolysis case reports — this is the horizontal version of the same pull" },
        ]
      },
      {
        name: "WOD 2 — \"Cindy\" (5 rounds, 20 min cap)",
        rounds: 5,
        exercises: [
          { name: "Pull-ups", sets: "1", reps: "5", rest: "0s", notes: "Band-assisted or ring rows if 5 strict is not there yet" },
          { name: "Push-ups", sets: "1", reps: "10", rest: "0s", notes: "" },
          { name: "Air Squats", sets: "1", reps: "15", rest: "60s", notes: "Rest here, then the next round. Stop at 20 minutes even if rounds are left" },
        ]
      },
      {
        name: "WOD 3 — Strength + Conditioning",
        exercises: [
          { name: "Back Squat", sets: "5", reps: "5", rest: "2min", notes: "Heavy 5×5" },
          { name: "Power Clean", sets: "5", reps: "3", rest: "2min", notes: "Olympic lift" },
          { name: "Box Jumps", sets: "3", reps: "10", rest: "90s", notes: "" },
          { name: "Double Unders / Jump Rope", sets: "3", reps: "50", rest: "60s", notes: "" },
          { name: "GHD Sit-ups", sets: "3", reps: "20", rest: "60s", notes: "" },
        ]
      }
    ]
  },
  {
    id: "arnold", level: "advanced", name: "Arnold Split", nameAr: "تقسيم أرنولد",
    color: "#21509B", emoji: "🌟",
    desc: "6-day split by Arnold Schwarzenegger — classic bodybuilding",
    descAr: "تقسيم 6 أيام بأسلوب أرنولد — بناء جسم كلاسيكي",
    weeks: 6, deloadEvery: 3,
    days: [
      {
        name: "Day 1 & 4 — Chest + Back",
        exercises: [
          { name: "Bench Press", sets: "4", reps: "6-10", rest: "90s", notes: "" },
          { name: "Incline Dumbbell Press", sets: "4", reps: "8-12", rest: "75s", notes: "" },
          { name: "Weighted Pull-ups", sets: "4", reps: "8-10", rest: "90s", notes: "" },
          { name: "T-Bar Row", sets: "4", reps: "8-10", rest: "90s", notes: "" },
          { name: "Cable Fly", sets: "3", reps: "12-15", rest: "60s", notes: "" },
          { name: "Straight Arm Pulldown", sets: "3", reps: "12", rest: "60s", notes: "" },
        ]
      },
      {
        name: "Day 2 & 5 — Shoulders + Arms",
        exercises: [
          { name: "Arnold Press", sets: "4", reps: "8-12", rest: "90s", notes: "Signature exercise" },
          { name: "Lateral Raises", sets: "4", reps: "12-15", rest: "60s", notes: "" },
          { name: "Barbell Curl", sets: "4", reps: "8-12", rest: "75s", notes: "" },
          { name: "Close Grip Bench", sets: "4", reps: "8-12", rest: "75s", notes: "" },
          { name: "Concentration Curl", sets: "3", reps: "12", rest: "60s", notes: "" },
          { name: "Overhead Tricep Ext", sets: "3", reps: "12", rest: "60s", notes: "" },
        ]
      },
      {
        name: "Day 3 & 6 — Legs + Lower Back",
        exercises: [
          { name: "Barbell Squat", sets: "5", reps: "8-12", rest: "2min", notes: "" },
          { name: "Leg Press", sets: "4", reps: "12-15", rest: "90s", notes: "" },
          { name: "Stiff Leg Deadlift", sets: "4", reps: "10-12", rest: "90s", notes: "" },
          { name: "Leg Curl", sets: "4", reps: "12-15", rest: "60s", notes: "" },
          { name: "Standing Calf Raise", sets: "5", reps: "15-20", rest: "45s", notes: "" },
          { name: "Hyperextensions", sets: "3", reps: "15", rest: "60s", notes: "Lower back" },
        ]
      }
    ]
  },
  {
    id: "homebw", level: "beginner", name: "Home Bodyweight", nameAr: "تمارين منزلية بوزن الجسم",
    color: "#10b981", emoji: "🏠",
    desc: "No equipment needed — train anywhere using only your body weight",
    descAr: "بدون معدات — تدريب في أي مكان بوزن الجسم فقط",
    weeks: 8, deloadEvery: 4,
    days: [
      {
        name: "Day 1 — Upper Body (Bodyweight)",
        exercises: [
          { name: "Push-ups", sets: "4", reps: "10-15", rest: "60s", notes: "Knee \u2192 incline \u2192 full \u2192 feet raised as they get easier" },
          { name: "Incline Push-ups (on table/wall)", sets: "3", reps: "12", rest: "45s", notes: "Easier variation" },
          { name: "Tricep Dips (chair)", sets: "3", reps: "12", rest: "45s", notes: "Use sturdy chair" },
          { name: "Table Inverted Row", sets: "4", reps: "8-12", rest: "60s", notes: "Under a sturdy table \u2014 the pulling this programme was missing" },
          { name: "Superman Hold", sets: "3", reps: "20 sec", rest: "30s", notes: "Back strength" },
          { name: "Plank Shoulder Taps", sets: "3", reps: "10 each", rest: "45s", notes: "Core + shoulder stability" },
        ]
      },
      {
        name: "Day 2 — Lower Body (Bodyweight)",
        exercises: [
          { name: "Bodyweight Squats", sets: "4", reps: "15-20", rest: "60s", notes: "" },
          { name: "Reverse Lunges", sets: "3", reps: "10 each", rest: "45s", notes: "Knee friendly" },
          { name: "Glute Bridges", sets: "3", reps: "15", rest: "45s", notes: "" },
          { name: "Calf Raises", sets: "3", reps: "20", rest: "30s", notes: "" },
          { name: "Wall Sit", sets: "3", reps: "30 sec", rest: "45s", notes: "Isometric quad hold" },
        ]
      },
      {
        name: "Day 3 — Full Body + Core",
        exercises: [
          { name: "Burpees (or step-back version)", sets: "3", reps: "10", rest: "60s", notes: "Low impact option available" },
          { name: "Mountain Climbers", sets: "3", reps: "30 sec", rest: "45s", notes: "" },
          { name: "Plank", sets: "3", reps: "40 sec", rest: "30s", notes: "" },
          { name: "Bicycle Crunches", sets: "3", reps: "20", rest: "30s", notes: "" },
          { name: "Towel Door Row", sets: "3", reps: "10-12", rest: "45s", notes: "Towel round a door handle, lean back and pull \u2014 second pull of the week" },
          { name: "Jumping Jacks", sets: "3", reps: "30 sec", rest: "30s", notes: "Cardio finisher" },
        ]
      }
    ]
  },
  {
    id: "senior75", level: "clinical", name: "Senior Fitness 75+", nameAr: "لياقة كبار السن 75+",
    color: "#06b6d4", emoji: "🧓",
    desc: "Gentle, safe training using resistance bands, foam roller, Pilates ring & self-massage — designed for elderly clients",
    descAr: "تدريب لطيف وآمن باستخدام أحزمة المقاومة وأسطوانة الفوم وحلقة البيلاتس — مصمم لكبار السن",
    weeks: 12, deloadEvery: 0,
    warmup: [
      { name: "Seated Marching", sets: "1", reps: "60 sec", rest: "0s", notes: "Sit tall, lift knees gently, swing arms" },
      { name: "Ankle Pumps (seated)", sets: "1", reps: "15 each", rest: "0s", notes: "Point and flex — wakes up circulation" },
      { name: "Seated Shoulder Rolls", sets: "1", reps: "10 each way", rest: "0s", notes: "Slow, no force" },
      { name: "Neck Rotations (small range)", sets: "1", reps: "30 sec", rest: "0s", notes: "Never push into pain" },
      { name: "Seated Torso Turns", sets: "1", reps: "8 each side", rest: "0s", notes: "Hands crossed on chest, gentle" },
      { name: "Sit-to-Stand", sets: "1", reps: "5 reps", rest: "30s", notes: "Hold chair arms if needed — this is the warm-up and a test" },
    ],
    cooldown: [
      { name: "Seated Deep Breathing", sets: "1", reps: "60 sec", rest: "0s", notes: "Slow in through nose, longer out" },
      { name: "Seated Hamstring Stretch", sets: "1", reps: "20 sec each", rest: "10s", notes: "Leg straight, heel on floor, sit tall" },
      { name: "Seated Calf & Ankle Stretch", sets: "1", reps: "20 sec each", rest: "10s", notes: "Toes pulled up toward you" },
      { name: "Seated Chest Opener", sets: "1", reps: "20 sec", rest: "10s", notes: "Hands behind, gentle — opens posture" },
      { name: "Neck Side Stretch", sets: "1", reps: "20 sec each", rest: "0s", notes: "Ear toward shoulder, no pulling" },
    ],
    // Two supervised days a week, for a client whose schedule is fixed at that
    // — Rafi's home-PT client trains Monday and Thursday.
    //
    // NOT the three-day programme with a day dropped. Run that way, half of
    // this work would reach the person once every ten days, which is under the
    // benchmark for anyone and further under it at eighty, where muscle is
    // lost quickly and rebuilt slowly. So each day covers the whole body, and
    // BALANCE APPEARS ON BOTH — falls are the risk being trained against, and
    // it is not the thing to halve.
    //
    // The massage and release work stays in the session. Rafi does it himself
    // in the room; it is part of what he delivers, not homework. Only the
    // stretching goes home, because that is safe to do alone.
    schedules: {
      2: [
        {
          name: "Day A — Power, Pull & Balance",
          exercises: [
            { name: "Sit-to-Stand (stand up quickly)", sets: "3", reps: "8", rest: "60s", notes: "Stand FAST, sit down slow — speed matters more than load at this age" },
            { name: "Seated Resistance Band Row", sets: "3", reps: "10-12", rest: "60s", notes: "Light band — improves posture" },
            { name: "Standing Wall Push-ups", sets: "2", reps: "8-10", rest: "60s", notes: "Hands on wall, gentle chest/arm work" },
            { name: "Band Lateral Walk", sets: "2", reps: "10 steps each", rest: "60s", notes: "Loop band around ankles, hold support if needed" },
            { name: "Single Leg Stand (hold support)", sets: "3", reps: "20 sec each", rest: "30s", notes: "Balance — always near wall/chair" },
            { name: "Tandem Walk (heel-to-toe)", sets: "3", reps: "10 steps", rest: "45s", notes: "Along a wall — dynamic balance, which is what actually prevents falls" },
            { name: "Foam Roller Calf Release", sets: "1", reps: "60 sec each", rest: "0s", notes: "Slow, gentle rolling — no pain" },
            { name: "Hand Massage / Self Massage (forearms, hands)", sets: "1", reps: "3-5 min", rest: "0s", notes: "Improves circulation, very relaxing" },
          ]
        },
        {
          name: "Day B — Squat, Press & Balance",
          exercises: [
            { name: "Chair-Assisted Mini Squats", sets: "3", reps: "8", rest: "60s", notes: "Hold chair back for support" },
            { name: "Seated Band Shoulder Pull-Apart", sets: "3", reps: "10", rest: "45s", notes: "Posture + shoulder mobility" },
            { name: "Pilates Ring Chest Press (seated)", sets: "3", reps: "10", rest: "45s", notes: "Squeeze ring between palms" },
            { name: "Band Seated Leg Extension", sets: "2", reps: "10 each", rest: "45s", notes: "Light tension band around ankle" },
            { name: "Single Leg Stand (hold support)", sets: "3", reps: "20 sec each", rest: "30s", notes: "Balance — always near wall/chair" },
            { name: "Tandem Walk (heel-to-toe)", sets: "3", reps: "10 steps", rest: "45s", notes: "Along a wall — the second dose this week, on purpose" },
            { name: "Pilates Ring Ankle Press", sets: "2", reps: "10 each", rest: "30s", notes: "Ankle strength, seated" },
            { name: "Foam Roller Upper Back Release", sets: "1", reps: "60 sec", rest: "0s", notes: "Gentle, supported by floor or bed" },
            { name: "Hand-held Massager — Lower Back & Legs", sets: "1", reps: "5-8 min", rest: "0s", notes: "Use on low setting, avoid joints directly" },
          ]
        },
      ],
    },
    days: [
      {
        name: "Day 1 — Seated & Standing Mobility",
        exercises: [
          { name: "Seated Resistance Band Row", sets: "3", reps: "10-12", rest: "60s", notes: "Light band — improves posture" },
          { name: "Band Lateral Walk", sets: "2", reps: "10 steps each", rest: "60s", notes: "Loop band around ankles, hold support if needed" },
          { name: "Pilates Ring Knee Squeeze (seated)", sets: "3", reps: "12", rest: "45s", notes: "Inner thigh + pelvic floor, very gentle" },
          { name: "Standing Wall Push-ups", sets: "2", reps: "8-10", rest: "60s", notes: "Hands on wall, gentle chest/arm work" },
          { name: "Sit-to-Stand (stand up quickly)", sets: "3", reps: "8", rest: "60s", notes: "Stand FAST, sit down slow \u2014 speed matters more than load at this age" },
          { name: "Foam Roller Calf Release", sets: "1", reps: "60 sec each", rest: "0s", notes: "Slow, gentle rolling — no pain" },
        ]
      },
      {
        name: "Day 2 — Balance & Gentle Strength",
        exercises: [
          { name: "Chair-Assisted Mini Squats", sets: "3", reps: "8", rest: "60s", notes: "Hold chair back for support" },
          { name: "Band Seated Leg Extension", sets: "2", reps: "10 each", rest: "45s", notes: "Light tension band around ankle" },
          { name: "Pilates Ring Chest Press (seated)", sets: "3", reps: "10", rest: "45s", notes: "Squeeze ring between palms" },
          { name: "Single Leg Stand (hold support)", sets: "3", reps: "20 sec each", rest: "30s", notes: "Balance — always near wall/chair" },
          { name: "Tandem Walk (heel-to-toe)", sets: "3", reps: "10 steps", rest: "45s", notes: "Along a wall — dynamic balance, which is what actually prevents falls" },
          { name: "Hand Massage / Self Massage (forearms, hands)", sets: "1", reps: "3-5 min", rest: "0s", notes: "Improves circulation, very relaxing" },
        ]
      },
      {
        name: "Day 3 — Flexibility & Recovery",
        exercises: [
          { name: "Foam Roller Upper Back Release", sets: "1", reps: "60 sec", rest: "0s", notes: "Gentle, supported by floor or bed" },
          { name: "Seated Band Shoulder Pull-Apart", sets: "3", reps: "10", rest: "45s", notes: "Posture + shoulder mobility" },
          { name: "Pilates Ring Ankle Press", sets: "2", reps: "10 each", rest: "30s", notes: "Ankle strength, seated" },
          { name: "Hand-held Massager — Lower Back & Legs", sets: "1", reps: "5-8 min", rest: "0s", notes: "Use on low setting, avoid joints directly" },
          { name: "Walk", sets: "1", reps: "20-30 min", rest: "0s", notes: "At least twice a week on non-training days \u2014 the part most programmes leave out" },
          { name: "Deep Breathing + Gentle Neck Stretch", sets: "1", reps: "5 min", rest: "0s", notes: "Relaxation finish" },
        ]
      }
    ]
  },
  {
    id: "lowback", level: "clinical", name: "Lower Back Pain Relief", nameAr: "تخفيف آلام أسفل الظهر",
    color: "#f43f5e", emoji: "🩹",
    desc: "Gentle core stabilization and mobility work to relieve and prevent lower back pain",
    descAr: "تمارين لطيفة لتقوية الجذع وتحسين الحركة لتخفيف آلام أسفل الظهر",
    weeks: 6, deloadEvery: 0,
    warmup: [
      { name: "Light Walk in Place", sets: "1", reps: "2 min", rest: "0s", notes: "Raise temperature before any spine work" },
      { name: "Pelvic Tilts (lying)", sets: "1", reps: "10 reps", rest: "0s", notes: "Small, comfortable range" },
      { name: "Cat-Cow (slow)", sets: "1", reps: "8 reps", rest: "0s", notes: "Move through the range you have today" },
      { name: "Knee Rocks (lying)", sets: "1", reps: "8 each side", rest: "0s", notes: "Knees bent, rock side to side, small range" },
      { name: "Glute Bridge (warm-up reps)", sets: "1", reps: "8 reps", rest: "30s", notes: "Light — just waking the hips up" },
    ],
    cooldown: [
      { name: "Knee-to-Chest Stretch", sets: "1", reps: "20 sec each", rest: "10s", notes: "One leg at a time, relaxed" },
      { name: "Supine Figure-4 Glute Stretch", sets: "1", reps: "20 sec each", rest: "10s", notes: "Ankle over knee, pull gently" },
      { name: "Child's Pose", sets: "1", reps: "45 sec", rest: "0s", notes: "Knees wide if more comfortable" },
      { name: "Diaphragmatic Breathing (lying)", sets: "1", reps: "60 sec", rest: "0s", notes: "Hand on belly — settles the nervous system" },
    ],
    days: [
      {
        name: "Day 1 — Gentle Mobility",
        exercises: [
          { name: "Cat-Cow Stretch", sets: "3", reps: "10", rest: "30s", notes: "Slow controlled spinal movement" },
          { name: "Pelvic Tilts (lying)", sets: "3", reps: "12", rest: "30s", notes: "Engage lower abs gently" },
          { name: "Knee-to-Chest Stretch", sets: "2", reps: "20 sec each", rest: "20s", notes: "One leg at a time" },
          { name: "Bird Dog", sets: "3", reps: "8 each side", rest: "45s", notes: "Core stability — go slow" },
          { name: "Foam Roller Thoracic Release", sets: "1", reps: "60 sec", rest: "0s", notes: "Avoid rolling directly on lower back" },
        ]
      },
      {
        name: "Day 2 — Core Stabilization",
        exercises: [
          { name: "Glute Bridge", sets: "3", reps: "12", rest: "45s", notes: "Squeeze glutes, avoid arching" },
          { name: "Dead Bug", sets: "3", reps: "8 each side", rest: "45s", notes: "Keep lower back flat on floor" },
          { name: "Modified Side Plank (knees down)", sets: "2", reps: "20 sec each", rest: "30s", notes: "Builds side core support" },
          { name: "Band Seated Row", sets: "3", reps: "12", rest: "45s", notes: "Strengthens upper back posture" },
          { name: "Gentle Walking", sets: "1", reps: "10-15 min", rest: "0s", notes: "Low impact, daily recommended" },
        ]
      }
    ]
  },
  {
    id: "shoulder", level: "clinical", name: "Shoulder Pain Rehab", nameAr: "علاج تأهيلي لألم الكتف",
    color: "#8b5cf6", emoji: "💢",
    desc: "Rotator cuff strengthening and mobility to relieve shoulder pain and improve range of motion",
    descAr: "تقوية الكتف وتحسين المرونة لتخفيف الألم",
    weeks: 6, deloadEvery: 0,
    warmup: [
      { name: "Light Walk in Place", sets: "1", reps: "2 min", rest: "0s", notes: "General warm-up, no arm swinging yet" },
      { name: "Pendulum Swing", sets: "1", reps: "30 sec each arm", rest: "0s", notes: "Lean forward, let the arm hang and swing" },
      { name: "Shoulder Rolls", sets: "1", reps: "10 each way", rest: "0s", notes: "Slow and controlled" },
      { name: "Scapular Squeeze", sets: "1", reps: "10 reps", rest: "0s", notes: "Squeeze shoulder blades, hold 2 sec" },
      { name: "Wall Slides (small range)", sets: "1", reps: "8 reps", rest: "30s", notes: "Only as high as stays pain-free" },
      { name: "Neck Side Stretch", sets: "1", reps: "20 sec each", rest: "0s", notes: "Releases upper trap before shoulder work" },
    ],
    cooldown: [
      { name: "Cross-body Shoulder Stretch", sets: "1", reps: "20 sec each", rest: "10s", notes: "Gentle, never forced" },
      { name: "Doorway Chest Stretch", sets: "1", reps: "20 sec", rest: "10s", notes: "Pain-free range only" },
      { name: "Upper Trap Stretch", sets: "1", reps: "20 sec each", rest: "10s", notes: "Opposite hand under the seat if sitting" },
      { name: "Deep Breathing", sets: "1", reps: "60 sec", rest: "0s", notes: "Shoulders down and relaxed" },
    ],
    days: [
      {
        name: "Day 1 — Mobility & Activation",
        exercises: [
          { name: "Pendulum Swing", sets: "2", reps: "30 sec each arm", rest: "30s", notes: "Lean forward, let arm swing gently" },
          { name: "Band External Rotation", sets: "3", reps: "12 each", rest: "45s", notes: "Elbow at side, light band" },
          { name: "Band Internal Rotation", sets: "3", reps: "12 each", rest: "45s", notes: "" },
          { name: "Wall Slides", sets: "3", reps: "10", rest: "45s", notes: "Back against wall, slide arms up slowly" },
          { name: "Scapular Squeeze", sets: "3", reps: "12", rest: "30s", notes: "Squeeze shoulder blades together" },
        ]
      },
      {
        name: "Day 2 — Strength & Stability",
        exercises: [
          { name: "Band Front Raise (light)", sets: "3", reps: "10", rest: "45s", notes: "Keep pain-free range only" },
          { name: "Band Lateral Raise (light)", sets: "3", reps: "10", rest: "45s", notes: "" },
          { name: "Prone Y-T-W Raises (no weight)", sets: "2", reps: "8 each letter", rest: "45s", notes: "Lying face down, rotator cuff activation" },
          { name: "Massager — Upper Trap & Shoulder", sets: "1", reps: "5 min", rest: "0s", notes: "Low setting, avoid bone directly" },
          { name: "Cross-body Shoulder Stretch", sets: "2", reps: "20 sec each", rest: "20s", notes: "Gentle, never forced" },
        ]
      }
    ]
  },
  {
    id: "kneefriendly", level: "clinical", name: "Knee Pain Friendly", nameAr: "تمارين مناسبة لألم الركبة",
    color: "#eab308", emoji: "🦵",
    desc: "Low-impact strength training that protects the knees while building leg strength",
    descAr: "تدريب منخفض التأثير يحمي الركبة مع بناء قوة الأرجل",
    weeks: 6, deloadEvery: 0,
    warmup: [
      { name: "Stationary Bike or Light Walk", sets: "1", reps: "5 min", rest: "0s", notes: "Best knee warm-up there is — no impact" },
      { name: "Ankle Pumps", sets: "1", reps: "15 each", rest: "0s", notes: "Point and flex" },
      { name: "Seated Knee Extensions (bodyweight)", sets: "1", reps: "10 each", rest: "0s", notes: "Small range, no weight — just warming the joint" },
      { name: "Straight Leg Raises", sets: "1", reps: "8 each", rest: "0s", notes: "Quad activation without bending the knee" },
      { name: "Glute Bridge (warm-up reps)", sets: "1", reps: "8 reps", rest: "0s", notes: "Wakes the hips so the knee does less work" },
      { name: "Standing Hip Circles (small)", sets: "1", reps: "8 each way", rest: "30s", notes: "Hold support, small controlled circles" },
    ],
    cooldown: [
      { name: "Seated Hamstring Stretch", sets: "1", reps: "20 sec each", rest: "10s", notes: "Sit tall, heel on floor" },
      { name: "Standing Quad Stretch (with support)", sets: "1", reps: "20 sec each", rest: "10s", notes: "Hold a wall or chair" },
      { name: "Calf Stretch (wall)", sets: "1", reps: "20 sec each", rest: "10s", notes: "Back heel down, front knee bent" },
      { name: "Foam Roller Quad (above knee only)", sets: "1", reps: "45 sec each", rest: "10s", notes: "Never roll over the kneecap or joint line" },
      { name: "Deep Breathing", sets: "1", reps: "60 sec", rest: "0s", notes: "" },
    ],
    days: [
      {
        name: "Day 1 — Quad & Glute Activation (Low Impact)",
        exercises: [
          { name: "Straight Leg Raises (lying)", sets: "3", reps: "12 each", rest: "45s", notes: "No knee bending — quad activation" },
          { name: "Glute Bridge", sets: "3", reps: "12", rest: "45s", notes: "Strengthens hips, supports knees" },
          { name: "Wall Sit (shallow angle only)", sets: "2", reps: "15-20 sec", rest: "45s", notes: "Stop if any knee discomfort" },
          { name: "Band Seated Leg Extension", sets: "3", reps: "10 each", rest: "45s", notes: "Light resistance only" },
          { name: "Foam Roller Quads & Outer Thigh", sets: "1", reps: "60 sec each", rest: "0s", notes: "Gentle rolling above the knee — never on the kneecap" },
        ]
      },
      {
        name: "Day 2 — Stability & Low Impact Cardio",
        exercises: [
          { name: "Clamshells (band optional)", sets: "3", reps: "12 each", rest: "30s", notes: "Hip stability, protects knee tracking" },
          { name: "Step-ups (low step, controlled)", sets: "2", reps: "8 each", rest: "45s", notes: "Use low step, avoid if painful" },
          { name: "Stationary Bike or Pool Walking", sets: "1", reps: "15-20 min", rest: "0s", notes: "Best low-impact cardio for knees" },
          { name: "Pilates Ring Inner Thigh Squeeze", sets: "3", reps: "12", rest: "30s", notes: "Seated or lying, gentle" },
          { name: "Hand Massager — Around Knee (not on joint)", sets: "1", reps: "5 min", rest: "0s", notes: "Massage quad/calf, avoid joint line" },
        ]
      }
    ]
  }
];

// ── TRAINING LEVELS ────────────────────────────────────────
// Gates what a client should be shown. "clinical" systems are conditioning
// programmes built around a limitation — they are not medical treatment and
// need a screening conversation before being assigned.
export const LEVEL_META = {
  beginner:     { label: "Beginner",     labelAr: "مبتدئ",  color: "#12795A" },
  intermediate: { label: "Intermediate", labelAr: "متوسط",  color: "#21509B" },
  advanced:     { label: "Advanced",     labelAr: "متقدم",  color: "#A63A3A",
    warn: "Advanced system — heavy or technical lifts and high weekly volume. Assign only to a client with a solid training base and sound technique.",
    warnAr: "نظام متقدم — تمارين ثقيلة أو تقنية وحجم تدريبي عالٍ. لا يُسند إلا لعميل لديه أساس تدريبي جيد وتقنية سليمة." },
  clinical:     { label: "Clinical",     labelAr: "تأهيلي", color: "#06b6d4",
    warn: "Conditioning programme, not medical treatment. Screen the client first, and refer to a physiotherapist or doctor for undiagnosed, worsening or radiating pain.",
    warnAr: "برنامج تأهيل بدني وليس علاجاً طبياً. افحص العميل أولاً، وحوّله إلى أخصائي علاج طبيعي أو طبيب في حال وجود ألم غير مشخّص أو متزايد أو ممتد." },
};
