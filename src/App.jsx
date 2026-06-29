import { useState, useEffect, useCallback } from "react";
import { ExerciseIllustration } from "./ExerciseIllustration";

/* ═══════════════════════════════════════════════════════════
   PHYSICAL DEFINITION v7
   - 9 Workout Training Systems
   - Professional PDF (Client + Workout + Nutrition)
   - Arabic / English
   - TEE + PAL Calorie Calculation
   - Meal Plans with Photos + Macros
   - Client Management (Add/Edit/Delete/Disable)
   - Registration + Admin Approval
   - WhatsApp Share
═══════════════════════════════════════════════════════════ */

// ── TRANSLATIONS ──────────────────────────────────────────
const T = {
  en: {
    appName: "PHYSICAL DEFINITION", tagline: "Your Fitness Journey Starts Here",
    enter: "ENTER →", email: "Email / Username", password: "Password",
    newMember: "New member? Register here →", welcome: "Welcome",
    profile: "Profile", workout: "Workout", nutrition: "Nutrition", progress: "Progress",
    dashboard: "Dashboard", clients: "Clients", aiTools: "AI Tools", plans: "Plans", requests: "Requests",
    addClient: "+ ADD", edit: "Edit", save: "Save", cancel: "Cancel", logout: "Sign Out",
    age: "Age", weight: "Weight", height: "Height", goal: "Goal", gender: "Gender",
    male: "Male", female: "Female", active: "Active", disabled: "Disabled",
    shareLogin: "Share Login via WhatsApp", approve: "Approve", reject: "Reject",
    noPlan: "No plan yet", trainerWillAdd: "Your trainer will add a plan soon",
    chooseMeal: "🍽️ Choose", chooseWorkout: "🏋️ Choose Workout Type",
    writeManual: "✏️ Write", memberSince: "Member since", yourTrainer: "Your Trainer",
    bmi: "BMI", tdee: "Energy & Macros (TDEE)", maintenance: "Maintenance", target: "Target",
    activityLevel: "Activity Level", fullName: "Full Name", phone: "WhatsApp",
    passwordAuto: "Password (blank = auto)", addShare: "ADD & SHARE →",
    credentialsSent: "Client Added!", shareDetails: "Share login details with",
    sendWhatsapp: "💬 Send via WhatsApp", copyCredentials: "📋 Copy Credentials",
    downloadPDF: "📄 Download Full PDF", close: "Close",
    registrationLink: "Registration Link", copyLink: "📋 Copy",
    pendingRequests: "Pending Requests", noRequests: "No pending requests",
    invalidCredentials: "Invalid credentials. Please try again.",
    accountDisabled: "Account disabled. Contact your trainer.",
    regSubmitted: "Request Submitted!", regApproval: "You'll receive login details on WhatsApp after approval.",
    joinUs: "JOIN US TODAY", submitRequest: "SUBMIT REQUEST →",
    alreadyAccount: "Already have an account?", loginHere: "Login here",
    goalsDistribution: "Goals Distribution", total: "Total", pending: "Pending",
    selectClient: "Select a client", pdfTitle: "Training Plan",
    workoutSystem: "Workout System", selectSystem: "Select Training System",
    exercises: "Exercises", sets: "Sets", reps: "Reps", rest: "Rest",
    addExercise: "+ Add Exercise", removeExercise: "Remove",
    day: "Day", week: "Week", intensity: "Intensity",
    shareRegLink: "Share Registration Link",
  },
  ar: {
    appName: "فيزيكال ديفينيشن", tagline: "ابدأ رحلتك نحو اللياقة البدنية",
    enter: "دخول ←", email: "البريد الإلكتروني", password: "كلمة المرور",
    newMember: "عضو جديد؟ سجّل هنا ←", welcome: "أهلاً",
    profile: "الملف الشخصي", workout: "تمارين", nutrition: "التغذية", progress: "التقدم",
    dashboard: "لوحة التحكم", clients: "العملاء", aiTools: "أدوات الذكاء الاصطناعي", plans: "الخطط", requests: "الطلبات",
    addClient: "+ إضافة", edit: "تعديل", save: "حفظ", cancel: "إلغاء", logout: "خروج",
    age: "العمر", weight: "الوزن", height: "الطول", goal: "الهدف", gender: "الجنس",
    male: "ذكر", female: "أنثى", active: "نشط", disabled: "معطّل",
    shareLogin: "مشاركة بيانات الدخول", approve: "موافقة", reject: "رفض",
    noPlan: "لا توجد خطة", trainerWillAdd: "سيضيف المدرب خطتك قريباً",
    chooseMeal: "🍽️ اختيار", chooseWorkout: "🏋️ اختر نظام التمرين",
    writeManual: "✏️ كتابة", memberSince: "عضو منذ", yourTrainer: "مدربك",
    bmi: "مؤشر كتلة الجسم", tdee: "الطاقة والمغذيات", maintenance: "الصيانة", target: "الهدف",
    activityLevel: "مستوى النشاط", fullName: "الاسم الكامل", phone: "واتساب",
    passwordAuto: "كلمة المرور (فارغ = تلقائي)", addShare: "إضافة ومشاركة ←",
    credentialsSent: "تمت إضافة العميل!", shareDetails: "شارك بيانات الدخول مع",
    sendWhatsapp: "💬 إرسال عبر واتساب", copyCredentials: "📋 نسخ البيانات",
    downloadPDF: "📄 تحميل PDF", close: "إغلاق",
    registrationLink: "رابط التسجيل", copyLink: "📋 نسخ",
    pendingRequests: "الطلبات المعلقة", noRequests: "لا توجد طلبات",
    invalidCredentials: "بيانات غير صحيحة.", accountDisabled: "تم تعطيل حسابك.",
    regSubmitted: "تم إرسال الطلب!", regApproval: "ستتلقى بيانات الدخول عبر واتساب.",
    joinUs: "انضم إلينا", submitRequest: "إرسال الطلب ←",
    alreadyAccount: "لديك حساب؟", loginHere: "تسجيل الدخول",
    goalsDistribution: "توزيع الأهداف", total: "المجموع", pending: "معلق",
    selectClient: "اختر عميلاً", pdfTitle: "خطة التدريب",
    workoutSystem: "نظام التمرين", selectSystem: "اختر نظام التدريب",
    exercises: "التمارين", sets: "المجموعات", reps: "التكرارات", rest: "الراحة",
    addExercise: "+ إضافة تمرين", removeExercise: "حذف",
    day: "اليوم", week: "الأسبوع", intensity: "الشدة",
    shareRegLink: "مشاركة رابط التسجيل",
  }
};

// ── WORKOUT SYSTEMS ────────────────────────────────────────
const WORKOUT_SYSTEMS = [
  {
    id: "ppl", name: "Push / Pull / Legs", nameAr: "دفع / سحب / أرجل",
    color: "#ef4444", emoji: "💪",
    desc: "3-day split targeting pushing, pulling, and leg movements",
    descAr: "تقسيم 3 أيام للدفع والسحب والأرجل",
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
    id: "upperlower", name: "Upper / Lower Split", nameAr: "تقسيم علوي / سفلي",
    color: "#f59e0b", emoji: "⚡",
    desc: "4-day split alternating upper and lower body training",
    descAr: "تقسيم 4 أيام بين الجزء العلوي والسفلي",
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
    id: "fst7", name: "FST-7 Training", nameAr: "تدريب FST-7",
    color: "#9333ea", emoji: "🔥",
    desc: "Fascia Stretch Training — 7 sets on last exercise to maximize pump",
    descAr: "تمدد اللفافة — 7 مجموعات في آخر تمرين لأقصى ضخ",
    days: [
      {
        name: "Day 1 — Chest (FST-7)",
        exercises: [
          { name: "Incline Barbell Press", sets: "4", reps: "8-10", rest: "90s", notes: "Warm up chest" },
          { name: "Flat Dumbbell Press", sets: "4", reps: "10-12", rest: "75s", notes: "" },
          { name: "Pec Dec / Cable Fly", sets: "7", reps: "12", rest: "30s", notes: "⭐ FST-7 — short rest, max pump!" },
        ]
      },
      {
        name: "Day 2 — Back (FST-7)",
        exercises: [
          { name: "Deadlift", sets: "4", reps: "6-8", rest: "2min", notes: "Heavy compound" },
          { name: "T-Bar Row", sets: "4", reps: "10", rest: "90s", notes: "" },
          { name: "Straight Arm Pulldown", sets: "7", reps: "12", rest: "30s", notes: "⭐ FST-7 — lat stretch + pump" },
        ]
      },
      {
        name: "Day 3 — Shoulders (FST-7)",
        exercises: [
          { name: "Seated DB Overhead Press", sets: "4", reps: "10-12", rest: "90s", notes: "" },
          { name: "Lateral Raises", sets: "4", reps: "12-15", rest: "60s", notes: "" },
          { name: "Cable Lateral Raise", sets: "7", reps: "12", rest: "30s", notes: "⭐ FST-7 — side delt pump" },
        ]
      },
      {
        name: "Day 4 — Arms (FST-7)",
        exercises: [
          { name: "Barbell Curl", sets: "4", reps: "10", rest: "75s", notes: "" },
          { name: "Close Grip Bench Press", sets: "4", reps: "10", rest: "75s", notes: "" },
          { name: "Cable Curl", sets: "7", reps: "12", rest: "30s", notes: "⭐ FST-7 bicep" },
          { name: "Cable Pushdown", sets: "7", reps: "12", rest: "30s", notes: "⭐ FST-7 tricep" },
        ]
      },
      {
        name: "Day 5 — Legs (FST-7)",
        exercises: [
          { name: "Squat", sets: "4", reps: "10-12", rest: "2min", notes: "" },
          { name: "Leg Press", sets: "4", reps: "12-15", rest: "90s", notes: "" },
          { name: "Leg Extension", sets: "7", reps: "12", rest: "30s", notes: "⭐ FST-7 quad pump" },
          { name: "Leg Curl", sets: "7", reps: "12", rest: "30s", notes: "⭐ FST-7 hamstring" },
        ]
      }
    ]
  },
  {
    id: "superset", name: "Superset Training", nameAr: "تدريب السوبرسيت",
    color: "#22c55e", emoji: "⚡",
    desc: "Pair antagonist muscles — maximum efficiency, time-saving",
    descAr: "تدريب العضلات المتعاكسة معاً — كفاءة عالية",
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
    id: "circuit", name: "Circuit Training", nameAr: "التدريب الدائري",
    color: "#60a5fa", emoji: "🔄",
    desc: "All exercises back-to-back with minimal rest — fat burn + conditioning",
    descAr: "جميع التمارين متتالية مع راحة قليلة",
    days: [
      {
        name: "Circuit A — Full Body (Repeat 3-4 rounds)",
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
        name: "Circuit B — Upper Body Focus (Repeat 3-4 rounds)",
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
        name: "Circuit C — Lower Body + Core (Repeat 3-4 rounds)",
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
    id: "fullbody", name: "Full Body Training", nameAr: "تدريب الجسم الكامل",
    color: "#f97316", emoji: "🏋️",
    desc: "3x/week full body — ideal for beginners and natural athletes",
    descAr: "3 مرات أسبوعياً — مثالي للمبتدئين",
    days: [
      {
        name: "Day A — Full Body (Mon/Wed/Fri)",
        exercises: [
          { name: "Squat", sets: "4", reps: "6-8", rest: "2min", notes: "Main compound" },
          { name: "Bench Press", sets: "4", reps: "6-8", rest: "2min", notes: "" },
          { name: "Deadlift", sets: "3", reps: "5", rest: "2min", notes: "Heavy" },
          { name: "Pull-ups", sets: "3", reps: "8-10", rest: "90s", notes: "" },
          { name: "Overhead Press", sets: "3", reps: "8-10", rest: "90s", notes: "" },
          { name: "Plank", sets: "3", reps: "60 sec", rest: "30s", notes: "Core" },
        ]
      },
      {
        name: "Day B — Full Body (Alternate)",
        exercises: [
          { name: "Romanian Deadlift", sets: "4", reps: "8-10", rest: "90s", notes: "" },
          { name: "Incline DB Press", sets: "4", reps: "10-12", rest: "75s", notes: "" },
          { name: "Barbell Row", sets: "4", reps: "8-10", rest: "90s", notes: "" },
          { name: "Leg Press", sets: "3", reps: "12-15", rest: "75s", notes: "" },
          { name: "Lateral Raises", sets: "3", reps: "15", rest: "60s", notes: "" },
          { name: "Cable Curl + Pushdown", sets: "3", reps: "12", rest: "60s", notes: "Superset arms" },
        ]
      }
    ]
  },
  {
    id: "hiit", name: "HIIT Training", nameAr: "تدريب HIIT",
    color: "#ef4444", emoji: "🔥",
    desc: "High Intensity Interval Training — maximum calorie burn",
    descAr: "تدريب متقطع عالي الكثافة — حرق أقصى للسعرات",
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
          { name: "Jump Squats", sets: "5", reps: "20 sec on / 10 sec off", rest: "60s", notes: "Tabata style" },
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
    id: "crossfit", name: "CrossFit Style", nameAr: "أسلوب كروسفيت",
    color: "#0ea5e9", emoji: "🏆",
    desc: "Functional fitness — strength, cardio, and gymnastics combined",
    descAr: "لياقة وظيفية — قوة وكارديو وجمباز معاً",
    days: [
      {
        name: "WOD 1 — \"Fran\" Style",
        exercises: [
          { name: "Thrusters (Barbell 42.5kg)", sets: "3 rounds", reps: "21-15-9", rest: "As needed", notes: "For time" },
          { name: "Pull-ups", sets: "3 rounds", reps: "21-15-9", rest: "As needed", notes: "For time" },
        ]
      },
      {
        name: "WOD 2 — AMRAP 20 min",
        exercises: [
          { name: "5 Pull-ups", sets: "AMRAP", reps: "As many rounds as possible", rest: "0s", notes: "20 min clock" },
          { name: "10 Push-ups", sets: "AMRAP", reps: "", rest: "0s", notes: "" },
          { name: "15 Air Squats", sets: "AMRAP", reps: "", rest: "0s", notes: "" },
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
    id: "arnold", name: "Arnold Split", nameAr: "تقسيم أرنولد",
    color: "#d4af37", emoji: "🌟",
    desc: "6-day split by Arnold Schwarzenegger — classic bodybuilding",
    descAr: "تقسيم 6 أيام بأسلوب أرنولد — بناء جسم كلاسيكي",
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
    id: "homebw", name: "Home Bodyweight", nameAr: "تمارين منزلية بوزن الجسم",
    color: "#10b981", emoji: "🏠",
    desc: "No equipment needed — train anywhere using only your body weight",
    descAr: "بدون معدات — تدريب في أي مكان بوزن الجسم فقط",
    days: [
      {
        name: "Day 1 — Upper Body (Bodyweight)",
        exercises: [
          { name: "Push-ups", sets: "4", reps: "10-15", rest: "60s", notes: "Knee push-ups if needed" },
          { name: "Incline Push-ups (on table/wall)", sets: "3", reps: "12", rest: "45s", notes: "Easier variation" },
          { name: "Tricep Dips (chair)", sets: "3", reps: "12", rest: "45s", notes: "Use sturdy chair" },
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
          { name: "Jumping Jacks", sets: "3", reps: "30 sec", rest: "30s", notes: "Cardio finisher" },
        ]
      }
    ]
  },
  {
    id: "senior75", name: "Senior Fitness 75+", nameAr: "لياقة كبار السن 75+",
    color: "#06b6d4", emoji: "🧓",
    desc: "Gentle, safe training using resistance bands, foam roller, Pilates ring & self-massage — designed for elderly clients",
    descAr: "تدريب لطيف وآمن باستخدام أحزمة المقاومة وأسطوانة الفوم وحلقة البيلاتس — مصمم لكبار السن",
    days: [
      {
        name: "Day 1 — Seated & Standing Mobility",
        exercises: [
          { name: "Seated Resistance Band Row", sets: "3", reps: "10-12", rest: "60s", notes: "Light band — improves posture" },
          { name: "Band Lateral Walk", sets: "2", reps: "10 steps each", rest: "60s", notes: "Loop band around ankles, hold support if needed" },
          { name: "Pilates Ring Knee Squeeze (seated)", sets: "3", reps: "12", rest: "45s", notes: "Inner thigh + pelvic floor, very gentle" },
          { name: "Standing Wall Push-ups", sets: "2", reps: "8-10", rest: "60s", notes: "Hands on wall, gentle chest/arm work" },
          { name: "Foam Roller Calf Release", sets: "1", reps: "60 sec each", rest: "0s", notes: "Slow, gentle rolling — no pain" },
        ]
      },
      {
        name: "Day 2 — Balance & Gentle Strength",
        exercises: [
          { name: "Chair-Assisted Mini Squats", sets: "3", reps: "8", rest: "60s", notes: "Hold chair back for support" },
          { name: "Band Seated Leg Extension", sets: "2", reps: "10 each", rest: "45s", notes: "Light tension band around ankle" },
          { name: "Pilates Ring Chest Press (seated)", sets: "3", reps: "10", rest: "45s", notes: "Squeeze ring between palms" },
          { name: "Single Leg Stand (hold support)", sets: "2", reps: "15 sec each", rest: "30s", notes: "Balance — always near wall/chair" },
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
          { name: "Deep Breathing + Gentle Neck Stretch", sets: "1", reps: "5 min", rest: "0s", notes: "Relaxation finish" },
        ]
      }
    ]
  },
  {
    id: "lowback", name: "Lower Back Pain Relief", nameAr: "تخفيف آلام أسفل الظهر",
    color: "#f43f5e", emoji: "🩹",
    desc: "Gentle core stabilization and mobility work to relieve and prevent lower back pain",
    descAr: "تمارين لطيفة لتقوية الجذع وتحسين الحركة لتخفيف آلام أسفل الظهر",
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
    id: "shoulder", name: "Shoulder Pain Rehab", nameAr: "علاج تأهيلي لألم الكتف",
    color: "#8b5cf6", emoji: "💢",
    desc: "Rotator cuff strengthening and mobility to relieve shoulder pain and improve range of motion",
    descAr: "تقوية الكتف وتحسين المرونة لتخفيف الألم",
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
    id: "kneefriendly", name: "Knee Pain Friendly", nameAr: "تمارين مناسبة لألم الركبة",
    color: "#eab308", emoji: "🦵",
    desc: "Low-impact strength training that protects the knees while building leg strength",
    descAr: "تدريب منخفض التأثير يحمي الركبة مع بناء قوة الأرجل",
    days: [
      {
        name: "Day 1 — Quad & Glute Activation (Low Impact)",
        exercises: [
          { name: "Straight Leg Raises (lying)", sets: "3", reps: "12 each", rest: "45s", notes: "No knee bending — quad activation" },
          { name: "Glute Bridge", sets: "3", reps: "12", rest: "45s", notes: "Strengthens hips, supports knees" },
          { name: "Wall Sit (shallow angle only)", sets: "2", reps: "15-20 sec", rest: "45s", notes: "Stop if any knee discomfort" },
          { name: "Band Seated Leg Extension", sets: "3", reps: "10 each", rest: "45s", notes: "Light resistance only" },
          { name: "Foam Roller Quad & IT Band Release", sets: "1", reps: "60 sec each", rest: "0s", notes: "Gentle rolling above knee" },
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

// ── MEAL PLANS ─────────────────────────────────────────────
const MEALS = [
  { id: "kerala", name: "Kerala Balanced", nameAr: "نظام كيرالا", emoji: "🍚", color: "#f59e0b", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=75", baseCal: 1800, meals: [{ time: "7:00", name: "Breakfast", nameAr: "إفطار", items: "Puttu 150g + Kadala curry 120g + Banana × 1", cal: 380, p: 14, c: 62, f: 8 }, { time: "10:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Coconut water 200ml + Nuts 20g", cal: 180, p: 4, c: 22, f: 9 }, { time: "13:00", name: "Lunch", nameAr: "غداء", items: "Brown rice 150g + Dal 100g + Fish curry 120g + Veg 80g", cal: 520, p: 32, c: 68, f: 12 }, { time: "16:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Banana × 1 + Green tea 200ml", cal: 120, p: 2, c: 28, f: 0 }, { time: "19:00", name: "Dinner", nameAr: "عشاء", items: "Chapati × 3 + Chicken curry 150g + Salad 80g", cal: 480, p: 38, c: 52, f: 10 }] },
  { id: "protein", name: "High Protein", nameAr: "بروتين عالي", emoji: "💪", color: "#ef4444", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=75", baseCal: 2200, meals: [{ time: "7:00", name: "Breakfast", nameAr: "إفطار", items: "Egg whites × 6 + Oats 60g + Milk 200ml", cal: 450, p: 42, c: 38, f: 12 }, { time: "10:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Protein shake 30g + Apple × 1", cal: 250, p: 25, c: 30, f: 4 }, { time: "13:00", name: "Lunch", nameAr: "غداء", items: "Grilled chicken 200g + Brown rice 120g + Veg 80g", cal: 550, p: 48, c: 55, f: 10 }, { time: "16:30", name: "Pre-workout", nameAr: "قبل التمرين", items: "Banana × 1 + Peanut butter toast 40g", cal: 320, p: 10, c: 48, f: 10 }, { time: "19:30", name: "Dinner", nameAr: "عشاء", items: "Grilled fish 180g + Sweet potato 150g + Salad 80g", cal: 420, p: 40, c: 42, f: 8 }] },
  { id: "fatburn", name: "Fat Burn", nameAr: "حرق الدهون", emoji: "🔥", color: "#22c55e", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=75", baseCal: 1500, meals: [{ time: "7:00", name: "Breakfast", nameAr: "إفطار", items: "Greek yogurt 150g + Berries 60g + Chia 10g", cal: 220, p: 18, c: 22, f: 6 }, { time: "10:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Cucumber 100g + Hummus 40g", cal: 120, p: 5, c: 14, f: 5 }, { time: "13:00", name: "Lunch", nameAr: "غداء", items: "Grilled chicken salad 200g + Olive oil 10ml", cal: 380, p: 35, c: 20, f: 14 }, { time: "16:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Almonds 20g + Black coffee 150ml", cal: 170, p: 6, c: 6, f: 14 }, { time: "19:00", name: "Dinner", nameAr: "عشاء", items: "Steamed fish 150g + Vegetables 100g + Dal soup 100g", cal: 380, p: 38, c: 28, f: 8 }] },
  { id: "veg", name: "Vegetarian", nameAr: "نباتي", emoji: "🥗", color: "#60a5fa", image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&q=75", baseCal: 1900, meals: [{ time: "7:00", name: "Breakfast", nameAr: "إفطار", items: "Idli × 4 + Sambar 100g + Chutney 30g", cal: 360, p: 12, c: 68, f: 6 }, { time: "10:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Fruit bowl 150g + Buttermilk 200ml", cal: 200, p: 6, c: 38, f: 2 }, { time: "13:00", name: "Lunch", nameAr: "غداء", items: "Brown rice 150g + Rajma 100g + Paneer 80g + Salad 60g", cal: 560, p: 28, c: 72, f: 14 }, { time: "16:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Roasted chana 40g + Green tea 200ml", cal: 180, p: 10, c: 28, f: 4 }, { time: "19:00", name: "Dinner", nameAr: "عشاء", items: "Roti × 3 + Dal makhani 120g + Veg curry 100g", cal: 480, p: 22, c: 72, f: 10 }] },
  { id: "bulk", name: "Muscle Builder", nameAr: "بناء العضلات", emoji: "🏋️", color: "#9333ea", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=75", baseCal: 2800, meals: [{ time: "7:00", name: "Breakfast", nameAr: "إفطار", items: "Eggs × 4 + Oats 80g + Banana × 1 + Full fat milk 250ml", cal: 620, p: 38, c: 78, f: 16 }, { time: "10:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Mass gainer 60g + Dates 40g", cal: 480, p: 32, c: 72, f: 8 }, { time: "13:00", name: "Lunch", nameAr: "غداء", items: "White rice 180g + Chicken 250g + Dal 100g + Ghee 10g", cal: 680, p: 52, c: 80, f: 18 }, { time: "16:30", name: "Pre-workout", nameAr: "قبل التمرين", items: "Banana × 2 + Peanut butter 30g + Toast × 2", cal: 420, p: 14, c: 68, f: 12 }, { time: "20:00", name: "Dinner", nameAr: "عشاء", items: "Chapati × 4 + Mutton curry 200g + Milk 200ml", cal: 680, p: 48, c: 78, f: 20 }] },
];

// Scale a meal plan's quantities + macros to match a target calorie goal
function scaleMealPlan(plan, targetCal) {
  const factor = targetCal / plan.baseCal;
  const clampedFactor = Math.max(0.55, Math.min(1.8, factor)); // keep portions realistic
  const scaledMeals = plan.meals.map(m => ({
    ...m,
    items: scaleItemsText(m.items, clampedFactor),
    cal: Math.round(m.cal * clampedFactor),
    p: Math.round(m.p * clampedFactor),
    c: Math.round(m.c * clampedFactor),
    f: Math.round(m.f * clampedFactor),
  }));
  return { ...plan, meals: scaledMeals, scaleFactor: clampedFactor };
}

// Scale numeric quantities inside an item description string (e.g. "200g" -> "260g", "× 3" -> "× 4")
function scaleItemsText(text, factor) {
  return text.replace(/(\d+(?:\.\d+)?)(g|ml|kg|l)\b/gi, (match, num, unit) => {
    const scaled = Math.round(parseFloat(num) * factor);
    return `${scaled}${unit}`;
  }).replace(/×\s*(\d+)/g, (match, num) => {
    const scaled = Math.max(1, Math.round(parseFloat(num) * factor));
    return `× ${scaled}`;
  });
}

const PAL = [
  { id: "sedentary", en: "Sedentary", ar: "خامل", desc_en: "No exercise", desc_ar: "لا تمارين", factor: 1.2, icon: "🪑" },
  { id: "light", en: "Light", ar: "خفيف", desc_en: "1-3 days/week", desc_ar: "1-3 أيام/أسبوع", factor: 1.375, icon: "🚶" },
  { id: "moderate", en: "Moderate", ar: "معتدل", desc_en: "3-5 days/week", desc_ar: "3-5 أيام/أسبوع", factor: 1.55, icon: "🏃" },
  { id: "active", en: "Active", ar: "نشط", desc_en: "6-7 days/week", desc_ar: "6-7 أيام/أسبوع", factor: 1.725, icon: "💪" },
  { id: "very_active", en: "Very Active", ar: "نشط جداً", desc_en: "Physical job", desc_ar: "عمل بدني", factor: 1.9, icon: "🔥" },
];

const GOALS_EN = ["Weight Loss", "Muscle Gain", "Endurance", "Flexibility", "General Fitness"];
const GOALS_AR = ["خسارة الوزن", "بناء العضلات", "التحمل", "المرونة", "اللياقة العامة"];

const COUNTRIES = [
  { code: "+974", flag: "🇶🇦", name: "Qatar" }, { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+971", flag: "🇦🇪", name: "UAE" }, { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+965", flag: "🇰🇼", name: "Kuwait" }, { code: "+973", flag: "🇧🇭", name: "Bahrain" },
  { code: "+968", flag: "🇴🇲", name: "Oman" }, { code: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "+44", flag: "🇬🇧", name: "UK" }, { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+92", flag: "🇵🇰", name: "Pakistan" }, { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+63", flag: "🇵🇭", name: "Philippines" }, { code: "+94", flag: "🇱🇰", name: "Sri Lanka" },
];

const TRAINER = { name: "MUHAMMED RAFI", designation: "Certified Personal Trainer", designationAr: "مدرب شخصي معتمد", whatsapp: "97471000786", appUrl: "https://physical-definition.vercel.app" };
const ADMIN = { u: "admin", p: "pd@rafi2024" };
const SK = "pd_v7_clients"; const RK = "pd_v7_regs"; const LK = "pd_v7_lang";

// Progress photos helpers
const dbGetPhotos = async (clientId) => {
  const { data, error } = await supabase.from("progress_photos").select("*").eq("client_id", clientId).order("taken_at", { ascending: false });
  if (error) { console.error("getPhotos:", error); return []; }
  return data;
};
const dbAddPhoto = async (clientId, file, weight, notes) => {
  const ext = file.name.split(".").pop();
  const path = `${clientId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("progress-photos").upload(path, file);
  if (upErr) { console.error("upload:", upErr); return null; }
  const { data: { publicUrl } } = supabase.storage.from("progress-photos").getPublicUrl(path);
  const { data, error } = await supabase.from("progress_photos").insert([{ client_id: clientId, photo_url: publicUrl, weight: weight ? +weight : null, notes, taken_at: new Date().toISOString().split("T")[0] }]).select().single();
  if (error) { console.error("addPhoto:", error); return null; }
  return data;
};
const dbDeletePhoto = async (id, photoUrl) => {
  const path = photoUrl.split("/progress-photos/")[1];
  if (path) await supabase.storage.from("progress-photos").remove([path]);
  await supabase.from("progress_photos").delete().eq("id", id);
};

// ── SUPABASE ───────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPA_URL, SUPA_KEY);

// DB helpers
const dbGetClients = async () => {
  const { data, error } = await supabase.from("clients").select("*").order("id");
  if (error) { console.error("getClients:", error); return null; }
  return data.map(r => ({
    id: r.id, name: r.name, email: r.email, password: r.password,
    age: r.age, weight: r.weight, height: r.height, gender: r.gender,
    goal: r.goal, pal: r.pal, phone: r.phone,
    joinDate: r.join_date, status: r.status,
    workoutPlan: r.workout_plan, nutritionPlan: r.nutrition_plan,
    workoutSystemId: r.workout_system_id, mealPlanId: r.meal_plan_id,
    progress: r.progress || [],
  }));
};

const dbAddClient = async (c) => {
  const { data, error } = await supabase.from("clients").insert([{
    name: c.name, email: c.email, password: c.password,
    age: c.age, weight: c.weight, height: c.height, gender: c.gender,
    goal: c.goal, pal: c.pal, phone: c.phone,
    join_date: c.joinDate, status: c.status,
    workout_plan: c.workoutPlan, nutrition_plan: c.nutritionPlan,
    workout_system_id: c.workoutSystemId, meal_plan_id: c.mealPlanId,
    progress: c.progress || [],
  }]).select().single();
  if (error) { console.error("addClient:", error); return null; }
  return { ...c, id: data.id };
};

const dbUpdateClient = async (c) => {
  const { error } = await supabase.from("clients").update({
    name: c.name, email: c.email, password: c.password,
    age: c.age, weight: c.weight, height: c.height, gender: c.gender,
    goal: c.goal, pal: c.pal, phone: c.phone, status: c.status,
    workout_plan: c.workoutPlan, nutrition_plan: c.nutritionPlan,
    workout_system_id: c.workoutSystemId, meal_plan_id: c.mealPlanId,
    progress: c.progress || [],
  }).eq("id", c.id);
  if (error) console.error("updateClient:", error);
};

const dbDeleteClient = async (id) => {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) console.error("deleteClient:", error);
};

const dbGetRegs = async () => {
  const { data, error } = await supabase.from("registrations").select("*").order("id");
  if (error) { console.error("getRegs:", error); return null; }
  return data.map(r => ({ ...r, submittedAt: r.submitted_at }));
};

const dbAddReg = async (r) => {
  const { error } = await supabase.from("registrations").insert([{
    name: r.name, email: r.email, phone: r.phone,
    age: r.age ? +r.age : null, weight: r.weight ? +r.weight : null,
    height: r.height ? +r.height : null, gender: r.gender,
    goal: r.goal, pal: r.pal,
  }]);
  if (error) console.error("addReg:", error);
};

const dbDeleteReg = async (id) => {
  const { error } = await supabase.from("registrations").delete().eq("id", id);
  if (error) console.error("deleteReg:", error);
};

const ld = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const calcTDEE = (w, h, age, gender = "male", pal = 1.55) => {
  const bmr = gender === "male" ? 10 * w + 6.25 * h - 5 * age + 5 : 10 * w + 6.25 * h - 5 * age - 161;
  return Math.round(bmr * pal);
};
const goalCal = (tdee, goal) => {
  if (goal === "Weight Loss" || goal === "خسارة الوزن") return Math.round(tdee * 0.8);
  if (goal === "Muscle Gain" || goal === "بناء العضلات") return Math.round(tdee * 1.15);
  return tdee;
};

const DEMO = [
  { id: 1, name: "Arjun Menon", email: "arjun@email.com", password: "client123", age: 28, weight: 82, height: 175, gender: "male", goal: "Weight Loss", pal: "moderate", phone: "9876543210", joinDate: "2024-01-15", status: "Active", workoutPlan: null, nutritionPlan: null, workoutSystemId: null, mealPlanId: null, progress: [{ date: "2024-01-15", weight: 82 }, { date: "2024-02-15", weight: 79 }, { date: "2024-03-15", weight: 76 }] },
  { id: 2, name: "Priya Nair", email: "priya@email.com", password: "client456", age: 32, weight: 65, height: 162, gender: "female", goal: "Muscle Gain", pal: "light", phone: "9123456780", joinDate: "2024-02-10", status: "Active", workoutPlan: null, nutritionPlan: null, workoutSystemId: null, mealPlanId: null, progress: [{ date: "2024-02-10", weight: 65 }, { date: "2024-03-10", weight: 66.5 }, { date: "2024-04-10", weight: 68 }] },
];

const genPwd = () => { const c = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!"; return Array.from({ length: 9 }, () => c[Math.floor(Math.random() * c.length)]).join(""); };

// ── PDF GENERATOR ──────────────────────────────────────────
function generatePDF(client, lang) {
  const t = T[lang]; const isAr = lang === "ar";
  const pal = PAL.find(p => p.id === (client.pal || "moderate")) || PAL[2];
  const tdee = calcTDEE(client.weight, client.height, client.age, client.gender || "male", pal.factor);
  const target = goalCal(tdee, client.goal);
  const protein = Math.round(client.weight * 2.0);
  const fat = Math.round((target * 0.25) / 9);
  const carbs = Math.round((target - protein * 4 - fat * 9) / 4);
  const bmi = (client.weight / ((client.height / 100) ** 2)).toFixed(1);
  const workoutSystem = WORKOUT_SYSTEMS.find(w => w.id === client.workoutSystemId);
  const mealPlanRaw = MEALS.find(m => m.id === client.mealPlanId);
  const mealPlan = mealPlanRaw ? scaleMealPlan(mealPlanRaw, target) : null;

  // Build exercise GIF URLs for PDF using ExerciseDB cache
  const gifCache = {};
  const getGifForPDF = (exName) => {
    const cached = gifCache[exName];
    return cached ? `<img src="${cached}" alt="${exName}" style="width:80px;height:80px;object-fit:contain;border-radius:8px;background:#f5f5f5;" onerror="this.style.display='none'" />` : `<div style="width:80px;height:80px;background:#f5f5f5;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;">🏋️</div>`;
  };

  const workoutHTML = workoutSystem ? `
    <div class="section">
      <div class="section-title" style="color:${workoutSystem.color}">⚡ ${isAr ? workoutSystem.nameAr : workoutSystem.name}</div>
      <p style="color:#666;font-size:13px;margin-bottom:16px">${isAr ? workoutSystem.descAr : workoutSystem.desc}</p>
      ${workoutSystem.days.map(day => `
        <div class="day-block">
          <div class="day-title">${day.name}</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;padding:12px;">
            ${day.exercises.map(ex => `
              <div style="background:#f9f9f9;border-radius:10px;overflow:hidden;border:1px solid #eee;">
                <div style="background:#f0f0f0;padding:12px;display:flex;justify-content:center;align-items:center;min-height:90px;">
                  ${getGifForPDF(ex.name)}
                </div>
                <div style="padding:10px 12px;">
                  <div style="font-weight:700;font-size:13px;color:#111;margin-bottom:6px;">${ex.name}</div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <span style="background:${workoutSystem.color}20;color:${workoutSystem.color};font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;">Sets: ${ex.sets}</span>
                    <span style="background:#22c55e20;color:#22c55e;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;">Reps: ${ex.reps}</span>
                    <span style="background:#f59e0b20;color:#f59e0b;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;">Rest: ${ex.rest}</span>
                  </div>
                  ${ex.notes ? `<div style="font-size:11px;color:#888;margin-top:5px;">💡 ${ex.notes}</div>` : ""}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  ` : client.workoutPlan ? `
    <div class="section">
      <div class="section-title" style="color:#d4af37">⚡ ${isAr ? "خطة التمرين" : "Workout Plan"}</div>
      <pre style="white-space:pre-wrap;font-size:13px;line-height:1.8;color:#333">${client.workoutPlan}</pre>
    </div>
  ` : "";

  const nutritionHTML = mealPlan ? (() => {
    const tot = mealPlan.meals.reduce((a, m) => ({ cal: a.cal + m.cal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f }), { cal: 0, p: 0, c: 0, f: 0 });
    return `
    <div class="section">
      <div class="section-title" style="color:${mealPlan.color}">🥗 ${isAr ? mealPlan.nameAr : mealPlan.name}</div>
      <div class="macro-grid">
        <div class="macro-box" style="border-color:${mealPlan.color}"><div class="macro-val" style="color:${mealPlan.color}">${target}</div><div class="macro-label">${isAr ? "السعرات المستهدفة" : "Target Cal"}</div></div>
        <div class="macro-box"><div class="macro-val" style="color:#ef4444">${tot.p}g</div><div class="macro-label">${isAr ? "بروتين" : "Protein"}</div></div>
        <div class="macro-box"><div class="macro-val" style="color:#f59e0b">${tot.c}g</div><div class="macro-label">${isAr ? "كارب" : "Carbs"}</div></div>
        <div class="macro-box"><div class="macro-val" style="color:#60a5fa">${tot.f}g</div><div class="macro-label">${isAr ? "دهون" : "Fat"}</div></div>
      </div>
      <table class="ex-table">
        <tr><th>${isAr ? "الوقت" : "Time"}</th><th>${isAr ? "الوجبة" : "Meal"}</th><th>${isAr ? "الأطعمة" : "Foods"}</th><th>${isAr ? "سعرات" : "Cal"}</th><th>P/C/F</th></tr>
        ${mealPlan.meals.map(m => `<tr><td>${m.time}</td><td><strong>${isAr ? m.nameAr : m.name}</strong></td><td style="font-size:12px">${m.items}</td><td>${m.cal}</td><td style="font-size:11px;color:#666">${m.p}g/${m.c}g/${m.f}g</td></tr>`).join("")}
      </table>
    </div>
  `;
  })() : client.nutritionPlan ? `
    <div class="section">
      <div class="section-title" style="color:#22c55e">🥗 ${isAr ? "خطة التغذية" : "Nutrition Plan"}</div>
      <pre style="white-space:pre-wrap;font-size:13px;line-height:1.8;color:#333">${client.nutritionPlan}</pre>
    </div>
  ` : "";

  const html = `<!DOCTYPE html>
<html dir="${isAr ? "rtl" : "ltr"}" lang="${lang}">
<head>
<meta charset="UTF-8">
<title>Physical Definition — ${client.name}</title>
<style>
  body{font-family:${isAr ? "'Segoe UI',Tahoma,Arial" : "Arial,Inter"},sans-serif;background:#f8f8f8;margin:0;padding:20px;direction:${isAr ? "rtl" : "ltr"};}
  .container{max-width:800px;margin:0 auto;}
  .header{background:linear-gradient(135deg,#080600,#1a1400);border-radius:16px;padding:28px 32px;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
  .logo{font-size:26px;font-weight:900;color:#d4af37;letter-spacing:2px;}
  .tagline{font-size:12px;color:#7a6a30;letter-spacing:2px;margin-top:4px;}
  .trainer-name{font-size:14px;color:#d4af37;text-align:${isAr ? "left" : "right"};}
  .trainer-des{font-size:11px;color:#7a6a30;text-align:${isAr ? "left" : "right"};}
  .section{background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);}
  .section-title{font-size:18px;font-weight:800;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #f0e8cc;}
  .client-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;}
  .info-box{background:#f8f8f8;border-radius:8px;padding:12px;text-align:center;}
  .info-val{font-size:18px;font-weight:700;color:#080600;}
  .info-label{font-size:11px;color:#999;margin-top:2px;text-transform:uppercase;letter-spacing:1px;}
  .macro-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;}
  .macro-box{background:#f8f8f8;border-radius:8px;padding:12px;text-align:center;border:2px solid transparent;}
  .macro-val{font-size:20px;font-weight:800;}
  .macro-label{font-size:10px;color:#999;margin-top:2px;}
  .day-block{margin-bottom:20px;border:1px solid #eee;border-radius:10px;overflow:hidden;}
  .day-title{background:#f0e8cc;color:#080600;padding:10px 16px;font-weight:700;font-size:14px;}
  .ex-table{width:100%;border-collapse:collapse;font-size:13px;}
  .ex-table th{background:#f8f8f8;padding:8px 12px;text-align:${isAr ? "right" : "left"};font-weight:600;color:#444;font-size:12px;border-bottom:1px solid #eee;}
  .ex-table td{padding:8px 12px;border-bottom:1px solid #f5f5f5;}
  .ex-table tr:last-child td{border-bottom:none;}
  .ex-table tr:hover td{background:#fafafa;}
  .footer{text-align:center;font-size:12px;color:#999;margin-top:20px;padding:16px;}
  .bmi-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;}
  @media print{body{background:white;}@page{margin:1cm;}}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div><div class="logo">PHYSICAL DEFINITION</div><div class="tagline">${TRAINER.name} | ${isAr ? TRAINER.designationAr : TRAINER.designation}</div></div>
    <div><div class="trainer-name">${t.pdfTitle || "Training Plan"}</div><div class="trainer-des">${new Date().toLocaleDateString()}</div></div>
  </div>

  <div class="section">
    <div class="section-title">👤 ${isAr ? "معلومات العميل" : "Client Information"}</div>
    <div class="client-grid">
      <div class="info-box"><div class="info-val">${client.name}</div><div class="info-label">${isAr ? "الاسم" : "Name"}</div></div>
      <div class="info-box"><div class="info-val">${client.age} ${isAr ? "سنة" : "yrs"}</div><div class="info-label">${t.age}</div></div>
      <div class="info-box"><div class="info-val">${client.weight} kg</div><div class="info-label">${t.weight}</div></div>
      <div class="info-box"><div class="info-val">${client.height} cm</div><div class="info-label">${t.height}</div></div>
      <div class="info-box"><div class="info-val">${bmi} <span class="bmi-badge" style="background:${parseFloat(bmi)<25?"#d1fae5":"#fef3c7"};color:${parseFloat(bmi)<25?"#065f46":"#92400e"}">${parseFloat(bmi)<18.5?(isAr?"نحيف":"Underweight"):parseFloat(bmi)<25?(isAr?"صحي":"Healthy"):parseFloat(bmi)<30?(isAr?"زيادة":"Overweight"):(isAr?"بدانة":"Obese")}</span></div><div class="info-label">BMI</div></div>
      <div class="info-box"><div class="info-val">${client.goal}</div><div class="info-label">${t.goal}</div></div>
    </div>
    <div class="macro-grid">
      <div class="macro-box" style="border-color:#d4af37"><div class="macro-val" style="color:#d4af37">${tdee}</div><div class="macro-label">${isAr ? "الصيانة" : "Maintenance"} kcal</div></div>
      <div class="macro-box" style="border-color:#22c55e"><div class="macro-val" style="color:#22c55e">${target}</div><div class="macro-label">${isAr ? "الهدف" : "Target"} kcal</div></div>
      <div class="macro-box"><div class="macro-val" style="color:#ef4444">${protein}g</div><div class="macro-label">${isAr ? "بروتين" : "Protein"}</div></div>
      <div class="macro-box"><div class="macro-val" style="color:#60a5fa">${fat}g</div><div class="macro-label">${isAr ? "دهون" : "Fat"}</div></div>
    </div>
    <p style="font-size:12px;color:#999">${pal.icon} ${isAr ? "مستوى النشاط" : "Activity Level"}: <strong>${isAr ? pal.ar : pal.en}</strong> — ${isAr ? pal.desc_ar : pal.desc_en}</p>
  </div>

  ${workoutHTML}
  ${nutritionHTML}

  <div class="section" style="text-align:center">
    <div style="font-size:16px;font-weight:700;color:#d4af37">PHYSICAL DEFINITION</div>
    <div style="font-size:13px;color:#999;margin-top:6px">${TRAINER.name} | ${isAr ? TRAINER.designationAr : TRAINER.designation}</div>
    <div style="margin-top:10px"><a href="https://wa.me/${TRAINER.whatsapp}" style="color:#22c55e;font-size:13px">💬 wa.me/${TRAINER.whatsapp}</a></div>
    <div style="font-size:11px;color:#ccc;margin-top:6px">${TRAINER.appUrl}</div>
  </div>
</div>
<script>window.onload=()=>{window.print();}</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

// ── THEME ──────────────────────────────────────────────────
const G = { bg: "#080600", surf: "#110e00", surf2: "#1c1500", border: "rgba(212,175,55,0.14)", borderHi: "rgba(212,175,55,0.4)", gold: "#d4af37", grad: "linear-gradient(135deg,#d4af37,#f5d76e,#b8860b)", text: "#f0e8cc", muted: "#7a6a30", dim: "#3a2d10", green: "#22c55e", red: "#ef4444", amber: "#f59e0b", blue: "#60a5fa" };
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html{font-size:16px;-webkit-text-size-adjust:100%;text-size-adjust:100%;}
html,body{background:#080600;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;max-width:100vw;touch-action:manipulation;}
input,select,button,textarea{font-family:'Inter',sans-serif;font-size:16px;}
.sf{font-family:'Cormorant Garamond',serif;}
.gd{background:linear-gradient(90deg,#f5d76e,#d4af37);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.btn{cursor:pointer;border:none;transition:all .15s;outline:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
.btn:active{opacity:.75;transform:scale(.97);}
.inp{background:#1c1500;border:1px solid rgba(212,175,55,0.15);border-radius:10px;padding:12px 14px;color:#f0e8cc;font-size:16px;width:100%;outline:none;-webkit-appearance:none;appearance:none;}
.inp:focus{border-color:rgba(212,175,55,0.5);}
.inp::placeholder{color:#3a2d10;}
select.inp{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237a6a30' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px;}
.card{background:#110e00;border:1px solid rgba(212,175,55,0.14);border-radius:14px;}
.fd{animation:fi .25s ease;}
@keyframes fi{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
.sp{width:34px;height:34px;border:3px solid #1c1500;border-top:3px solid #d4af37;border-radius:50%;animation:spin .7s linear infinite;}
@keyframes squat3d{0%{transform:rotateX(0deg) translateY(0px);}50%{transform:rotateX(12deg) translateY(18px);}100%{transform:rotateX(0deg) translateY(0px);}}
@keyframes push3d{0%{transform:rotateZ(0deg) translateY(0px);}50%{transform:rotateZ(2deg) translateY(-14px);}100%{transform:rotateZ(0deg) translateY(0px);}}
@keyframes pull3d{0%{transform:translateY(0px);}50%{transform:translateY(-20px);}100%{transform:translateY(0px);}}
@keyframes deadlift3d{0%{transform:rotateX(25deg) translateY(20px);}50%{transform:rotateX(0deg) translateY(0px);}100%{transform:rotateX(25deg) translateY(20px);}}
@keyframes plank3d{0%,100%{transform:scaleX(1);}50%{transform:scaleX(1.02) translateY(-2px);}}
@keyframes muscleGlow{0%,100%{opacity:0.2;}50%{opacity:0.7;}}
@keyframes breathe{0%,100%{transform:scaleY(1);}50%{transform:scaleY(1.04);}}
@media(max-width:480px){
  html{font-size:15px;}
  .inp{padding:11px 12px;}
}
`;


const Logo = ({ s = 32 }) => (<svg width={s} height={s} viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="url(#lg)" /><defs><linearGradient id="lg" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stopColor="#d4af37" /><stop offset="50%" stopColor="#f5d76e" /><stop offset="100%" stopColor="#b8860b" /></linearGradient></defs><text x="6" y="33" fontFamily="Georgia,serif" fontSize="22" fontWeight="900" fill="#080600" letterSpacing="-1">PD</text><rect x="6" y="37" width="36" height="2.5" rx="1.25" fill="#080600" opacity="0.5" /></svg>);
const Av = ({ name = "?", sz = 38 }) => (<div style={{ width: sz, height: sz, borderRadius: 10, background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz * 0.33, fontWeight: 800, color: "#080600", flexShrink: 0 }}>{(name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</div>);
const VV = { gold: { background: G.grad, color: "#080600", fontWeight: 700, borderRadius: 10 }, ghost: { background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: G.gold, borderRadius: 8 }, danger: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", borderRadius: 8 }, green: { background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: G.green, borderRadius: 8 }, amber: { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: G.amber, borderRadius: 8 }, blue: { background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", color: G.blue, borderRadius: 8 } };
const Btn = ({ ch, v = "gold", onClick, full, sx = {} }) => (<button className="btn" onClick={onClick} style={{ padding: "9px 14px", fontSize: 13, fontWeight: 600, width: full ? "100%" : undefined, ...VV[v], ...sx }}>{ch}</button>);
const Ovl = ({ show, close, ch, mw = 520 }) => { if (!show) return null; return (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: 16, overflowY: "auto" }} onClick={close}><div className="card" style={{ width: "100%", maxWidth: mw, padding: 22, border: `1px solid ${G.borderHi}`, marginTop: 20, marginBottom: 20 }} onClick={e => e.stopPropagation()}>{ch}</div></div>); };
const LangBtn = ({ lang, setLang }) => (<button className="btn" onClick={() => setLang(lang === "en" ? "ar" : "en")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 20, color: G.gold, fontSize: 12, fontWeight: 700 }}><span style={{ fontSize: 14 }}>{lang === "en" ? "🇸🇦" : "🇬🇧"}</span><span>{lang === "en" ? "العربية" : "English"}</span></button>);
const FF = ({ label, value, onChange, type = "text", ph, opts, dir = "ltr" }) => (<div><div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>{opts ? <select className="inp" value={value} onChange={e => onChange(e.target.value)} style={{ direction: dir }}>{opts.map(o => <option key={typeof o === "object" ? o.id : o} value={typeof o === "object" ? o.id : o} style={{ background: G.surf2 }}>{typeof o === "object" ? o.label : o}</option>)}</select> : <input className="inp" type={type} placeholder={ph} value={value} onChange={e => onChange(e.target.value)} style={{ direction: dir }} />}</div>);

const PhoneField = ({ label, country, setCountry, phone, setPhone }) => (
  <div>
    <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
    <div style={{ display: "flex", gap: 6 }}>
      <select className="inp" value={country} onChange={e => setCountry(e.target.value)} style={{ width: 92, flexShrink: 0, direction: "ltr", paddingInline: 8 }}>
        {COUNTRIES.map(c => <option key={c.code} value={c.code} style={{ background: G.surf2 }}>{c.flag} {c.code}</option>)}
      </select>
      <input className="inp" type="tel" placeholder="00000000" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} style={{ direction: "ltr", flex: 1 }} />
    </div>
  </div>
);

// ── TDEE CARD ──────────────────────────────────────────────
function TDEECard({ client, t, lang }) {
  const isAr = lang === "ar";
  const pal = PAL.find(p => p.id === (client.pal || "moderate")) || PAL[2];
  const tdee = calcTDEE(client.weight, client.height, client.age, client.gender || "male", pal.factor);
  const target = goalCal(tdee, client.goal);
  const surplus = target - tdee;
  const protein = Math.round(client.weight * 2.0);
  const fat = Math.round((target * 0.25) / 9);
  const carbs = Math.round((target - protein * 4 - fat * 9) / 4);
  return (
    <div className="card" style={{ padding: 16, marginBottom: 12, border: `1px solid ${G.borderHi}` }}>
      <div style={{ fontSize: 11, color: G.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>{t.tdee}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, background: G.surf2, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 9, color: G.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{t.maintenance}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: G.gold }}>{tdee}</div>
          <div style={{ fontSize: 10, color: G.muted }}>kcal</div>
        </div>
        <div style={{ flex: 1, background: G.surf2, borderRadius: 10, padding: "10px 12px", border: `1px solid ${G.gold}40` }}>
          <div style={{ fontSize: 9, color: G.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{t.target}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: surplus > 0 ? G.green : G.red }}>{target}</div>
          <div style={{ fontSize: 10, color: surplus > 0 ? G.green : G.red }}>{surplus > 0 ? "+" : ""}{surplus} kcal</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 10 }}>
        {[{ l: "Protein", v: `${protein}g`, c: "#ef4444" }, { l: "Carbs", v: `${carbs}g`, c: G.amber }, { l: "Fat", v: `${fat}g`, c: G.blue }].map(x => (
          <div key={x.l} style={{ background: G.surf2, borderRadius: 7, padding: 8, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: x.c }}>{x.v}</div>
            <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>{x.l}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: G.muted }}>{pal.icon} {isAr ? pal.ar : pal.en}</div>
    </div>
  );
}




// ── YOUTUBE EXERCISE VIDEOS ─────────────────────────────────────
const KNOWN_VIDEOS = {
  // Verified fresh IDs — professional form tutorials
  "squat": "IArAo9mRQf8",           // How to Squat PROPERLY 2026
  "barbell squat": "kRX2NfqM90g",   // How To Squat With A Barbell Properly
  "goblet squat": "MeIiIdhvXT4",
  "hack squat": "EdtPMEvbKQ0",
  "deadlift": "VL5Ab0T07e4",        // Build A Bigger Deadlift - Jeff Nippard
  "romanian deadlift": "JCXUYuzwNrM",
  "sumo deadlift": "VL5Ab0T07e4",
  "bench press": "nLBcn41VwXM",     // Compilation: proper bench form
  "incline": "8iPEnn-ltC8",
  "push-up": "IODxDxX7oi4",
  "pushup": "IODxDxX7oi4",
  "pull-up": "NOrzocw9UkQ",         // Proper pull-up technique
  "pullup": "NOrzocw9UkQ",
  "chin": "NOrzocw9UkQ",
  "lat pulldown": "CAwf7n6Luuc",
  "overhead press": "DQGHPLs9N6Y",  // Big 5 lifts tutorial
  "ohp": "DQGHPLs9N6Y",
  "arnold press": "6Z15_WdXmVw",
  "barbell row": "nLBcn41VwXM",
  "dumbbell row": "FWJR5Ve8bnQ",
  "t-bar row": "j3Igk5nyZE4",
  "lunge": "3XDriUn0udo",
  "plank": "pSHjTRCQxIw",
  "bird dog": "wiFNA3sqjCA",
  "dead bug": "wiFNA3sqjCA",
  "bicep curl": "ykJmrZ5v0Oo",
  "barbell curl": "ykJmrZ5v0Oo",
  "tricep pushdown": "2-LAMcpzODU",
  "skull crusher": "2-LAMcpzODU",
  "tricep dip": "yew6QMKbcCc",
  "dip": "yew6QMKbcCc",
  "leg press": "IZxyjW7MPJQ",
  "leg curl": "1Tq3QdYUuHs",
  "leg extension": "YyvSfVjQeL0",
  "hip thrust": "xDmFkJxPzeM",
  "glute bridge": "8bbE64NuDTU",
  "calf raise": "gwLzBJYoWlI",
  "face pull": "rep-qVOkqgk",
  "lateral raise": "3VcKaXpzqRo",
  "cable fly": "Iwe6AmxVf7o",
  "burpee": "auBLPXO8Fww",
  "mountain climber": "nmwgirgXLYM",
  "jumping jack": "c4DAnQ6DtF8",
  "ab wheel": "uJtBjkIHNkA",
  "russian twist": "wkD8rjkodUI",
  "step-up": "dQqApCGd5Ss",
  "box jump": "52r_Ul5k03g",
  "kettle": "HS42OQFgkj4",
  "thruster": "HS42OQFgkj4",
  "battle rope": "8FNMJEMXnXE",
};

function getKnownVideoId(name) {
  const l = name.toLowerCase();
  for (const [key, id] of Object.entries(KNOWN_VIDEOS)) {
    if (l.includes(key)) return id;
  }
  return null;
}

function getYTSearchUrl(name) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " exercise proper form tutorial")}`;
}

// ── GYM-ANIMATIONS STYLE — Grey 3D Body + Red Muscle Highlight ──
const B  = "#9aa0a6";   // body grey
const BD = "#6b7278";   // body dark shadow
const BL = "#c8ced2";   // body light highlight
const BE = "#3a4248";   // body edge/outline
const MR = "#ff2020";   // muscle red active
const MH = "#ff7070";   // muscle highlight

function lerp(a,b,t){return a+(b-a)*t;}

function HumanAnim({ exerciseId, accentColor, size=120 }) {
  const [frame, setFrame] = useState(0);
  useEffect(()=>{
    const id = setInterval(()=>setFrame(f=>(f+1)%240),18);
    return ()=>clearInterval(id);
  },[]);

  const phase=(frame/240)*Math.PI*2;
  const e=(Math.sin(phase-Math.PI/2)+1)/2;
  const mg=0.3+e*0.7; // muscle glow intensity

  const P=({pts,f,s=BE,sw=0.7,o=1})=>(
    <polygon points={pts.map(p=>p.join(",")).join(" ")} fill={f} stroke={s} strokeWidth={sw} opacity={o}/>
  );
  const E=({cx,cy,rx,ry,f,s="none",sw=0.5,o=1})=>(
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={f} stroke={s} strokeWidth={sw} opacity={o}/>
  );
  const C=({cx,cy,r,f,s=BE,sw=0.6,o=1})=>(
    <circle cx={cx} cy={cy} r={r} fill={f} stroke={s} strokeWidth={sw} opacity={o}/>
  );
  const Glow=({cx,cy,rx,ry,i=1})=>(
    <g>
      <E cx={cx} cy={cy} rx={rx*1.8} ry={ry*1.8} f={MR} o={0.08*i*mg}/>
      <E cx={cx} cy={cy} rx={rx} ry={ry} f={MR} o={0.55*i*mg}/>
      <E cx={cx} cy={cy} rx={rx*0.5} ry={ry*0.5} f={MH} o={0.7*i*mg}/>
    </g>
  );
  const GlowPoly=({pts,i=1})=>(
    <polygon points={pts.map(p=>p.join(",")).join(" ")}
      fill={MR} opacity={0.5*i*mg} stroke={MH} strokeWidth="0.5" strokeOpacity={0.6*i*mg}/>
  );
  const Head=({cx,cy})=>(
    <g>
      <E cx={cx} cy={cy} rx={10} ry={11} f={B} s={BE} sw={0.7}/>
      <E cx={cx} cy={cy-2} rx={7} ry={5} f={BL} o={0.3}/>
      <C cx={cx-3} cy={cy-1} r={2} f={BE} s="none"/>
      <C cx={cx+3} cy={cy-1} r={2} f={BE} s="none"/>
      <path d={`M${cx-3} ${cy+4} Q${cx} ${cy+7} ${cx+3} ${cy+4}`} stroke={BE} strokeWidth="1.2" fill="none"/>
      <E cx={cx} cy={cy+11} rx={5} ry={4} f={B} s="none"/>
    </g>
  );

  const getKey=(id)=>{
    const l=(id||"").toLowerCase();
    if(l.includes("squat")||l.includes("goblet")||l.includes("leg press")||l.includes("wall sit")) return "squat";
    if(l.includes("deadlift")||l.includes("rdl")||l.includes("sumo")||l.includes("hip thrust")) return "deadlift";
    if(l.includes("bench")||l.includes("push-up")||l.includes("pushup")||l.includes("chest")||l.includes("fly")||l.includes("incline")||l.includes("dip")) return "pushup";
    if(l.includes("pull-up")||l.includes("pullup")||l.includes("chin")||l.includes("lat pulldown")) return "pullup";
    if(l.includes("press")&&(l.includes("over")||l.includes("shoulder")||l.includes("military")||l.includes("arnold"))) return "press";
    if(l.includes("row")||l.includes("cable row")||l.includes("seated row")) return "row";
    if(l.includes("lunge")||l.includes("step-up")||l.includes("step up")) return "lunge";
    if(l.includes("plank")||l.includes("bird dog")||l.includes("dead bug")||l.includes("ab wheel")) return "plank";
    if(l.includes("curl")||l.includes("bicep")) return "curl";
    if(l.includes("tricep")||l.includes("pushdown")||l.includes("skull")) return "press";
    if(l.includes("lateral raise")||l.includes("front raise")) return "press";
    return "squat";
  };

  const key=getKey(exerciseId);

  // SQUAT
  if(key==="squat"){
    const dip=e*32; const hY=74+dip*0.6; const kY=108+dip*0.28; const kO=e*9; const fY=144;
    return(<svg viewBox="0 0 100 160" width={size} height={size*1.14}>
      <E cx={50} cy={154} rx={22-dip*0.15} ry={3.5} f="#000" o={0.07}/>
      <E cx={34} cy={fY} rx={10} ry={4.5} f={BD}/><E cx={66} cy={fY} rx={10} ry={4.5} f={BD}/>
      <P pts={[[31,kY],[37,kY],[39,fY-3],[29,fY-3]]} f={B}/>
      <P pts={[[63,kY],[69,kY],[71,fY-3],[61,fY-3]]} f={B}/>
      <GlowPoly pts={[[38,hY+10],[32-kO,kY],[40-kO,kY],[46,hY+13]]} i={1}/>
      <GlowPoly pts={[[62,hY+10],[68+kO,kY],[60+kO,kY],[54,hY+13]]} i={1}/>
      <P pts={[[39,hY+10],[32-kO,kY],[40-kO,kY],[47,hY+13]]} f={B}/>
      <P pts={[[61,hY+10],[68+kO,kY],[60+kO,kY],[53,hY+13]]} f={B}/>
      <E cx={37-kO*0.5} cy={kY-12} rx={5} ry={10} f={BL} o={0.2}/>
      <E cx={63+kO*0.5} cy={kY-12} rx={5} ry={10} f={BL} o={0.2}/>
      <Glow cx={50} cy={hY+14} rx={13} ry={9} i={0.8}/>
      <P pts={[[41,hY],[43,hY+13],[57,hY+13],[59,hY],[56,47],[44,47]]} f={B}/>
      <E cx={50} cy={62} rx={7} ry={12} f={BL} o={0.22}/>
      <P pts={[[43,54],[35,76],[39,77],[46,56]]} f={B}/><P pts={[[57,54],[65,76],[61,77],[54,56]]} f={B}/>
      <P pts={[[35,76],[27,94],[31,95],[39,77]]} f={B}/><P pts={[[65,76],[73,94],[69,95],[61,77]]} f={B}/>
      <C cx={34-kO} cy={kY} r={4.5} f={BL} s={BE} sw={0.5}/><C cx={66+kO} cy={kY} r={4.5} f={BL} s={BE} sw={0.5}/>
      <Head cx={50} cy={35}/>
    </svg>);
  }

  // DEADLIFT
  if(key==="deadlift"){
    const lift=e; const barY=lerp(124,80,lift); const hY=lerp(94,64,lift*0.72);
    const hA=(1-lift)*36; const tx=50-hA*0.36; const ty=hY-28-hA*0.26;
    return(<svg viewBox="0 0 100 160" width={size} height={size*1.14}>
      <rect x="12" y={barY-4} width="76" height="8" rx="4" fill={BE} opacity="0.85"/>
      <E cx={12} cy={barY} rx={6} ry={11} f={BE}/><E cx={88} cy={barY} rx={6} ry={11} f={BE}/>
      <E cx={7} cy={barY} rx={6} ry={13} f="#222"/><E cx={93} cy={barY} rx={6} ry={13} f="#222"/>
      <E cx={50} cy={154} rx={22} ry={3.5} f="#000" o={0.07}/>
      <E cx={36} cy={146} rx={10} ry={4.5} f={BD}/><E cx={64} cy={146} rx={10} ry={4.5} f={BD}/>
      <P pts={[[33,hY+5],[31,144],[41,144],[43,hY+5]]} f={B}/><P pts={[[57,hY+5],[59,144],[69,144],[67,hY+5]]} f={B}/>
      <Glow cx={50} cy={hY+10} rx={14} ry={11} i={1}/>
      <Glow cx={37} cy={hY+22} rx={5} ry={11} i={0.85}/><Glow cx={63} cy={hY+22} rx={5} ry={11} i={0.85}/>
      <P pts={[[tx-11,ty],[tx+11,ty],[55,hY+5],[45,hY+5]]} f={B}/>
      <Glow cx={tx} cy={ty+10} rx={7} ry={13} i={1}/>
      <P pts={[[tx-7,ty+10],[24,barY-2],[28,barY+4],[tx-2,ty+14]]} f={B}/>
      <P pts={[[tx+7,ty+10],[76,barY-2],[72,barY+4],[tx+2,ty+14]]} f={B}/>
      <C cx={26} cy={barY+1} r={5.5} f={BD}/><C cx={74} cy={barY+1} r={5.5} f={BD}/>
      <C cx={37} cy={hY+5} r={4.5} f={BL} s={BE} sw={0.5}/><C cx={63} cy={hY+5} r={4.5} f={BL} s={BE} sw={0.5}/>
      <Head cx={tx-4} cy={ty-12}/>
    </svg>);
  }

  // PUSH-UP / BENCH
  if(key==="pushup"){
    const lift=e; const bY=72-lift*20; const eF=lift*28;
    return(<svg viewBox="0 0 148 105" width={size*1.22} height={size*0.75}>
      <E cx={74} cy={100} rx={50+lift*8} ry={3.5} f="#000" o={0.06}/>
      <E cx={122} cy={86} rx={10} ry={4.5} f={BD}/>
      <P pts={[[72,bY+16],[118,88],[126,86],[78,bY+14]]} f={B}/>
      <Glow cx={46} cy={bY+8} rx={12} ry={5} i={1}/>
      <P pts={[[30,bY+4],[72,bY+16],[78,bY+14],[34,bY+2]]} f={B}/>
      <P pts={[[34,bY+3],[22-eF*0.24,bY+17+eF*0.28],[26-eF*0.24,bY+19+eF*0.28],[38,bY+5]]} f={B}/>
      <P pts={[[34,bY+3],[46+eF*0.24,bY+17+eF*0.28],[42+eF*0.24,bY+19+eF*0.28],[38,bY+5]]} f={B}/>
      <Glow cx={22-eF*0.14} cy={bY+14+eF*0.18} rx={4.5} ry={7} i={0.9}/>
      <Glow cx={46+eF*0.14} cy={bY+14+eF*0.18} rx={4.5} ry={7} i={0.9}/>
      <P pts={[[22-eF*0.24,bY+17+eF*0.28],[14,84],[18,86],[26-eF*0.24,bY+19+eF*0.28]]} f={B}/>
      <P pts={[[46+eF*0.24,bY+17+eF*0.28],[52,84],[56,86],[42+eF*0.24,bY+19+eF*0.28]]} f={B}/>
      <C cx={16} cy={85} r={5} f={BD}/><C cx={54} cy={85} r={5} f={BD}/>
      <C cx={22-eF*0.24} cy={bY+18+eF*0.28} r={3.5} f={BL} s={BE} sw={0.5}/>
      <C cx={46+eF*0.24} cy={bY+18+eF*0.28} r={3.5} f={BL} s={BE} sw={0.5}/>
      <Head cx={18} cy={bY-6}/>
    </svg>);
  }

  // PULL-UP
  if(key==="pullup"){
    const pull=e; const bY=lerp(60,36,pull); const eF=pull*22;
    return(<svg viewBox="0 0 100 160" width={size} height={size*1.14}>
      <rect x="6" y="10" width="88" height="10" rx="5" fill={BE} opacity="0.88"/>
      <rect x="12" y="10" width="8" height="22" rx="4" fill={BE} opacity="0.6"/>
      <rect x="80" y="10" width="8" height="22" rx="4" fill={BE} opacity="0.6"/>
      <E cx={50} cy={157} rx={18} ry={3} f="#000" o={0.05}/>
      <C cx={26} cy={22} r={5.5} f={BD}/><C cx={74} cy={22} r={5.5} f={BD}/>
      <P pts={[[26,22],[31-eF*0.28,bY-24],[35-eF*0.28,bY-21],[30,25]]} f={B}/>
      <P pts={[[74,22],[69+eF*0.28,bY-24],[65+eF*0.28,bY-21],[70,25]]} f={B}/>
      <Glow cx={32-eF*0.18} cy={bY-12} rx={5} ry={9} i={1}/>
      <Glow cx={68+eF*0.18} cy={bY-12} rx={5} ry={9} i={1}/>
      <P pts={[[31-eF*0.28,bY-24],[38,bY-10],[42,bY-7],[35-eF*0.28,bY-22]]} f={B}/>
      <P pts={[[69+eF*0.28,bY-24],[62,bY-10],[58,bY-7],[65+eF*0.28,bY-22]]} f={B}/>
      <GlowPoly pts={[[39,bY-7],[37,bY+22],[63,bY+22],[61,bY-7]]} i={1}/>
      <P pts={[[39,bY-7],[37,bY+22],[63,bY+22],[61,bY-7]]} f={B}/>
      <E cx={50} cy={bY+6} rx={9} ry={14} f={BL} o={0.2}/>
      <P pts={[[43,bY+22],[41,bY+56],[47,bY+56],[47,bY+24]]} f={B}/>
      <P pts={[[57,bY+22],[53,bY+56],[59,bY+56],[59,bY+24]]} f={B}/>
      <P pts={[[41,bY+56],[39,bY+82],[45,bY+82],[47,bY+56]]} f={B}/>
      <P pts={[[53,bY+56],[51,bY+82],[57,bY+82],[59,bY+56]]} f={B}/>
      <C cx={31-eF*0.28} cy={bY-24} r={3.5} f={BL} s={BE} sw={0.5}/>
      <C cx={69+eF*0.28} cy={bY-24} r={3.5} f={BL} s={BE} sw={0.5}/>
      <Head cx={50} cy={bY-22}/>
    </svg>);
  }

  // OVERHEAD PRESS
  if(key==="press"){
    const up=e; const aY=lerp(72,28,up);
    return(<svg viewBox="0 0 100 160" width={size} height={size*1.14}>
      <rect x="14" y={aY-4} width="72" height="8" rx="4" fill={BE} opacity="0.85"/>
      <E cx={14} cy={aY} rx={6.5} ry={11} f={BE}/><E cx={86} cy={aY} rx={6.5} ry={11} f={BE}/>
      <E cx={8} cy={aY} rx={6.5} ry={13} f="#222"/><E cx={92} cy={aY} rx={6.5} ry={13} f="#222"/>
      <E cx={50} cy={154} rx={18} ry={3} f="#000" o={0.07}/>
      <E cx={38} cy={148} rx={9} ry={4} f={BD}/><E cx={62} cy={148} rx={9} ry={4} f={BD}/>
      <P pts={[[39,102],[36,146],[44,146],[45,102]]} f={B}/><P pts={[[61,102],[56,146],[64,146],[63,102]]} f={B}/>
      <P pts={[[40,57],[38,102],[62,102],[60,57]]} f={B}/>
      <Glow cx={36} cy={64} rx={9} ry={8} i={1}/><Glow cx={64} cy={64} rx={9} ry={8} i={1}/>
      <Glow cx={30} cy={lerp(72,48,up)} rx={4.5} ry={9} i={0.9}/>
      <Glow cx={70} cy={lerp(72,48,up)} rx={4.5} ry={9} i={0.9}/>
      <P pts={[[39,63],[27,lerp(78,46,up)],[31,lerp(80,48,up)],[43,65]]} f={B}/>
      <P pts={[[61,63],[73,lerp(78,46,up)],[69,lerp(80,48,up)],[57,65]]} f={B}/>
      <P pts={[[27,lerp(78,46,up)],[18,aY+3],[22,aY+6],[31,lerp(80,48,up)]]} f={B}/>
      <P pts={[[73,lerp(78,46,up)],[82,aY+3],[78,aY+6],[69,lerp(80,48,up)]]} f={B}/>
      <C cx={27} cy={lerp(78,46,up)} r={3.5} f={BL} s={BE} sw={0.5}/>
      <C cx={73} cy={lerp(78,46,up)} r={3.5} f={BL} s={BE} sw={0.5}/>
      <Head cx={50} cy={44}/>
    </svg>);
  }

  // ROW
  if(key==="row"){
    const pull=e; const eB=pull*20;
    return(<svg viewBox="0 0 148 112" width={size*1.22} height={size*0.8}>
      <rect x="62" y="84" width="76" height="10" rx="5" fill={BE} opacity="0.7"/>
      <rect x="64" y="94" width="8" height="16" rx="4" fill="#333" opacity="0.7"/>
      <rect x="122" y="94" width="8" height="16" rx="4" fill="#333" opacity="0.7"/>
      <E cx={74} cy={108} rx={52} ry={3} f="#000" o={0.06}/>
      <E cx={14} cy={102} rx={9} ry={4} f={BD}/><E cx={34} cy={102} rx={9} ry={4} f={BD}/>
      <P pts={[[12,74],[10,100],[18,100],[18,74]]} f={B}/><P pts={[[30,74],[28,100],[36,100],[36,74]]} f={B}/>
      <E cx={98} cy={84} rx={10} ry={7} f={B} s={BE} sw={0.7}/>
      <Glow cx={58} cy={58} rx={22} ry={5} i={1}/>
      <P pts={[[28,54],[96,74],[96,82],[28,64]]} f={B}/>
      <P pts={[[28,57],[24,78],[32,79],[32,59]]} f={B}/>
      <C cx={28} cy={80} r={5} f={BD}/>
      <P pts={[[50,60],[20+eB,70],[24+eB,74],[54,64]]} f={B}/>
      <P pts={[[20+eB,70],[26+eB,50],[30+eB,52],[24+eB,74]]} f={B}/>
      <Glow cx={22+eB} cy={62} rx={4} ry={8} i={1}/>
      <C cx={28+eB} cy={48} r={5.5} f={BE}/>
      <rect x={24+eB} y={44} width={10} height={7} rx={3} fill="#555"/>
      <C cx={20+eB} cy={70} r={3.5} f={BL} s={BE} sw={0.5}/>
      <Head cx={26} cy={42}/>
    </svg>);
  }

  // LUNGE
  if(key==="lunge"){
    const step=e; const fkY=lerp(98,122,step);
    return(<svg viewBox="0 0 100 160" width={size} height={size*1.14}>
      <E cx={50} cy={154} rx={22} ry={3.5} f="#000" o={0.07}/>
      <E cx={72} cy={146} rx={8} ry={4} f={BD}/><E cx={30} cy={150} rx={9} ry={4} f={BD}/>
      <P pts={[[67,112],[63,144],[71,144],[75,112]]} f={B}/>
      <P pts={[[51,74],[63,112],[71,112],[59,74]]} f={B}/>
      <C cx={67} cy={112} r={4.5} f={BL} s={BE} sw={0.5}/>
      <P pts={[[26,fkY],[24,148],[32,148],[34,fkY]]} f={B}/>
      <GlowPoly pts={[[43,76],[26,fkY],[34,fkY],[51,78]]} i={1}/>
      <P pts={[[43,76],[26,fkY],[34,fkY],[51,78]]} f={B}/>
      <Glow cx={54} cy={78} rx={10} ry={7} i={0.9}/>
      <C cx={30} cy={fkY} r={4.5} f={BL} s={BE} sw={0.5}/>
      <P pts={[[42,44],[40,76],[58,76],[58,44]]} f={B}/>
      <P pts={[[42,52],[35,72],[39,73],[45,54]]} f={B}/><P pts={[[58,52],[65,72],[61,73],[55,54]]} f={B}/>
      <Head cx={50} cy={32}/>
    </svg>);
  }

  // PLANK
  if(key==="plank"){
    const br=Math.sin((frame/240)*Math.PI*4)*1.4;
    return(<svg viewBox="0 0 168 84" width={size*1.38} height={size*0.6}>
      <E cx={86} cy={80} rx={66} ry={3} f="#000" o={0.07}/>
      <E cx={140} cy={70} rx={10} ry={4.5} f={BD}/>
      <P pts={[[82,52+br],[134,70],[140,68],[86,50+br]]} f={B}/>
      <Glow cx={58} cy={46+br*0.8} rx={16} ry={4} i={1}/>
      <P pts={[[36,45+br*0.6],[82,52+br],[86,50+br],[40,43+br*0.6]]} f={B}/>
      <P pts={[[38,44+br*0.6],[24,57],[28,59],[42,46+br*0.6]]} f={B}/>
      <P pts={[[44,43+br*0.6],[56,56],[52,58],[40,45+br*0.6]]} f={B}/>
      <P pts={[[24,57],[16,68],[20,70],[28,59]]} f={B}/><P pts={[[56,56],[62,68],[58,70],[52,58]]} f={B}/>
      <C cx={18} cy={69} r={5.5} f={BD}/><C cx={60} cy={69} r={5.5} f={BD}/>
      <C cx={24} cy={57} r={3.5} f={BL} s={BE} sw={0.5}/><C cx={56} cy={56} r={3.5} f={BL} s={BE} sw={0.5}/>
      <Head cx={16} cy={34+br*0.4}/>
    </svg>);
  }

  // CURL (default fallback)
  const up=e; const aY=lerp(72,28,up);
  return(<svg viewBox="0 0 100 160" width={size} height={size*1.14}>
    <E cx={50} cy={154} rx={18} ry={3} f="#000" o={0.07}/>
    <E cx={38} cy={148} rx={9} ry={4} f={BD}/><E cx={62} cy={148} rx={9} ry={4} f={BD}/>
    <P pts={[[39,102],[36,146],[44,146],[45,102]]} f={B}/><P pts={[[61,102],[56,146],[64,146],[63,102]]} f={B}/>
    <P pts={[[40,57],[38,102],[62,102],[60,57]]} f={B}/>
    <Glow cx={36} cy={64} rx={9} ry={8} i={1}/><Glow cx={64} cy={64} rx={9} ry={8} i={1}/>
    <P pts={[[39,63],[27,lerp(78,46,up)],[31,lerp(80,48,up)],[43,65]]} f={B}/>
    <P pts={[[61,63],[73,lerp(78,46,up)],[69,lerp(80,48,up)],[57,65]]} f={B}/>
    <Glow cx={27} cy={lerp(72,56,up)} rx={4.5} ry={8} i={1}/>
    <P pts={[[27,lerp(78,46,up)],[22,aY+10],[26,aY+14],[31,lerp(80,48,up)]]} f={B}/>
    <C cx={24} cy={aY+12} r={5} f={BD}/>
    <rect x={16} y={aY+8} width={18} height={7} rx={3} fill="#555"/>
    <C cx={27} cy={lerp(78,46,up)} r={3.5} f={BL} s={BE} sw={0.5}/>
    <Head cx={50} cy={44}/>
  </svg>);
}

function getMuscleTargets(name) {
  const l = (name || "").toLowerCase();
  if (l.includes("squat") || l.includes("goblet") || l.includes("hack")) return [["Quads", "primary"], ["Glutes", "secondary"], ["Hamstrings", "secondary"]];
  if (l.includes("deadlift") || l.includes("rdl")) return [["Lower Back", "primary"], ["Glutes", "primary"], ["Hamstrings", "secondary"]];
  if (l.includes("bench") || l.includes("push-up") || l.includes("pushup") || l.includes("chest") || l.includes("fly") || l.includes("incline")) return [["Chest", "primary"], ["Triceps", "secondary"], ["Shoulders", "secondary"]];
  if (l.includes("pull-up") || l.includes("pullup") || l.includes("chin") || l.includes("lat")) return [["Lats", "primary"], ["Biceps", "secondary"], ["Core", "secondary"]];
  if (l.includes("row")) return [["Mid Back", "primary"], ["Biceps", "secondary"], ["Rear Delt", "secondary"]];
  if (l.includes("press") && (l.includes("over") || l.includes("shoulder") || l.includes("military") || l.includes("arnold"))) return [["Delts", "primary"], ["Triceps", "secondary"], ["Core", "secondary"]];
  if (l.includes("lunge") || l.includes("step")) return [["Quads", "primary"], ["Glutes", "secondary"], ["Balance", "secondary"]];
  if (l.includes("plank") || l.includes("bird") || l.includes("dead bug") || l.includes("ab wheel")) return [["Core", "primary"], ["Stabilizers", "secondary"]];
  if (l.includes("curl") || l.includes("bicep")) return [["Biceps", "primary"], ["Forearms", "secondary"]];
  if (l.includes("tricep") || l.includes("extension") || l.includes("pushdown") || l.includes("skull") || l.includes("dip")) return [["Triceps", "primary"], ["Chest", "secondary"]];
  if (l.includes("calf")) return [["Calves", "primary"]];
  if (l.includes("glute") || l.includes("hip thrust")) return [["Glutes", "primary"], ["Hamstrings", "secondary"]];
  if (l.includes("lateral raise")) return [["Side Delts", "primary"], ["Traps", "secondary"]];
  if (l.includes("face pull")) return [["Rear Delts", "primary"], ["Rotator Cuff", "secondary"]];
  if (l.includes("leg press")) return [["Quads", "primary"], ["Glutes", "secondary"]];
  if (l.includes("leg curl")) return [["Hamstrings", "primary"]];
  if (l.includes("leg extension")) return [["Quads", "primary"]];
  return [["Full Body", "primary"]];
}

function ExerciseCard({ exercise, color, lang }) {
  const isAr = lang === "ar";
  const muscles = getMuscleTargets(exercise.name);
  const ytSearchUrl = getYTSearchUrl(exercise.name);

  return (
    <div style={{ background: G.surf2, borderRadius: 12, overflow: "hidden", border: `1px solid ${color}22` }}>
      {/* Uniform animation area — same dark bg, same size for all */}
      <div style={{ background: "#111", padding: "14px 8px 6px", display: "flex", flexDirection: "column", alignItems: "center", minHeight: 155 }}>
        <ExerciseIllustration exerciseId={exercise.name} size={118} />
        {/* muscle tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center", marginTop: 7 }}>
          {muscles.map(([m, type], i) => (
            <span key={i} style={{
              fontSize: 9, padding: "2px 7px", borderRadius: 20,
              background: type === "primary" ? "#ff2d2d25" : "#1a1800",
              color: type === "primary" ? "#ff6b6b" : G.muted,
              fontWeight: type === "primary" ? 700 : 400,
              border: `1px solid ${type === "primary" ? "#ff2d2d50" : "#2a2200"}`
            }}>{m}</span>
          ))}
        </div>
      </div>
      {/* Info */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: G.text, marginBottom: 7, textAlign: "center", lineHeight: 1.3 }}>
          {exercise.name}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginBottom: 8 }}>
          {[
            { l: isAr ? "مجموعات" : "Sets", v: exercise.sets, c: color },
            { l: isAr ? "تكرار" : "Reps", v: exercise.reps, c: G.green },
            { l: isAr ? "راحة" : "Rest", v: exercise.rest, c: G.amber },
          ].map(x => (
            <div key={x.l} style={{ background: G.surf, borderRadius: 6, padding: "5px 3px", textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: x.c }}>{x.v}</div>
              <div style={{ fontSize: 8, color: G.muted, marginTop: 1 }}>{x.l}</div>
            </div>
          ))}
        </div>
        {exercise.notes && (
          <div style={{ fontSize: 10, color: G.muted, marginBottom: 7, lineHeight: 1.5 }}>💡 {exercise.notes}</div>
        )}
        {/* YouTube link button only — no thumbnail */}
        <a href={ytSearchUrl} target="_blank" rel="noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "7px", background: "#ff000012", border: "1px solid #ff000028",
            borderRadius: 7, textDecoration: "none", color: "#ff6b6b", fontSize: 10, fontWeight: 600 }}>
          <div style={{ width: 16, height: 16, background: "#ff0000", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: "7px solid white", marginLeft: 1 }} />
          </div>
          {isAr ? "شاهد على يوتيوب" : "Watch Tutorial"}
        </a>
      </div>
    </div>
  );
}

// ── WORKOUT SYSTEM SELECTOR ────────────────────────────────
function WorkoutSystemSelector({ client, onSelect, onClose, lang }) {
  const [sel, setSel] = useState(null);
  const t = T[lang]; const isAr = lang === "ar";

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div className="sf gd" style={{ fontSize: 20, fontWeight: 700 }}>{t.chooseWorkout}</div>
        <button className="btn" onClick={onClose} style={{ background: "none", color: G.muted, fontSize: 20 }}>✕</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {WORKOUT_SYSTEMS.map(ws => (
          <div key={ws.id} className="btn card" onClick={() => setSel(sel === ws.id ? null : ws.id)}
            style={{ padding: 14, border: sel === ws.id ? `2px solid ${ws.color}` : `1px solid ${G.border}`, textAlign: "left", cursor: "pointer" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{ws.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: sel === ws.id ? ws.color : G.text }}>{isAr ? ws.nameAr : ws.name}</div>
            <div style={{ fontSize: 11, color: G.muted, marginTop: 3 }}>{ws.days.length} {isAr ? "أيام" : "days"}</div>
          </div>
        ))}
      </div>

      {sel && (() => {
        const ws = WORKOUT_SYSTEMS.find(w => w.id === sel);
        return (
          <div>
            <div style={{ background: `${ws.color}12`, border: `1px solid ${ws.color}30`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: ws.color, marginBottom: 8 }}>{ws.emoji} {isAr ? ws.nameAr : ws.name}</div>
              <div style={{ fontSize: 12, color: G.muted, marginBottom: 14 }}>{isAr ? ws.descAr : ws.desc}</div>
              {ws.days.map((day, di) => (
                <div key={di} style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: ws.color, marginBottom: 10, padding: "6px 10px", background: `${ws.color}18`, borderRadius: 6 }}>{day.name}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {day.exercises.map((ex, ei) => (
                      <ExerciseCard key={ei} exercise={ex} color={ws.color} lang={lang} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Btn ch={`✓ ${isAr ? "تطبيق هذا النظام" : "Apply This System"}`} v="gold" full onClick={() => onSelect(ws)} sx={{ padding: "13px", fontSize: 14, fontWeight: 700 }} />
          </div>
        );
      })()}
    </div>
  );
}

// ── MEAL SELECTOR ──────────────────────────────────────────
function MealSelector({ client, onSelect, onClose, lang }) {
  const [sel, setSel] = useState(null);
  const t = T[lang]; const isAr = lang === "ar";
  const pal = PAL.find(p => p.id === (client?.pal || "moderate")) || PAL[2];
  const tdee = client ? calcTDEE(client.weight, client.height, client.age, client.gender || "male", pal.factor) : 2000;
  const target = client ? goalCal(tdee, client.goal) : 2000;

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div className="sf gd" style={{ fontSize: 20, fontWeight: 700 }}>{t.chooseMeal} {isAr ? "الخطة الغذائية" : "Meal Plan"}</div>
        <button className="btn" onClick={onClose} style={{ background: "none", color: G.muted, fontSize: 20 }}>✕</button>
      </div>
      {client && <div style={{ fontSize: 12, color: G.muted, marginBottom: 14, background: G.surf2, borderRadius: 8, padding: "7px 12px" }}>{isAr ? "الهدف لـ" : "Target for"} {client.name}: <strong style={{ color: G.gold }}>{target} kcal</strong> <span style={{ fontSize: 10, color: G.dim }}>— {isAr ? "سيتم ضبط الكميات تلقائياً" : "portions auto-adjusted to match"}</span></div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {MEALS.map(p => {
          const scaledCal = client ? Math.round(p.baseCal * Math.max(0.55, Math.min(1.8, target / p.baseCal))) : p.baseCal;
          return (
            <div key={p.id} className="card btn" onClick={() => setSel(sel === p.id ? null : p.id)}
              style={{ overflow: "hidden", border: sel === p.id ? `2px solid ${p.color}` : `1px solid ${G.border}` }}>
              <div style={{ position: "relative" }}>
                <img src={p.image} alt={p.name} style={{ width: "100%", height: 76, objectFit: "cover" }} />
                {sel === p.id && <div style={{ position: "absolute", top: 5, right: 5, background: p.color, borderRadius: 20, padding: "2px 7px", fontSize: 10, fontWeight: 700, color: "#080600" }}>✓</div>}
              </div>
              <div style={{ padding: "9px 10px 11px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{p.emoji} {isAr ? p.nameAr : p.name}</div>
                <div style={{ fontSize: 10, color: p.color, marginTop: 3, fontWeight: 700 }}>{scaledCal} kcal {client && scaledCal !== p.baseCal && <span style={{ color: G.dim, fontWeight: 400 }}>({isAr ? "مُعدّل" : "adjusted"})</span>}</div>
              </div>
            </div>
          );
        })}
      </div>
      {sel && (() => {
        const rawPlan = MEALS.find(p => p.id === sel);
        const plan = client ? scaleMealPlan(rawPlan, target) : rawPlan;
        const tot = plan.meals.reduce((a, m) => ({ cal: a.cal + m.cal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f }), { cal: 0, p: 0, c: 0, f: 0 });
        return (
          <div>
            {client && plan.scaleFactor && Math.abs(plan.scaleFactor - 1) > 0.03 && (
              <div style={{ fontSize: 11, color: G.gold, marginBottom: 10, background: `${plan.color}10`, borderRadius: 7, padding: "6px 10px" }}>
                ⚖️ {isAr ? "تم ضبط الكميات بمعامل" : "Portions scaled by"} ×{plan.scaleFactor.toFixed(2)} {isAr ? "لمطابقة هدفك" : "to match your target"}
              </div>
            )}
            <div style={{ background: `${plan.color}12`, border: `1px solid ${plan.color}30`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, marginBottom: 10 }}>
                {[{ l: "Cal", v: tot.cal, c: plan.color }, { l: "Pro", v: `${tot.p}g`, c: "#ef4444" }, { l: "Carb", v: `${tot.c}g`, c: G.amber }, { l: "Fat", v: `${tot.f}g`, c: G.blue }].map(x => (
                  <div key={x.l} style={{ background: G.surf2, borderRadius: 7, padding: 7, textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: x.c }}>{x.v}</div>
                    <div style={{ fontSize: 9, color: G.muted, marginTop: 1 }}>{x.l}</div>
                  </div>
                ))}
              </div>
              {plan.meals.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: i < plan.meals.length - 1 ? `1px solid ${G.border}` : "none" }}>
                  <div style={{ width: 52, flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: plan.color, fontWeight: 700 }}>{m.time}</div>
                    <div style={{ fontSize: 9, color: G.muted }}>{isAr ? m.nameAr : m.name}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: G.text }}>{m.items}</div>
                    <div style={{ fontSize: 10, color: G.muted, marginTop: 1 }}>{m.cal} kcal · P:{m.p}g C:{m.c}g F:{m.f}g</div>
                  </div>
                </div>
              ))}
            </div>
            <Btn ch={`✓ ${isAr ? "إضافة هذه الخطة" : "Add This Plan"}`} v="gold" full onClick={() => onSelect(plan, tot, target)} sx={{ padding: "12px", fontSize: 14, fontWeight: 700 }} />
          </div>
        );
      })()}
    </div>
  );
}

// ── PLANS TAB ──────────────────────────────────────────────
function PlansTab({ clients, selC, setSelC, setClients, lang, onUpdate }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const [showMeal, setShowMeal] = useState(false);
  const [showWO, setShowWO] = useState(false);
  const t = T[lang]; const isAr = lang === "ar";
  const sc = clients.find(c => c.id === selC?.id);

  const startEdit = (c, type) => { setEditing({ id: c.id, type }); setDraft(c[type === "workout" ? "workoutPlan" : "nutritionPlan"] || ""); };
  const saveEdit = () => {
    if (!editing) return;
    const key = editing.type === "workout" ? "workoutPlan" : "nutritionPlan";
    const updated = clients.find(c => c.id === editing.id);
    if (updated) { const u = { ...updated, [key]: draft }; onUpdate?.(u); }
    setClients(p => p.map(c => c.id === editing.id ? { ...c, [key]: draft } : c));
    setSelC(p => p?.id === editing.id ? { ...p, [key]: draft } : p);
    setEditing(null); setDraft("");
  };
  const clearPlan = (c, type) => {
    const key = type === "workout" ? "workoutPlan" : "nutritionPlan";
    const skey = type === "workout" ? "workoutSystemId" : "mealPlanId";
    const u = { ...c, [key]: null, [skey]: null };
    onUpdate?.(u);
    setClients(p => p.map(x => x.id === c.id ? u : x));
  };

  const applyWorkoutSystem = (ws) => {
    if (!sc) return;
    const text = `${ws.emoji} ${isAr ? ws.nameAr : ws.name}\n${"─".repeat(30)}\n${isAr ? ws.descAr : ws.desc}\n\n` +
      ws.days.map(day => `📅 ${day.name}\n${"─".repeat(25)}\n` +
        day.exercises.map(ex => `• ${ex.name}\n  Sets: ${ex.sets} | Reps: ${ex.reps} | Rest: ${ex.rest}${ex.notes ? `\n  💡 ${ex.notes}` : ""}`).join("\n")).join("\n\n");
    const u = { ...sc, workoutPlan: text, workoutSystemId: ws.id };
    onUpdate?.(u);
    setClients(p => p.map(c => c.id === sc.id ? u : c));
    setShowWO(false);
  };

  const applyMeal = (plan, tot, target) => {
    if (!sc) return;
    const text = `🥗 ${plan.emoji} ${isAr ? plan.nameAr : plan.name}\n${"─".repeat(28)}\n${isAr ? "الهدف اليومي" : "Daily Target"}: ${target} kcal | ${isAr ? "الإجمالي" : "Total"}: ${tot.cal} kcal\n${isAr ? "البروتين" : "Protein"}: ${tot.p}g | ${isAr ? "الكارب" : "Carbs"}: ${tot.c}g | ${isAr ? "الدهون" : "Fat"}: ${tot.f}g\n\n` +
      plan.meals.map(m => `🕐 ${m.time} — ${isAr ? m.nameAr : m.name}\n   ${m.items}\n   ${m.cal} kcal | P:${m.p}g C:${m.c}g F:${m.f}g`).join("\n\n");
    const u = { ...sc, nutritionPlan: text, mealPlanId: plan.id };
    onUpdate?.(u);
    setClients(p => p.map(c => c.id === sc.id ? u : c));
    setShowMeal(false);
  };

  const ws = sc ? WORKOUT_SYSTEMS.find(w => w.id === sc.workoutSystemId) : null;

  return (
    <div className="fd" dir={isAr ? "rtl" : "ltr"}>
      <div style={{ marginBottom: 14 }}>
        <div className="sf gd" style={{ fontSize: 22, fontWeight: 700 }}>{t.plans}</div>
      </div>
      <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
        {clients.map(c => <Btn key={c.id} ch={c.name.split(" ")[0]} v={selC?.id === c.id ? "gold" : "ghost"} onClick={() => { setSelC(clients.find(x => x.id === c.id)); setEditing(null); }} sx={{ padding: "7px 13px", fontSize: 12 }} />)}
      </div>

      {!sc ? (
        <div className="card" style={{ padding: "36px 20px", textAlign: "center", color: G.dim }}>
          <div style={{ fontSize: 26, marginBottom: 8 }}>◈</div><div>{t.selectClient}</div>
        </div>
      ) : (
        <div>
          <div className="card" style={{ padding: "11px 13px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, border: `1px solid ${G.borderHi}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Av name={sc.name} sz={36} />
              <div><div style={{ fontSize: 13, fontWeight: 700 }}>{sc.name}</div><div style={{ fontSize: 11, color: G.muted }}>{sc.goal} · {sc.weight}kg · {sc.age}y</div></div>
            </div>
            <Btn ch={t.downloadPDF} v="gold" onClick={() => generatePDF(sc, lang)} sx={{ padding: "7px 12px", fontSize: 11 }} />
          </div>

          <TDEECard client={sc} t={t} lang={lang} />

          {/* WORKOUT */}
          <div className="card" style={{ padding: 18, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: G.gold }}>⚡ {isAr ? "خطة التمرين" : "Workout Plan"}</div>
                {ws && <div style={{ fontSize: 11, color: ws.color, marginTop: 2 }}>{ws.emoji} {isAr ? ws.nameAr : ws.name}</div>}
              </div>
              {!editing ? (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <Btn ch={t.chooseWorkout} v="gold" onClick={() => setShowWO(true)} sx={{ padding: "6px 10px", fontSize: 11 }} />
                  <Btn ch={t.writeManual} v="ghost" onClick={() => startEdit(sc, "workout")} sx={{ padding: "6px 10px", fontSize: 11 }} />
                  {sc.workoutPlan && <Btn ch="🗑️" v="danger" onClick={() => clearPlan(sc, "workout")} sx={{ padding: "6px 10px", fontSize: 11 }} />}
                </div>
              ) : editing.type === "workout" ? (
                <div style={{ display: "flex", gap: 5 }}>
                  <Btn ch={`✓ ${t.save}`} v="gold" onClick={saveEdit} sx={{ padding: "6px 12px", fontSize: 11 }} />
                  <Btn ch="✕" v="danger" onClick={() => { setEditing(null); setDraft(""); }} sx={{ padding: "6px 10px", fontSize: 11 }} />
                </div>
              ) : null}
            </div>

            {editing?.type === "workout" && editing.id === sc.id ? (
              <div>
                <textarea value={draft} onChange={e => setDraft(e.target.value)} style={{ width: "100%", minHeight: 220, background: G.surf2, border: `1px solid ${G.borderHi}`, borderRadius: 10, padding: 12, color: G.text, fontSize: 13, lineHeight: 1.8, resize: "vertical", outline: "none", fontFamily: "Inter,sans-serif" }} />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 9 }}>
                  <Btn ch={t.cancel} v="danger" onClick={() => { setEditing(null); setDraft(""); }} sx={{ padding: "8px 14px" }} />
                  <Btn ch={`✓ ${t.save}`} v="gold" onClick={saveEdit} sx={{ padding: "8px 20px", fontWeight: 700 }} />
                </div>
              </div>
            ) : sc.workoutPlan ? (
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.9, color: G.text }}>{sc.workoutPlan}</pre>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0", color: G.dim }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
                <div style={{ fontSize: 12, marginBottom: 12 }}>{t.noPlan}</div>
                <div style={{ display: "flex", gap: 7, justifyContent: "center", flexWrap: "wrap" }}>
                  <Btn ch={t.chooseWorkout} v="gold" onClick={() => setShowWO(true)} sx={{ padding: "8px 14px", fontSize: 12 }} />
                  <Btn ch={t.writeManual} v="ghost" onClick={() => startEdit(sc, "workout")} sx={{ padding: "8px 14px", fontSize: 12 }} />
                </div>
              </div>
            )}
          </div>

          {/* NUTRITION */}
          <div className="card" style={{ padding: 18, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: G.green }}>🥗 {isAr ? "خطة التغذية" : "Nutrition Plan"}</div>
              {!editing ? (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <Btn ch={t.chooseMeal} v="green" onClick={() => setShowMeal(true)} sx={{ padding: "6px 10px", fontSize: 11 }} />
                  <Btn ch={t.writeManual} v="ghost" onClick={() => startEdit(sc, "nutrition")} sx={{ padding: "6px 10px", fontSize: 11 }} />
                  {sc.nutritionPlan && <Btn ch="🗑️" v="danger" onClick={() => clearPlan(sc, "nutrition")} sx={{ padding: "6px 10px", fontSize: 11 }} />}
                </div>
              ) : editing.type === "nutrition" ? (
                <div style={{ display: "flex", gap: 5 }}>
                  <Btn ch={`✓ ${t.save}`} v="gold" onClick={saveEdit} sx={{ padding: "6px 12px", fontSize: 11 }} />
                  <Btn ch="✕" v="danger" onClick={() => { setEditing(null); setDraft(""); }} sx={{ padding: "6px 10px", fontSize: 11 }} />
                </div>
              ) : null}
            </div>

            {editing?.type === "nutrition" && editing.id === sc.id ? (
              <div>
                <textarea value={draft} onChange={e => setDraft(e.target.value)} style={{ width: "100%", minHeight: 220, background: G.surf2, border: `1px solid ${G.borderHi}`, borderRadius: 10, padding: 12, color: G.text, fontSize: 13, lineHeight: 1.8, resize: "vertical", outline: "none", fontFamily: "Inter,sans-serif" }} />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 9 }}>
                  <Btn ch={t.cancel} v="danger" onClick={() => { setEditing(null); setDraft(""); }} sx={{ padding: "8px 14px" }} />
                  <Btn ch={`✓ ${t.save}`} v="gold" onClick={saveEdit} sx={{ padding: "8px 20px", fontWeight: 700 }} />
                </div>
              </div>
            ) : sc.nutritionPlan ? (
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.9, color: G.text }}>{sc.nutritionPlan}</pre>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0", color: G.dim }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🥗</div>
                <div style={{ fontSize: 12, marginBottom: 12 }}>{t.noPlan}</div>
                <div style={{ display: "flex", gap: 7, justifyContent: "center", flexWrap: "wrap" }}>
                  <Btn ch={t.chooseMeal} v="green" onClick={() => setShowMeal(true)} sx={{ padding: "8px 14px", fontSize: 12 }} />
                  <Btn ch={t.writeManual} v="ghost" onClick={() => startEdit(sc, "nutrition")} sx={{ padding: "8px 14px", fontSize: 12 }} />
                </div>
              </div>
            )}
          </div>

          {/* PDF DOWNLOAD */}
          <Btn ch={`📄 ${isAr ? "تحميل PDF الكامل" : "Download Full PDF (Client + Workout + Nutrition)"}`} v="gold" full onClick={() => generatePDF(sc, lang)} sx={{ padding: "13px", fontSize: 13, fontWeight: 700 }} />
        </div>
      )}

      <Ovl show={showWO} close={() => setShowWO(false)} mw={640} ch={<WorkoutSystemSelector client={sc} onSelect={applyWorkoutSystem} onClose={() => setShowWO(false)} lang={lang} />} />
      <Ovl show={showMeal} close={() => setShowMeal(false)} mw={580} ch={<MealSelector client={sc} onSelect={applyMeal} onClose={() => setShowMeal(false)} lang={lang} />} />
    </div>
  );
}

// ── REGISTER PAGE ──────────────────────────────────────────
// ── PROGRESS TAB ───────────────────────────────────────────
function ProgressTab({ client, setClients, lang, isAr, t }) {
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newFile, setNewFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileRef = useCallback(node => {}, []);

  useEffect(() => {
    if (!client?.id) return;
    dbGetPhotos(client.id).then(p => { setPhotos(p); setLoadingPhotos(false); });
  }, [client?.id]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setNewFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const addEntry = async () => {
    if (!newWeight && !newFile) return;
    setUploading(true);
    // Update weight in progress array
    if (newWeight) {
      const entry = { date: new Date().toISOString().split("T")[0], weight: +newWeight };
      const updatedProgress = [...(client.progress || []), entry];
      const updated = { ...client, weight: +newWeight, progress: updatedProgress };
      await dbUpdateClient(updated);
      setClients(p => p.map(c => c.id === client.id ? updated : c));
    }
    // Upload photo
    if (newFile) {
      const photo = await dbAddPhoto(client.id, newFile, newWeight, newNotes);
      if (photo) setPhotos(p => [photo, ...p]);
    }
    setNewWeight(""); setNewNotes(""); setNewFile(null); setPreviewUrl(null);
    setShowAdd(false); setUploading(false);
  };

  const progress = client?.progress || [];
  const startW = progress[0]?.weight;
  const currentW = client?.weight;
  const totalChange = startW && currentW ? (currentW - startW).toFixed(1) : null;

  return (
    <div className="fd">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div className="sf gd" style={{ fontSize: 20, fontWeight: 700 }}>{t.progress}</div>
        <Btn ch={`+ ${isAr ? "تحديث" : "Update"}`} v="gold" onClick={() => setShowAdd(!showAdd)} sx={{ padding: "8px 14px", fontSize: 13 }} />
      </div>

      {/* Add Entry Form */}
      {showAdd && (
        <div className="card" style={{ padding: 16, marginBottom: 14, border: `1px solid ${G.borderHi}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: G.gold, marginBottom: 12 }}>📊 {isAr ? "تحديث التقدم" : "Log Progress"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{isAr ? "الوزن (كج)" : "Weight (kg)"}</div>
              <input className="inp" type="number" placeholder={`${client?.weight || 70}`} value={newWeight} onChange={e => setNewWeight(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{isAr ? "ملاحظات" : "Notes"}</div>
              <input className="inp" placeholder={isAr ? "اختياري" : "Optional"} value={newNotes} onChange={e => setNewNotes(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>📸 {isAr ? "صورة التقدم" : "Progress Photo"}</div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: G.surf2, border: `1px dashed ${G.border}`, borderRadius: 10, cursor: "pointer" }}>
              <span style={{ fontSize: 20 }}>📷</span>
              <span style={{ fontSize: 13, color: G.muted }}>{newFile ? newFile.name : (isAr ? "اضغط لاختيار صورة" : "Tap to choose photo")}</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
            </label>
            {previewUrl && <img src={previewUrl} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10, marginTop: 8 }} />}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn ch={uploading ? "⏳" : `✓ ${isAr ? "حفظ" : "Save"}`} v="gold" onClick={addEntry} sx={{ flex: 1, padding: "11px", fontSize: 13 }} />
            <Btn ch="✕" v="danger" onClick={() => { setShowAdd(false); setNewFile(null); setPreviewUrl(null); }} sx={{ padding: "11px 16px" }} />
          </div>
        </div>
      )}

      {/* Stats */}
      {progress.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { l: isAr ? "البداية" : "Start", v: `${startW}kg`, c: G.muted },
            { l: isAr ? "الحالي" : "Current", v: `${currentW}kg`, c: G.gold },
            { l: isAr ? "التغيير" : "Change", v: totalChange ? `${totalChange > 0 ? "+" : ""}${totalChange}kg` : "—", c: totalChange && parseFloat(totalChange) < 0 ? G.green : G.red },
          ].map(x => (
            <div key={x.l} className="card" style={{ padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: x.c }}>{x.v}</div>
              <div style={{ fontSize: 9, color: G.muted, marginTop: 3 }}>{x.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Weight History */}
      {progress.length > 0 && (
        <div className="card" style={{ padding: 13, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: G.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>{isAr ? "سجل الوزن" : "Weight History"}</div>
          {[...progress].reverse().map((p, i) => {
            const prev = [...progress].reverse()[i + 1];
            const diff = prev ? (p.weight - prev.weight).toFixed(1) : null;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 6px", borderBottom: i < progress.length - 1 ? `1px solid ${G.border}` : "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: G.grad, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: G.muted }}>{p.date}</div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>{p.weight} <span style={{ fontSize: 10, color: G.muted }}>kg</span></div>
                </div>
                {diff !== null && <div style={{ fontSize: 12, fontWeight: 700, color: parseFloat(diff) <= 0 ? G.green : G.red }}>{parseFloat(diff) > 0 ? "+" : ""}{diff}kg</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Photos */}
      <div>
        <div style={{ fontSize: 11, color: G.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>{isAr ? "صور التقدم" : "Progress Photos"}</div>
        {loadingPhotos ? (
          <div style={{ textAlign: "center", padding: 20 }}><div className="sp" style={{ margin: "0 auto" }} /></div>
        ) : photos.length === 0 ? (
          <div className="card" style={{ padding: "24px 16px", textAlign: "center", color: G.dim }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
            <div style={{ fontSize: 12 }}>{isAr ? "لا توجد صور بعد" : "No photos yet"}</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {photos.map(ph => (
              <div key={ph.id} className="card" style={{ overflow: "hidden" }}>
                <img src={ph.photo_url} alt="progress" style={{ width: "100%", height: 160, objectFit: "cover" }} />
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: G.muted }}>{ph.taken_at}</div>
                  {ph.weight && <div style={{ fontSize: 13, fontWeight: 700, color: G.gold }}>{ph.weight} kg</div>}
                  {ph.notes && <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>{ph.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RegPage({ lang, setLang, onSubmit }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", age: "", weight: "", height: "", gender: "male", goal: "Weight Loss", pal: "moderate" });
  const [country, setCountry] = useState("+974");
  const [done, setDone] = useState(false);
  const t = T[lang]; const isAr = lang === "ar";
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const submit = () => { if (!f.name || !f.email || !f.phone) return; onSubmit({ ...f, phone: `${country} ${f.phone}` }); setDone(true); };
  const goals = isAr ? GOALS_AR : GOALS_EN;

  if (done) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{CSS}</style>
      <div className="card" style={{ maxWidth: 400, width: "100%", padding: "36px 22px", textAlign: "center", border: `1px solid ${G.borderHi}` }} dir={isAr ? "rtl" : "ltr"}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div className="sf gd" style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{t.regSubmitted}</div>
        <div style={{ fontSize: 14, color: G.muted, lineHeight: 1.8 }}>{t.regApproval}</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: G.bg, padding: 20 }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><LangBtn lang={lang} setLang={setLang} /></div>
        <div style={{ textAlign: "center", padding: "16px 0 18px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Logo s={44} /></div>
          <div className="sf gd" style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>{t.appName}</div>
          <div style={{ fontSize: 11, color: G.muted, letterSpacing: 2, marginTop: 5 }}>{t.joinUs}</div>
        </div>
        <div className="card" style={{ padding: 20, border: `1px solid ${G.borderHi}` }} dir={isAr ? "rtl" : "ltr"}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            <div style={{ gridColumn: "1/-1" }}><FF label={`${t.fullName} *`} value={f.name} onChange={v => set("name", v)} ph="Name" /></div>
            <div style={{ gridColumn: "1/-1" }}><FF label="Email *" value={f.email} onChange={v => set("email", v)} ph="email@example.com" /></div>
            <div style={{ gridColumn: "1/-1" }}><PhoneField label={`${t.phone} *`} country={country} setCountry={setCountry} phone={f.phone} setPhone={v => set("phone", v)} /></div>
            <FF label={t.age} value={f.age} onChange={v => set("age", v)} ph="25" />
            <FF label={`${t.weight} (kg)`} value={f.weight} onChange={v => set("weight", v)} ph="70" />
            <FF label={`${t.height} (cm)`} value={f.height} onChange={v => set("height", v)} ph="170" />
            <FF label={t.gender} value={f.gender} onChange={v => set("gender", v)} opts={[{ id: "male", label: t.male }, { id: "female", label: t.female }]} />
            <FF label={t.goal} value={f.goal} onChange={v => set("goal", v)} opts={goals} />
            <div style={{ gridColumn: "1/-1" }}><FF label={t.activityLevel} value={f.pal} onChange={v => set("pal", v)} opts={PAL.map(p => ({ id: p.id, label: `${p.icon} ${isAr ? p.ar : p.en}` }))} /></div>
          </div>
          <Btn ch={t.submitRequest} v="gold" full onClick={submit} sx={{ padding: "12px", fontSize: 14, marginTop: 16 }} />
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: G.dim }}>
          {t.alreadyAccount} <a href="/" style={{ color: G.gold }}>{t.loginHere}</a>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState(() => ld(LK, "en"));
  const [clients, setClients] = useState([]);
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState(() => {
    try { return sessionStorage.getItem("pd_screen") || "login"; } catch { return "login"; }
  });
  const [curUser, setCurUser] = useState(() => {
    try { const u = sessionStorage.getItem("pd_user"); return u ? JSON.parse(u) : null; } catch { return null; }
  });
  const [lf, setLf] = useState({ u: "", p: "" });
  const [lErr, setLErr] = useState("");
  const [aTab, setATab] = useState("dashboard");
  const [cTab, setCTab] = useState("profile");
  const [selC, setSelC] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editC, setEditC] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [shareD, setShareD] = useState(null);
  const blank = { name: "", email: "", password: "", age: "", weight: "", height: "", gender: "male", goal: "Weight Loss", pal: "moderate", phone: "" };
  const [form, setForm] = useState(blank);
  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const [addCountry, setAddCountry] = useState("+974");
  const [editCountry, setEditCountry] = useState("+974");

  const t = T[lang]; const isAr = lang === "ar";

  // Load data from Supabase on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [cls, rgs] = await Promise.all([dbGetClients(), dbGetRegs()]);
      if (cls) setClients(cls); else setClients(ld(SK, DEMO));
      if (rgs) setRegs(rgs); else setRegs(ld(RK, []));
      setLoading(false);
    };
    load();
  }, []);

  // Persist lang
  useEffect(() => { sv(LK, lang); }, [lang]);

  // Persist login session across refresh
  useEffect(() => {
    try {
      sessionStorage.setItem("pd_screen", screen);
      sessionStorage.setItem("pd_user", curUser ? JSON.stringify(curUser) : "");
    } catch {}
  }, [screen, curUser]);

  // Keep curUser in sync with latest client data
  useEffect(() => {
    if (curUser?.id) {
      const latest = clients.find(c => c.id === curUser.id);
      if (latest) setCurUser(latest);
    }
  }, [clients]);

  if (window.location.pathname === "/register") {
    return <RegPage lang={lang} setLang={setLang} onSubmit={async (data) => { await dbAddReg(data); }} />;
  }

  const login = () => {
    setLErr("");
    if (lf.u === ADMIN.u && lf.p === ADMIN.p) { setCurUser({ name: TRAINER.name }); setScreen("admin"); return; }
    const c = clients.find(x => x.email === lf.u && x.password === lf.p);
    if (c) { if (c.status !== "Active") { setLErr(t.accountDisabled); return; } setCurUser(c); setScreen("client"); return; }
    setLErr(t.invalidCredentials);
  };
  const logout = () => {
    setScreen("login"); setCurUser(null); setLf({ u: "", p: "" });
    try { sessionStorage.removeItem("pd_screen"); sessionStorage.removeItem("pd_user"); } catch {}
  };
  const addClient = async () => {
    if (!form.name || !form.email) return;
    const pwd = form.password || genPwd();
    const fullPhone = form.phone ? `${addCountry} ${form.phone}` : "";
    const c = { ...form, phone: fullPhone, password: pwd, age: +form.age || 25, weight: +form.weight || 70, height: +form.height || 170, joinDate: new Date().toISOString().split("T")[0], status: "Active", workoutPlan: null, nutritionPlan: null, workoutSystemId: null, mealPlanId: null, progress: [{ date: new Date().toISOString().split("T")[0], weight: +form.weight || 70 }] };
    const saved = await dbAddClient(c);
    if (saved) setClients(p => [...p, saved]);
    setShowAdd(false); setShareD({ name: c.name, email: c.email, password: pwd, phone: c.phone }); setShowShare(true); setForm(blank); setAddCountry("+974");
  };
  const saveEdit = async () => {
    if (!editC) return;
    const fullPhone = form.phone ? `${editCountry} ${form.phone}` : editC.phone;
    const updated = { ...editC, name: form.name || editC.name, email: form.email || editC.email, password: form.password || editC.password, age: +form.age || editC.age, weight: +form.weight || editC.weight, height: +form.height || editC.height, gender: form.gender || editC.gender, goal: form.goal || editC.goal, pal: form.pal || editC.pal, phone: fullPhone };
    await dbUpdateClient(updated);
    setClients(p => p.map(c => c.id === editC.id ? updated : c));
    setShowEdit(false); setEditC(null); setForm(blank);
  };
  const openEdit = (c) => {
    setEditC(c);
    const parts = (c.phone || "").split(" ");
    const knownCode = COUNTRIES.find(cc => cc.code === parts[0]);
    setEditCountry(knownCode ? parts[0] : "+974");
    const restNumber = knownCode ? parts.slice(1).join("") : (c.phone || "").replace(/\D/g, "");
    setForm({ name: c.name, email: c.email, password: c.password, age: String(c.age), weight: String(c.weight), height: String(c.height), gender: c.gender || "male", goal: c.goal, pal: c.pal || "moderate", phone: restNumber });
    setShowEdit(true);
  };
  const approveReg = async (reg) => {
    const pwd = genPwd();
    const c = { name: reg.name, email: reg.email, password: pwd, age: +reg.age || 25, weight: +reg.weight || 70, height: +reg.height || 170, gender: reg.gender || "male", goal: reg.goal || "General Fitness", pal: reg.pal || "moderate", phone: reg.phone, joinDate: new Date().toISOString().split("T")[0], status: "Active", workoutPlan: null, nutritionPlan: null, workoutSystemId: null, mealPlanId: null, progress: [{ date: new Date().toISOString().split("T")[0], weight: +reg.weight || 70 }] };
    const saved = await dbAddClient(c);
    if (saved) setClients(p => [...p, saved]);
    await dbDeleteReg(reg.id);
    setRegs(p => p.filter(r => r.id !== reg.id));
    setShareD({ name: c.name, email: c.email, password: pwd, phone: c.phone }); setShowShare(true);
  };
  const toggleStatus = async (id) => {
    const c = clients.find(x => x.id === id);
    if (!c) return;
    const updated = { ...c, status: c.status === "Active" ? "Disabled" : "Active" };
    await dbUpdateClient(updated);
    setClients(p => p.map(x => x.id === id ? updated : x));
  };
  const deleteClient = async (id) => {
    await dbDeleteClient(id);
    setClients(p => p.filter(x => x.id !== id));
  };
  const regLink = `${window.location.origin}/register`;
  const liveC = clients.find(c => c.id === curUser?.id) || curUser;
  const activeCount = clients.filter(c => c.status === "Active").length;
  const goals = clients.reduce((a, c) => { a[c.goal] = (a[c.goal] || 0) + 1; return a; }, {});
  const GOALS = isAr ? GOALS_AR : GOALS_EN;
  const NAV = [{ id: "dashboard", l: t.dashboard, i: "◈" }, { id: "clients", l: t.clients, i: "◎" }, { id: "plans", l: t.plans, i: "▤" }, { id: "requests", l: `${t.requests}${regs.length ? `(${regs.length})` : ""}`, i: "📋" }];

  // LOADING
  if (loading) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{CSS}</style>
      <Logo s={52} />
      <div className="sp" />
      <div style={{ color: G.muted, fontSize: 13 }}>Loading...</div>
    </div>
  );

  // LOGIN
  if (screen === "login") return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{CSS}</style>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><LangBtn lang={lang} setLang={setLang} /></div>
        <div className="card fd" style={{ padding: "32px 22px", border: `1px solid ${G.borderHi}` }} dir={isAr ? "rtl" : "ltr"}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Logo s={56} /></div>
            <div className="sf gd" style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>{t.appName}</div>
            <div style={{ fontSize: 11, color: G.muted, letterSpacing: 2, textTransform: "uppercase", marginTop: 5 }}>{t.tagline}</div>
            <div style={{ width: 36, height: 2, background: G.grad, margin: "10px auto 0", borderRadius: 2 }} />
          </div>
          {lErr && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 14, textAlign: "center" }}>{lErr}</div>}
          <div style={{ marginBottom: 11 }}>
            <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{t.email}</div>
            <input className="inp" placeholder={t.email} value={lf.u} onChange={e => setLf(p => ({ ...p, u: e.target.value }))} onKeyDown={e => e.key === "Enter" && login()} style={{ direction: "ltr" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{t.password}</div>
            <input className="inp" type="password" placeholder="••••••••" value={lf.p} onChange={e => setLf(p => ({ ...p, p: e.target.value }))} onKeyDown={e => e.key === "Enter" && login()} />
          </div>
          <Btn ch={t.enter} v="gold" full onClick={login} sx={{ padding: "13px", fontSize: 15, letterSpacing: 1 }} />
          <div style={{ textAlign: "center", marginTop: 12 }}><a href="/register" style={{ fontSize: 13, color: G.gold, textDecoration: "none" }}>{t.newMember}</a></div>
        </div>
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#080600", fontSize: 12 }}>MR</div>
            <div style={{ textAlign: isAr ? "right" : "left" }}>
              <div className="sf gd" style={{ fontSize: 13, fontWeight: 700 }}>{TRAINER.name}</div>
              <div style={{ fontSize: 11, color: G.muted }}>{isAr ? TRAINER.designationAr : TRAINER.designation}</div>
            </div>
          </div>
          <a href={`https://wa.me/${TRAINER.whatsapp}`} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 20, color: G.green, textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
            💬 {isAr ? "تواصل معنا" : "Contact on WhatsApp"}
          </a>
        </div>
      </div>
    </div>
  );

  // CLIENT PORTAL
  if (screen === "client" && liveC) {
    const pal = PAL.find(p => p.id === (liveC.pal || "moderate")) || PAL[2];
    const tdee = calcTDEE(liveC.weight, liveC.height, liveC.age, liveC.gender || "male", pal.factor);
    const bmi = (liveC.weight / ((liveC.height / 100) ** 2)).toFixed(1);
    const bmiLabel = bmi < 18.5 ? (isAr ? "نحيف" : "Underweight") : bmi < 25 ? (isAr ? "صحي" : "Healthy") : bmi < 30 ? (isAr ? "زيادة وزن" : "Overweight") : (isAr ? "بدانة" : "Obese");
    const bmiColor = bmi < 18.5 ? G.amber : bmi < 25 ? G.green : bmi < 30 ? G.amber : G.red;
    return (
      <div style={{ minHeight: "100vh", background: G.bg, color: G.text }} dir={isAr ? "rtl" : "ltr"}>
        <style>{CSS}</style>
        <div style={{ background: G.surf, borderBottom: `1px solid ${G.border}`, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Logo s={26} /><div className="sf gd" style={{ fontSize: 13, fontWeight: 700 }}>{t.appName}</div></div>
          <div style={{ display: "flex", gap: 7 }}><LangBtn lang={lang} setLang={setLang} /><Btn ch={t.logout} v="danger" onClick={logout} sx={{ padding: "5px 12px", fontSize: 12 }} /></div>
        </div>
        <div style={{ background: G.surf, borderBottom: `1px solid ${G.border}`, display: "flex", overflowX: "auto" }}>
          {[{ id: "profile", l: t.profile }, { id: "workout", l: t.workout }, { id: "nutrition", l: t.nutrition }, { id: "progress", l: t.progress }].map(tab => (
            <button key={tab.id} className="btn" onClick={() => setCTab(tab.id)} style={{ padding: "12px 16px", background: "none", fontSize: 13, fontWeight: 600, color: cTab === tab.id ? G.gold : G.muted, borderBottom: cTab === tab.id ? `2px solid ${G.gold}` : "2px solid transparent", whiteSpace: "nowrap" }}>{tab.l}</button>
          ))}
        </div>
        <div style={{ padding: 14, maxWidth: 600, margin: "0 auto" }}>
          {cTab === "profile" && (
            <div className="fd">
              <div style={{ marginBottom: 14 }}>
                <div className="sf gd" style={{ fontSize: 22, fontWeight: 700 }}>{t.welcome}, {liveC.name.split(" ")[0]}!</div>
                <div style={{ fontSize: 12, color: G.muted, marginTop: 3 }}>{t.memberSince} {liveC.joinDate}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 11 }}>
                {[{ l: t.age, v: `${liveC.age}y` }, { l: t.weight, v: `${liveC.weight}kg` }, { l: t.height, v: `${liveC.height}cm` }, { l: t.goal, v: liveC.goal }].map((x, i) => (
                  <div key={i} className="card" style={{ padding: 12 }}><div style={{ fontSize: 9, color: G.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>{x.l}</div><div style={{ fontSize: 15, fontWeight: 700 }}>{x.v}</div></div>
                ))}
              </div>
              <div className="card" style={{ padding: 14, marginBottom: 11 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div><div style={{ fontSize: 9, color: G.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>{t.bmi}</div><div style={{ fontSize: 36, fontWeight: 800, color: bmiColor }}>{bmi}</div><div style={{ fontSize: 12, fontWeight: 700, color: bmiColor }}>{bmiLabel}</div></div>
                  <div style={{ fontSize: 11, color: G.muted, lineHeight: 2.1 }}>
                    {[["<18.5", isAr ? "نحيف" : "Underweight", G.amber], ["18.5–24.9", isAr ? "صحي" : "Healthy", G.green], ["25–29.9", isAr ? "زيادة وزن" : "Overweight", G.amber], ["≥30", isAr ? "بدانة" : "Obese", G.red]].map(([r, l, c]) => (
                      <div key={l} style={{ display: "flex", gap: 8 }}><span>{r}</span><span style={{ color: c, fontWeight: 700, minWidth: 70 }}>{l}</span></div>
                    ))}
                  </div>
                </div>
              </div>
              <TDEECard client={liveC} t={t} lang={lang} />
              <div className="card" style={{ padding: 14, border: `1px solid ${G.borderHi}` }}>
                <div style={{ fontSize: 9, color: G.muted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 11 }}>{t.yourTrainer}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#080600", fontSize: 14 }}>MR</div>
                    <div><div className="sf gd" style={{ fontSize: 15, fontWeight: 700 }}>{TRAINER.name}</div><div style={{ fontSize: 11, color: G.muted }}>{isAr ? TRAINER.designationAr : TRAINER.designation}</div></div>
                  </div>
                  <a href={`https://wa.me/${TRAINER.whatsapp}`} target="_blank" rel="noreferrer" style={{ padding: "8px 14px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 8, color: G.green, textDecoration: "none", fontSize: 12, fontWeight: 700 }}>💬 WhatsApp</a>
                </div>
              </div>
              {(liveC.workoutPlan || liveC.nutritionPlan) && (
                <div style={{ marginTop: 12 }}>
                  <Btn ch={`📄 ${isAr ? "تحميل خطتي PDF" : "Download My Plan PDF"}`} v="gold" full onClick={() => generatePDF(liveC, lang)} sx={{ padding: "12px", fontSize: 13 }} />
                </div>
              )}
            </div>
          )}
          {(cTab === "workout" || cTab === "nutrition") && (
            <div className="fd">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div className="sf gd" style={{ fontSize: 20, fontWeight: 700 }}>{cTab === "workout" ? "⚡ " + t.workout : "🥗 " + t.nutrition}</div>
                {(cTab === "workout" ? liveC.workoutPlan : liveC.nutritionPlan) && (
                  <Btn ch="📄 PDF" v="ghost" onClick={() => generatePDF(liveC, lang)} sx={{ padding: "7px 12px", fontSize: 12 }} />
                )}
              </div>
              {cTab === "workout" ? (
                (() => {
                  const ws = WORKOUT_SYSTEMS.find(w => w.id === liveC.workoutSystemId);
                  if (ws) {
                    return (
                      <div>
                        {/* System header */}
                        <div className="card" style={{ padding: "12px 14px", marginBottom: 14, border: `1px solid ${ws.color}30`, background: `${ws.color}08` }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: ws.color }}>{ws.emoji} {isAr ? ws.nameAr : ws.name}</div>
                          <div style={{ fontSize: 11, color: G.muted, marginTop: 3 }}>{isAr ? ws.descAr : ws.desc}</div>
                        </div>
                        {/* Days with exercise cards */}
                        {ws.days.map((day, di) => (
                          <div key={di} style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: ws.color, marginBottom: 10, padding: "7px 12px", background: `${ws.color}15`, borderRadius: 8 }}>
                              📅 {day.name}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              {day.exercises.map((ex, ei) => (
                                <ExerciseCard key={ei} exercise={ex} color={ws.color} lang={lang} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } else if (liveC.workoutPlan) {
                    return (
                      <div className="card" style={{ padding: 16 }}>
                        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.9, color: G.text }}>{liveC.workoutPlan}</pre>
                      </div>
                    );
                  } else {
                    return (
                      <div className="card" style={{ textAlign: "center", padding: "36px 20px", color: G.dim }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
                        <div style={{ color: G.muted }}>{t.trainerWillAdd}</div>
                      </div>
                    );
                  }
                })()
              ) : (
                <div className="card" style={{ padding: 16, minHeight: 150 }}>
                  {liveC.nutritionPlan
                    ? <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.9, color: G.text }}>{liveC.nutritionPlan}</pre>
                    : <div style={{ textAlign: "center", padding: "36px 20px", color: G.dim }}><div style={{ fontSize: 28, marginBottom: 8 }}>🥗</div><div style={{ color: G.muted }}>{t.trainerWillAdd}</div></div>}
                </div>
              )}
            </div>
          )}
          {cTab === "progress" && (
            <ProgressTab client={liveC} setClients={setClients} lang={lang} isAr={isAr} t={t} />
          )}
        </div>
      </div>
    );
  }

  // ADMIN
  return (
    <div style={{ minHeight: "100vh", background: G.bg, color: G.text }} dir={isAr ? "rtl" : "ltr"}>
      <style>{CSS}</style>
      <div style={{ background: G.surf, borderBottom: `1px solid ${G.border}`, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Logo s={26} /><div className="sf gd" style={{ fontSize: 13, fontWeight: 700 }}>{t.appName}</div></div>
        <div style={{ display: "flex", gap: 7 }}><LangBtn lang={lang} setLang={setLang} /><Btn ch={t.logout} v="danger" onClick={logout} sx={{ padding: "5px 12px", fontSize: 12 }} /></div>
      </div>
      <div style={{ background: G.surf, borderBottom: `1px solid ${G.border}`, display: "flex", overflowX: "auto" }}>
        {NAV.map(n => (<button key={n.id} className="btn" onClick={() => setATab(n.id)} style={{ padding: "11px 12px", background: "none", fontSize: 12, fontWeight: 600, color: aTab === n.id ? G.gold : G.muted, borderBottom: aTab === n.id ? `2px solid ${G.gold}` : "2px solid transparent", whiteSpace: "nowrap" }}>{n.i} {n.l}</button>))}
      </div>

      <div style={{ padding: 14, maxWidth: 860, margin: "0 auto" }}>

        {/* DASHBOARD */}
        {aTab === "dashboard" && (
          <div className="fd">
            <div style={{ marginBottom: 14 }}><div className="sf gd" style={{ fontSize: 22, fontWeight: 700 }}>{t.welcome}, {TRAINER.name.split(" ")[0]}! 👋</div></div>
            {regs.length > 0 && <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 11, padding: "11px 13px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}><div><div style={{ fontSize: 13, fontWeight: 700, color: G.amber }}>📋 {regs.length} {t.pendingRequests}</div></div><Btn ch={isAr ? "مراجعة" : "Review"} v="amber" onClick={() => setATab("requests")} sx={{ padding: "7px 14px", fontSize: 12 }} /></div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              {[{ l: t.total, v: clients.length, c: G.gold }, { l: t.active, v: activeCount, c: G.green }, { l: t.pending, v: regs.length, c: G.amber }, { l: isAr ? "لديهم خطط" : "With Plans", v: clients.filter(c => c.workoutPlan || c.nutritionPlan).length, c: G.blue }].map((s, i) => (
                <div key={i} className="card" style={{ padding: 14 }}><div style={{ fontSize: 28, fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</div><div style={{ fontSize: 11, color: G.muted, marginTop: 5 }}>{s.l}</div></div>
              ))}
            </div>
            <div className="card" style={{ padding: 14, marginBottom: 12, border: `1px solid ${G.borderHi}` }}>
              <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>{t.registrationLink}</div>
              <div style={{ background: G.surf2, borderRadius: 7, padding: "7px 11px", fontSize: 11, color: G.muted, marginBottom: 10, wordBreak: "break-all", direction: "ltr" }}>{regLink}</div>
              <div style={{ display: "flex", gap: 7 }}>
                <Btn ch={t.copyLink} v="ghost" onClick={() => navigator.clipboard.writeText(regLink)} sx={{ padding: "7px 13px", fontSize: 12 }} />
                <a href={`https://wa.me/?text=${encodeURIComponent(`${isAr ? "سجّل في Physical Definition:" : "Join Physical Definition! Register:"} ${regLink}`)}`} target="_blank" rel="noreferrer" style={{ ...VV.green, padding: "7px 13px", fontSize: 12, fontWeight: 600, borderRadius: 8, textDecoration: "none" }}>💬 {isAr ? "واتساب" : "WhatsApp"}</a>
              </div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>{t.goalsDistribution}</div>
              {Object.entries(goals).map(([g, c]) => (<div key={g} style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 12 }}><span>{g}</span><span style={{ color: G.gold, fontWeight: 700 }}>{c}</span></div><div style={{ height: 3, background: G.surf2, borderRadius: 3 }}><div style={{ height: "100%", width: `${(c / clients.length) * 100}%`, background: G.grad, borderRadius: 3 }} /></div></div>))}
            </div>
          </div>
        )}

        {/* CLIENTS */}
        {aTab === "clients" && (
          <div className="fd">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div><div className="sf gd" style={{ fontSize: 22, fontWeight: 700 }}>{t.clients}</div><div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>{clients.length} · {activeCount} {t.active}</div></div>
              <Btn ch={t.addClient} v="gold" onClick={() => { setForm(blank); setShowAdd(true); }} sx={{ padding: "8px 16px", fontSize: 13 }} />
            </div>
            {clients.map(c => {
              const disabled = c.status === "Disabled";
              const ws = WORKOUT_SYSTEMS.find(w => w.id === c.workoutSystemId);
              return (
                <div key={c.id} className="card" style={{ padding: 13, marginBottom: 9, opacity: disabled ? 0.6 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
                    <Av name={c.name} sz={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: G.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</div>
                      {ws && <div style={{ fontSize: 10, color: ws.color, marginTop: 2 }}>{ws.emoji} {isAr ? ws.nameAr : ws.name}</div>}
                    </div>
                    <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: c.status === "Active" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: c.status === "Active" ? G.green : G.red, border: `1px solid ${c.status === "Active" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` }}>{c.status === "Active" ? t.active : t.disabled}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 9 }}>
                    {[{ l: t.goal, v: c.goal }, { l: t.weight, v: `${c.weight}kg` }, { l: t.age, v: `${c.age}y` }].map(x => (<div key={x.l} style={{ background: G.surf2, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}><div style={{ fontSize: 9, color: G.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{x.l}</div><div style={{ fontSize: 11, fontWeight: 700 }}>{x.v}</div></div>))}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 9 }}>
                    <div style={{ flex: 1, background: G.surf2, borderRadius: 7, padding: "6px", textAlign: "center", border: `1px solid ${c.workoutPlan ? "rgba(34,197,94,0.2)" : G.border}`, fontSize: 11, color: c.workoutPlan ? G.green : G.dim }}>⚡ {c.workoutPlan ? "✓" : "—"}</div>
                    <div style={{ flex: 1, background: G.surf2, borderRadius: 7, padding: "6px", textAlign: "center", border: `1px solid ${c.nutritionPlan ? "rgba(34,197,94,0.2)" : G.border}`, fontSize: 11, color: c.nutritionPlan ? G.green : G.dim }}>🥗 {c.nutritionPlan ? "✓" : "—"}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5, marginBottom: 9 }}>
                    <Btn ch="✏️" v="ghost" onClick={() => openEdit(c)} sx={{ padding: "6px", fontSize: 12 }} />
                    <Btn ch="📋" v="ghost" onClick={() => { setSelC(c); setATab("plans"); }} sx={{ padding: "6px", fontSize: 12 }} />
                    <Btn ch="📄" v="blue" onClick={() => generatePDF(c, lang)} sx={{ padding: "6px", fontSize: 12 }} />
                    <Btn ch={disabled ? "▶" : "⏸"} v={disabled ? "green" : "amber"} onClick={() => toggleStatus(c.id)} sx={{ padding: "6px", fontSize: 12 }} />
                    <Btn ch="🗑️" v="danger" onClick={() => { if (window.confirm(`${isAr ? "حذف" : "Delete"} ${c.name}?`)) deleteClient(c.id); }} sx={{ padding: "6px", fontSize: 12 }} />
                  </div>
                  {c.phone && (() => {
                    const msg = `🏋️ *Physical Definition*\n\n${isAr ? "مرحباً" : "Hi"} ${c.name}!\n\n${isAr ? "بيانات دخولك" : "Your login details"}:\n\n📧 *${isAr ? "البريد" : "Email"}:* ${c.email}\n🔑 *${isAr ? "كلمة المرور" : "Password"}:* ${c.password}\n\n🌐 *App:* ${TRAINER.appUrl}\n\n${isAr ? "افتح الرابط وأضفه للشاشة الرئيسية 📱" : "Open link & Add to Home Screen 📱"}\n\n— ${TRAINER.name}`;
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        <a href={`https://wa.me/${c.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`}
                          target="_blank" rel="noreferrer"
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, color: G.green, textDecoration: "none", fontSize: 11, fontWeight: 700 }}>
                          💬 {t.shareLogin}
                        </a>
                        <button className="btn" onClick={() => navigator.clipboard.writeText(msg)}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 7, color: G.gold, fontSize: 11, fontWeight: 700 }}>
                          📋 {isAr ? "نسخ" : "Copy"}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}

        {/* PLANS */}
        {aTab === "plans" && <PlansTab clients={clients} selC={selC} setSelC={setSelC} setClients={setClients} lang={lang} onUpdate={dbUpdateClient} />}

        {/* REQUESTS */}
        {aTab === "requests" && (
          <div className="fd">
            <div style={{ marginBottom: 12 }}><div className="sf gd" style={{ fontSize: 22, fontWeight: 700 }}>{t.pendingRequests}</div></div>
            <div className="card" style={{ padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: G.muted, marginBottom: 8 }}>{t.shareRegLink}:</div>
              <div style={{ display: "flex", gap: 7 }}>
                <Btn ch={t.copyLink} v="ghost" onClick={() => navigator.clipboard.writeText(regLink)} sx={{ padding: "6px 12px", fontSize: 11 }} />
                <a href={`https://wa.me/?text=${encodeURIComponent(regLink)}`} target="_blank" rel="noreferrer" style={{ ...VV.green, padding: "6px 12px", fontSize: 11, fontWeight: 600, borderRadius: 7, textDecoration: "none" }}>💬 WhatsApp</a>
              </div>
            </div>
            {regs.length === 0
              ? <div className="card" style={{ padding: "36px 20px", textAlign: "center", color: G.dim }}><div style={{ fontSize: 26, marginBottom: 8 }}>📋</div><div>{t.noRequests}</div></div>
              : regs.map(reg => (
                <div key={reg.id} className="card" style={{ padding: 14, marginBottom: 10, border: "1px solid rgba(245,158,11,0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 11 }}>
                    <Av name={reg.name} sz={38} />
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{reg.name}</div><div style={{ fontSize: 11, color: G.muted }}>{reg.email} · {reg.phone}</div><div style={{ fontSize: 10, color: G.dim }}>{new Date(reg.submittedAt).toLocaleString()}</div></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 11 }}>
                    {[{ l: t.goal, v: reg.goal }, { l: t.weight, v: `${reg.weight || "—"}kg` }, { l: t.activityLevel, v: PAL.find(p => p.id === reg.pal)?.[isAr ? "ar" : "en"] || "—" }].map(x => (<div key={x.l} style={{ background: G.surf2, borderRadius: 6, padding: 7, textAlign: "center" }}><div style={{ fontSize: 9, color: G.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{x.l}</div><div style={{ fontSize: 11, fontWeight: 700 }}>{x.v}</div></div>))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <Btn ch={`✓ ${t.approve}`} v="green" onClick={() => approveReg(reg)} sx={{ padding: "10px", fontSize: 13, fontWeight: 700 }} />
                    <Btn ch={`✕ ${t.reject}`} v="danger" onClick={() => setRegs(p => p.filter(r => r.id !== reg.id))} sx={{ padding: "10px", fontSize: 13, fontWeight: 700 }} />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ADD CLIENT */}
      <Ovl show={showAdd} close={() => setShowAdd(false)} mw={480} ch={
        <div dir={isAr ? "rtl" : "ltr"}>
          <div className="sf gd" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{t.addClient}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ gridColumn: "1/-1" }}><FF label={`${t.fullName} *`} value={form.name} onChange={v => sf("name", v)} ph="Name" /></div>
            <FF label="Email *" value={form.email} onChange={v => sf("email", v)} ph="email@example.com" />
            <PhoneField label={t.phone} country={addCountry} setCountry={setAddCountry} phone={form.phone} setPhone={v => sf("phone", v)} />
            <FF label={t.passwordAuto} value={form.password} onChange={v => sf("password", v)} ph={isAr ? "فارغ = تلقائي" : "Blank = auto"} />
            <FF label={t.age} value={form.age} onChange={v => sf("age", v)} ph="25" />
            <FF label={`${t.weight} (kg)`} value={form.weight} onChange={v => sf("weight", v)} ph="70" />
            <FF label={`${t.height} (cm)`} value={form.height} onChange={v => sf("height", v)} ph="175" />
            <FF label={t.gender} value={form.gender} onChange={v => sf("gender", v)} opts={[{ id: "male", label: t.male }, { id: "female", label: t.female }]} />
            <FF label={t.goal} value={form.goal} onChange={v => sf("goal", v)} opts={GOALS} />
            <div style={{ gridColumn: "1/-1" }}><FF label={t.activityLevel} value={form.pal} onChange={v => sf("pal", v)} opts={PAL.map(p => ({ id: p.id, label: `${p.icon} ${isAr ? p.ar : p.en}` }))} /></div>
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: 16 }}>
            <Btn ch={t.addShare} v="gold" onClick={addClient} sx={{ flex: 1, padding: "11px", fontSize: 13 }} />
            <Btn ch={t.cancel} v="ghost" onClick={() => setShowAdd(false)} sx={{ flex: 1, padding: "11px", fontSize: 13 }} />
          </div>
        </div>
      } />

      {/* EDIT CLIENT */}
      <Ovl show={showEdit} close={() => { setShowEdit(false); setEditC(null); }} mw={480} ch={
        <div dir={isAr ? "rtl" : "ltr"}>
          <div className="sf gd" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>✏️ {t.edit}</div>
          {editC && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ gridColumn: "1/-1" }}><FF label={t.fullName} value={form.name} onChange={v => sf("name", v)} ph={editC.name} /></div>
            <FF label="Email" value={form.email} onChange={v => sf("email", v)} ph={editC.email} />
            <PhoneField label={t.phone} country={editCountry} setCountry={setEditCountry} phone={form.phone} setPhone={v => sf("phone", v)} />
            <FF label={isAr ? "كلمة مرور جديدة" : "New Password"} value={form.password} onChange={v => sf("password", v)} ph={isAr ? "فارغ = نفس القديم" : "Blank = keep"} />
            <FF label={t.age} value={form.age} onChange={v => sf("age", v)} ph={String(editC.age)} />
            <FF label={`${t.weight} (kg)`} value={form.weight} onChange={v => sf("weight", v)} ph={String(editC.weight)} />
            <FF label={`${t.height} (cm)`} value={form.height} onChange={v => sf("height", v)} ph={String(editC.height)} />
            <FF label={t.gender} value={form.gender} onChange={v => sf("gender", v)} opts={[{ id: "male", label: t.male }, { id: "female", label: t.female }]} />
            <FF label={t.goal} value={form.goal} onChange={v => sf("goal", v)} opts={GOALS} />
            <div style={{ gridColumn: "1/-1" }}><FF label={t.activityLevel} value={form.pal} onChange={v => sf("pal", v)} opts={PAL.map(p => ({ id: p.id, label: `${p.icon} ${isAr ? p.ar : p.en}` }))} /></div>
          </div>}
          <div style={{ display: "flex", gap: 9, marginTop: 16 }}>
            <Btn ch={`✓ ${t.save}`} v="gold" onClick={saveEdit} sx={{ flex: 1, padding: "11px", fontSize: 13 }} />
            <Btn ch={t.cancel} v="ghost" onClick={() => { setShowEdit(false); setEditC(null); }} sx={{ flex: 1, padding: "11px", fontSize: 13 }} />
          </div>
        </div>
      } />

      {/* SHARE */}
      <Ovl show={showShare} close={() => setShowShare(false)} mw={420} ch={
        <div dir={isAr ? "rtl" : "ltr"}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 42, marginBottom: 9 }}>🎉</div>
            <div className="sf gd" style={{ fontSize: 19, fontWeight: 700 }}>{t.credentialsSent}</div>
            <div style={{ fontSize: 13, color: G.muted, marginTop: 5 }}>{t.shareDetails} {shareD?.name}</div>
          </div>
          {shareD && (() => {
            const credText = `🏋️ *Physical Definition*\n\n${isAr ? "مرحباً" : "Hi"} ${shareD.name}!\n\n${isAr ? "بيانات دخولك" : "Your login details"}:\n\n📧 *${isAr ? "البريد" : "Email"}:* ${shareD.email}\n🔑 *${isAr ? "كلمة المرور" : "Password"}:* ${shareD.password}\n\n🌐 *App:* ${TRAINER.appUrl}\n\n${isAr ? "افتح الرابط وأضفه للشاشة الرئيسية 📱" : "Open link & Add to Home Screen 📱"}\n\n— ${TRAINER.name}\n${isAr ? "مدرب شخصي معتمد" : "Certified Personal Trainer"}`;
            return (
              <>
                <div style={{ background: G.surf2, border: `1px solid ${G.borderHi}`, borderRadius: 11, padding: 14, marginBottom: 12, fontFamily: "monospace", direction: "ltr" }}>
                  <pre style={{ fontSize: 12, color: G.text, whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{credText}</pre>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {shareD?.phone && (
                    <a href={`https://wa.me/${shareD.phone.replace(/\D/g, "")}?text=${encodeURIComponent(credText)}`} target="_blank" rel="noreferrer"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 11, color: G.green, textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
                      💬 {t.sendWhatsapp}
                    </a>
                  )}
                  <Btn ch={`📋 ${isAr ? "نسخ النص" : "Copy Message"}`} v="ghost" full
                    onClick={() => { navigator.clipboard.writeText(credText); }}
                    sx={{ padding: "11px", fontSize: 13 }} />
                  <Btn ch={`📋 ${isAr ? "نسخ بيانات فقط" : "Copy Credentials Only"}`} v="ghost" full
                    onClick={() => navigator.clipboard.writeText(`Email: ${shareD.email}\nPassword: ${shareD.password}\nApp: ${TRAINER.appUrl}`)}
                    sx={{ padding: "11px", fontSize: 13 }} />
                  <Btn ch={t.close} v="danger" full onClick={() => setShowShare(false)} sx={{ padding: "11px", fontSize: 13 }} />
                </div>
              </>
            );
          })()}
        </div>
      } />
    </div>
  );
}



