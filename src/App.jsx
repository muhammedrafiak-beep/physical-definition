import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   PHYSICAL DEFINITION v6
   Features: Arabic/English bilingual, PDF share with install guide,
             Registration link share, TEE+PAL, Meal Plans, Workouts,
             Client Edit, Disable/Enable, AI Plans
═══════════════════════════════════════════════════════════════ */

// ── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  en: {
    appName: "PHYSICAL DEFINITION",
    tagline: "Your Fitness Journey Starts Here",
    login: "Sign In",
    email: "Email / Username",
    password: "Password",
    enter: "ENTER →",
    newMember: "New member? Register here →",
    welcome: "Welcome",
    profile: "Profile",
    workout: "Workout",
    nutrition: "Nutrition",
    progress: "Progress",
    dashboard: "Dashboard",
    clients: "Clients",
    aiTools: "AI Tools",
    plans: "Plans",
    requests: "Requests",
    addClient: "+ ADD",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    logout: "Sign Out",
    age: "Age",
    weight: "Weight",
    height: "Height",
    goal: "Goal",
    active: "Active",
    inactive: "Inactive",
    disabled: "Disabled",
    enable: "Enable",
    disable: "Disable",
    shareLogin: "Share Login via WhatsApp",
    approve: "Approve",
    reject: "Reject",
    noPlan: "No plan yet",
    trainerWillAdd: "Your trainer will add a plan soon",
    generateAI: "✦ AI Generate",
    chooseMeal: "🍽️ Choose",
    chooseWorkout: "🏋️ Choose",
    writeManual: "✏️ Write",
    memberSince: "Member since",
    yourTrainer: "Your Trainer",
    bmi: "BMI",
    tdee: "Energy & Macros (TDEE)",
    maintenance: "Maintenance",
    target: "Target",
    activityLevel: "Activity Level",
    gender: "Gender",
    male: "Male",
    female: "Female",
    fullName: "Full Name",
    phone: "WhatsApp",
    passwordAuto: "Password (blank = auto-generate)",
    addShare: "ADD & SHARE →",
    credentialsSent: "Client Added!",
    shareDetails: "Share login details",
    sendWhatsapp: "💬 Send via WhatsApp",
    copyCredentials: "📋 Copy Credentials",
    sharePDF: "📄 Share PDF Guide",
    close: "Close",
    registrationLink: "Registration Link",
    copyLink: "📋 Copy",
    pendingRequests: "Pending Requests",
    noRequests: "No pending requests",
    invalidCredentials: "Invalid credentials. Please try again.",
    accountDisabled: "Your account has been disabled. Contact your trainer.",
    regSubmitted: "Request Submitted!",
    regDesc: "Your request has been sent to",
    regApproval: "You'll receive login details on WhatsApp after approval.",
    joinUs: "JOIN US TODAY",
    submitRequest: "SUBMIT REQUEST →",
    alreadyAccount: "Already have an account?",
    loginHere: "Login here",
    goalsDistribution: "Goals Distribution",
    total: "Total",
    pending: "Pending",
    aiPlans: "AI Plans",
    selectClient: "Select a client",
    howToInstall: "How to Install",
    installTitle: "Install Physical Definition App",
    iosSteps: ["Open Safari browser on your iPhone", "Go to: physical-definition.vercel.app", "Tap the Share button (□↑) at the bottom", "Scroll down and tap 'Add to Home Screen'", "Tap 'Add' — App icon appears on home screen!", "Open the app and login with your credentials"],
    androidSteps: ["Open Chrome browser on your Android", "Go to: physical-definition.vercel.app", "Tap the 3-dot menu (⋮) at the top right", "Tap 'Add to Home screen'", "Tap 'Add' — App icon appears on home screen!", "Open the app and login with your credentials"],
    pdfGreeting: "Welcome to Physical Definition!",
    pdfReady: "Your account is ready. Here are your login details:",
    pdfUrl: "App URL",
    pdfUser: "Email",
    pdfPass: "Password",
    pdfNote: "Keep your password safe. Contact your trainer if you need help.",
    demoAccess: "Demo Access",
    trainer: "Trainer",
    client: "Client",
    shareRegLink: "Share Registration Link",
    shareRegLinkDesc: "Share this link with new clients to register:",
    openPDF: "Open PDF",
  },
  ar: {
    appName: "فيزيكال ديفينيشن",
    tagline: "ابدأ رحلتك نحو اللياقة البدنية",
    login: "تسجيل الدخول",
    email: "البريد الإلكتروني / اسم المستخدم",
    password: "كلمة المرور",
    enter: "دخول ←",
    newMember: "عضو جديد؟ سجّل هنا ←",
    welcome: "أهلاً",
    profile: "الملف الشخصي",
    workout: "تمارين",
    nutrition: "التغذية",
    progress: "التقدم",
    dashboard: "لوحة التحكم",
    clients: "العملاء",
    aiTools: "أدوات الذكاء الاصطناعي",
    plans: "الخطط",
    requests: "الطلبات",
    addClient: "+ إضافة",
    edit: "تعديل",
    save: "حفظ",
    cancel: "إلغاء",
    logout: "تسجيل الخروج",
    age: "العمر",
    weight: "الوزن",
    height: "الطول",
    goal: "الهدف",
    active: "نشط",
    inactive: "غير نشط",
    disabled: "معطّل",
    enable: "تفعيل",
    disable: "تعطيل",
    shareLogin: "مشاركة بيانات الدخول عبر واتساب",
    approve: "موافقة",
    reject: "رفض",
    noPlan: "لا توجد خطة بعد",
    trainerWillAdd: "سيضيف المدرب خطتك قريباً",
    generateAI: "✦ توليد بالذكاء الاصطناعي",
    chooseMeal: "🍽️ اختيار",
    chooseWorkout: "🏋️ اختيار",
    writeManual: "✏️ كتابة",
    memberSince: "عضو منذ",
    yourTrainer: "مدربك",
    bmi: "مؤشر كتلة الجسم",
    tdee: "الطاقة والمغذيات",
    maintenance: "الصيانة",
    target: "الهدف",
    activityLevel: "مستوى النشاط",
    gender: "الجنس",
    male: "ذكر",
    female: "أنثى",
    fullName: "الاسم الكامل",
    phone: "واتساب",
    passwordAuto: "كلمة المرور (فارغ = توليد تلقائي)",
    addShare: "إضافة ومشاركة ←",
    credentialsSent: "تمت إضافة العميل!",
    shareDetails: "شارك بيانات الدخول",
    sendWhatsapp: "💬 إرسال عبر واتساب",
    copyCredentials: "📋 نسخ البيانات",
    sharePDF: "📄 مشاركة دليل PDF",
    close: "إغلاق",
    registrationLink: "رابط التسجيل",
    copyLink: "📋 نسخ",
    pendingRequests: "الطلبات المعلقة",
    noRequests: "لا توجد طلبات معلقة",
    invalidCredentials: "بيانات غير صحيحة. يرجى المحاولة مرة أخرى.",
    accountDisabled: "تم تعطيل حسابك. تواصل مع مدربك.",
    regSubmitted: "تم إرسال الطلب!",
    regDesc: "تم إرسال طلبك إلى",
    regApproval: "ستتلقى بيانات الدخول عبر واتساب بعد الموافقة.",
    joinUs: "انضم إلينا اليوم",
    submitRequest: "إرسال الطلب ←",
    alreadyAccount: "لديك حساب بالفعل؟",
    loginHere: "تسجيل الدخول هنا",
    goalsDistribution: "توزيع الأهداف",
    total: "المجموع",
    pending: "معلق",
    aiPlans: "خطط الذكاء الاصطناعي",
    selectClient: "اختر عميلاً",
    howToInstall: "كيفية التثبيت",
    installTitle: "تثبيت تطبيق فيزيكال ديفينيشن",
    iosSteps: ["افتح متصفح Safari على iPhone", "اذهب إلى: physical-definition.vercel.app", "اضغط زر المشاركة (□↑) في الأسفل", "مرر للأسفل واضغط 'Add to Home Screen'", "اضغط 'Add' — ستظهر أيقونة التطبيق!", "افتح التطبيق وسجّل دخولك ببياناتك"],
    androidSteps: ["افتح متصفح Chrome على Android", "اذهب إلى: physical-definition.vercel.app", "اضغط القائمة (⋮) في أعلى اليمين", "اضغط 'Add to Home screen'", "اضغط 'Add' — ستظهر أيقونة التطبيق!", "افتح التطبيق وسجّل دخولك ببياناتك"],
    pdfGreeting: "مرحباً بك في فيزيكال ديفينيشن!",
    pdfReady: "حسابك جاهز. إليك بيانات الدخول:",
    pdfUrl: "رابط التطبيق",
    pdfUser: "البريد الإلكتروني",
    pdfPass: "كلمة المرور",
    pdfNote: "احتفظ بكلمة مرورك بأمان. تواصل مع مدربك إذا احتجت مساعدة.",
    demoAccess: "بيانات تجريبية",
    trainer: "المدرب",
    client: "العميل",
    shareRegLink: "مشاركة رابط التسجيل",
    shareRegLinkDesc: "شارك هذا الرابط مع العملاء الجدد للتسجيل:",
    openPDF: "فتح PDF",
  }
};

const TRAINER = {
  name: "MUHAMMED RAFI",
  designation: "Certified Personal Trainer",
  designationAr: "مدرب شخصي معتمد",
  whatsapp: "97471000786",
  appUrl: "https://physical-definition.vercel.app",
};

const ADMIN = { u: "admin", p: "pd@rafi2024" };
const GOALS_EN = ["Weight Loss", "Muscle Gain", "Endurance", "Flexibility", "General Fitness"];
const GOALS_AR = ["خسارة الوزن", "بناء العضلات", "التحمل", "المرونة", "اللياقة العامة"];

const PAL = [
  { id: "sedentary", en: "Sedentary", ar: "خامل", desc_en: "No exercise, desk job", desc_ar: "لا تمارين، عمل مكتبي", factor: 1.2, icon: "🪑" },
  { id: "light", en: "Light", ar: "خفيف", desc_en: "Light exercise 1–3 days/week", desc_ar: "تمارين خفيفة 1-3 أيام/أسبوع", factor: 1.375, icon: "🚶" },
  { id: "moderate", en: "Moderate", ar: "معتدل", desc_en: "Moderate exercise 3–5 days/week", desc_ar: "تمارين معتدلة 3-5 أيام/أسبوع", factor: 1.55, icon: "🏃" },
  { id: "active", en: "Active", ar: "نشط", desc_en: "Hard exercise 6–7 days/week", desc_ar: "تمارين شاقة 6-7 أيام/أسبوع", factor: 1.725, icon: "💪" },
  { id: "very_active", en: "Very Active", ar: "نشط جداً", desc_en: "Very hard exercise, physical job", desc_ar: "تمارين قوية جداً، عمل بدني", factor: 1.9, icon: "🔥" },
];

const SK = "pd_v6_clients";
const RK = "pd_v6_regs";
const LK = "pd_v6_lang";
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
  { id: 1, name: "Arjun Menon", email: "arjun@email.com", password: "client123", age: 28, weight: 82, height: 175, gender: "male", goal: "Weight Loss", pal: "moderate", phone: "9876543210", joinDate: "2024-01-15", status: "Active", workoutPlan: null, nutritionPlan: null, progress: [{ date: "2024-01-15", weight: 82 }, { date: "2024-02-15", weight: 79 }, { date: "2024-03-15", weight: 76 }] },
  { id: 2, name: "Priya Nair", email: "priya@email.com", password: "client456", age: 32, weight: 65, height: 162, gender: "female", goal: "Muscle Gain", pal: "light", phone: "9123456780", joinDate: "2024-02-10", status: "Active", workoutPlan: null, nutritionPlan: null, progress: [{ date: "2024-02-10", weight: 65 }, { date: "2024-03-10", weight: 66.5 }, { date: "2024-04-10", weight: 68 }] },
];

const MEALS = [
  { id: "kerala", name: "Kerala Balanced", nameAr: "نظام كيرالا المتوازن", tag: "Indian Traditional", tagAr: "تقليدي هندي", emoji: "🍚", color: "#f59e0b", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=75", baseCal: 1800, meals: [{ time: "7:00", name: "Breakfast", nameAr: "الإفطار", items: "Puttu + Kadala curry + Banana", cal: 380, p: 14, c: 62, f: 8 }, { time: "10:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Coconut water + Nuts", cal: 180, p: 4, c: 22, f: 9 }, { time: "13:00", name: "Lunch", nameAr: "الغداء", items: "Brown rice + Dal + Fish curry + Veg", cal: 520, p: 32, c: 68, f: 12 }, { time: "16:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Banana + Green tea", cal: 120, p: 2, c: 28, f: 0 }, { time: "19:00", name: "Dinner", nameAr: "العشاء", items: "Chapati × 3 + Chicken curry + Salad", cal: 480, p: 38, c: 52, f: 10 }] },
  { id: "protein", name: "High Protein Power", nameAr: "بروتين عالي", tag: "Muscle Focus", tagAr: "تركيز على العضلات", emoji: "💪", color: "#ef4444", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=75", baseCal: 2200, meals: [{ time: "7:00", name: "Breakfast", nameAr: "الإفطار", items: "6 Egg whites + Oats + Milk", cal: 450, p: 42, c: 38, f: 12 }, { time: "10:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Protein shake + Apple", cal: 250, p: 25, c: 30, f: 4 }, { time: "13:00", name: "Lunch", nameAr: "الغداء", items: "Grilled chicken 200g + Brown rice + Veg", cal: 550, p: 48, c: 55, f: 10 }, { time: "16:30", name: "Pre-workout", nameAr: "قبل التمرين", items: "Banana + Peanut butter toast", cal: 320, p: 10, c: 48, f: 10 }, { time: "19:30", name: "Dinner", nameAr: "العشاء", items: "Grilled fish + Sweet potato + Salad", cal: 420, p: 40, c: 42, f: 8 }] },
  { id: "fatburn", name: "Fat Burn Diet", nameAr: "نظام حرق الدهون", tag: "Low Carb · Cut", tagAr: "كارب منخفض", emoji: "🔥", color: "#22c55e", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=75", baseCal: 1500, meals: [{ time: "7:00", name: "Breakfast", nameAr: "الإفطار", items: "Greek yogurt + Berries + Chia", cal: 220, p: 18, c: 22, f: 6 }, { time: "10:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Cucumber + Hummus + Lemon water", cal: 120, p: 5, c: 14, f: 5 }, { time: "13:00", name: "Lunch", nameAr: "الغداء", items: "Grilled chicken salad + Olive oil", cal: 380, p: 35, c: 20, f: 14 }, { time: "16:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Almonds + Black coffee", cal: 170, p: 6, c: 6, f: 14 }, { time: "19:00", name: "Dinner", nameAr: "العشاء", items: "Steamed fish + Vegetables + Dal soup", cal: 380, p: 38, c: 28, f: 8 }] },
  { id: "veg", name: "Vegetarian Power", nameAr: "نظام نباتي", tag: "Plant Based", tagAr: "نباتي", emoji: "🥗", color: "#60a5fa", image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&q=75", baseCal: 1900, meals: [{ time: "7:00", name: "Breakfast", nameAr: "الإفطار", items: "Idli × 4 + Sambar + Chutney", cal: 360, p: 12, c: 68, f: 6 }, { time: "10:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Fruit bowl + Buttermilk", cal: 200, p: 6, c: 38, f: 2 }, { time: "13:00", name: "Lunch", nameAr: "الغداء", items: "Brown rice + Rajma + Paneer + Salad", cal: 560, p: 28, c: 72, f: 14 }, { time: "16:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Roasted chana + Green tea", cal: 180, p: 10, c: 28, f: 4 }, { time: "19:00", name: "Dinner", nameAr: "العشاء", items: "Roti × 3 + Dal makhani + Veg curry", cal: 480, p: 22, c: 72, f: 10 }] },
  { id: "bulk", name: "Muscle Builder", nameAr: "بناء العضلات", tag: "High Cal · Bulk", tagAr: "سعرات عالية", emoji: "🏋️", color: "#9333ea", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=75", baseCal: 2800, meals: [{ time: "7:00", name: "Breakfast", nameAr: "الإفطار", items: "4 Eggs + Oats + Banana + Full fat milk", cal: 620, p: 38, c: 78, f: 16 }, { time: "10:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Mass gainer + Dates", cal: 480, p: 32, c: 72, f: 8 }, { time: "13:00", name: "Lunch", nameAr: "الغداء", items: "White rice + Chicken 250g + Dal + Ghee", cal: 680, p: 52, c: 80, f: 18 }, { time: "16:30", name: "Pre-workout", nameAr: "قبل التمرين", items: "Banana × 2 + Peanut butter + Toast", cal: 420, p: 14, c: 68, f: 12 }, { time: "20:00", name: "Dinner", nameAr: "العشاء", items: "Chapati × 4 + Mutton curry + Milk", cal: 680, p: 48, c: 78, f: 20 }] },
];

const WORKOUTS = [
  { id: "pushup", name: "Push-Up", nameAr: "تمرين الضغط", type: "Bodyweight", typeAr: "وزن الجسم", target: "Chest & Triceps", targetAr: "الصدر والعضلة ثلاثية", emoji: "💪", color: "#ef4444", sets: "4 × 15 reps", rest: "60 sec", steps_en: ["Plank position, hands shoulder-width", "Lower chest to ground slowly", "Push back up explosively", "Keep core tight, don't sag hips"], steps_ar: ["وضعية الضغط، اليدان بعرض الكتفين", "انزل ببطء حتى يلمس الصدر الأرض", "ادفع للأعلى بقوة", "حافظ على شد عضلات الوسط"] },
  { id: "squat", name: "Deep Squat", nameAr: "القرفصاء", type: "Bodyweight / Barbell", typeAr: "وزن الجسم / بار", target: "Legs & Glutes", targetAr: "الأرجل والأرداف", emoji: "🦵", color: "#f59e0b", sets: "4 × 20 reps", rest: "90 sec", steps_en: ["Feet shoulder-width, toes out", "Lower until thighs parallel", "Drive through heels to stand", "Keep chest up, back straight"], steps_ar: ["القدمان بعرض الكتفين", "انزل حتى تتوازى الفخذان", "ادفع من الكعبين للوقوف", "حافظ على استقامة الظهر"] },
  { id: "deadlift", name: "Deadlift", nameAr: "الرفعة الميتة", type: "Gym", typeAr: "صالة رياضية", target: "Back & Hamstrings", targetAr: "الظهر وعضلات الفخذ", emoji: "🏋️", color: "#9333ea", sets: "4 × 12 reps", rest: "2 min", steps_en: ["Stand hip-width, bar over mid-foot", "Hinge at hips, back neutral", "Lower bar along legs", "Drive hips forward to stand"], steps_ar: ["قف والبار فوق منتصف القدم", "انحن من الوركين والظهر مستقيم", "انزل البار بمحاذاة الساقين", "ادفع الوركين للأمام للوقوف"] },
  { id: "pullup", name: "Pull-Up", nameAr: "العقلة", type: "Gym / Bodyweight", typeAr: "صالة / وزن الجسم", target: "Back & Biceps", targetAr: "الظهر والعضلة ثنائية", emoji: "🤸", color: "#22c55e", sets: "4 × 10 reps", rest: "90 sec", steps_en: ["Grip bar wider than shoulders", "Hang with arms extended", "Pull chest toward bar", "Lower slowly with control"], steps_ar: ["امسك البار بعرض أكبر من الكتفين", "تعلق بذراعين ممدودتين", "اسحب الصدر نحو البار", "انزل ببطء مع التحكم"] },
  { id: "plank", name: "Plank Hold", nameAr: "البلانك", type: "Bodyweight", typeAr: "وزن الجسم", target: "Core & Stability", targetAr: "عضلات الجذع والثبات", emoji: "🧘", color: "#60a5fa", sets: "4 × 45 sec", rest: "30 sec", steps_en: ["Forearms flat on ground", "Body in a straight line", "Squeeze glutes and abs", "Breathe steadily"], steps_ar: ["الساعدان مسطحان على الأرض", "الجسم في خط مستقيم", "شد عضلات الأرداف والبطن", "تنفس بانتظام"] },
];

async function callAI(prompt) {
  const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
  if (!res.ok) throw new Error("HTTP_" + res.status);
  const d = await res.json();
  if (d.error) throw new Error(d.error);
  return d.result;
}
const genPwd = () => { const c = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!"; return Array.from({ length: 9 }, () => c[Math.floor(Math.random() * c.length)]).join(""); };

// ── GENERATE PDF HTML ─────────────────────────────────────────────────────────
function generatePDFHtml(data, lang) {
  const t = T[lang];
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const iosList = t.iosSteps.map((s, i) => `<li style="margin-bottom:6px;padding:6px 10px;background:#f8f9fa;border-radius:6px;"><span style="color:#d4af37;font-weight:bold;margin-right:6px;">${i + 1}.</span>${s}</li>`).join("");
  const androidList = t.androidSteps.map((s, i) => `<li style="margin-bottom:6px;padding:6px 10px;background:#f8f9fa;border-radius:6px;"><span style="color:#22c55e;font-weight:bold;margin-right:6px;">${i + 1}.</span>${s}</li>`).join("");

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Physical Definition - Welcome</title>
<style>
  body{font-family:${isAr ? "'Segoe UI',Tahoma,Arial" : "Inter,Arial"},sans-serif;background:#f5f5f5;margin:0;padding:20px;direction:${dir};}
  .container{max-width:600px;margin:0 auto;}
  .header{background:linear-gradient(135deg,#080600,#1a1400);border-radius:16px;padding:30px;text-align:center;margin-bottom:20px;}
  .logo-text{font-size:28px;font-weight:900;color:#d4af37;letter-spacing:2px;}
  .tagline{font-size:14px;color:#7a6a30;margin-top:6px;letter-spacing:2px;}
  .card{background:#fff;border-radius:12px;padding:22px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);}
  .card-title{font-size:16px;font-weight:700;color:#1a1a1a;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #f0e8cc;}
  .cred-row{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#fafafa;border-radius:8px;margin-bottom:8px;}
  .cred-label{font-size:13px;color:#666;}
  .cred-value{font-size:14px;font-weight:700;color:#080600;background:#f0e8cc;padding:4px 12px;border-radius:6px;}
  .step-list{list-style:none;padding:0;margin:0;}
  .section-title{font-size:15px;font-weight:700;color:#1a1a1a;margin:14px 0 8px;display:flex;align-items:center;gap:8px;}
  .phone-icon{font-size:18px;}
  .note{background:#fff8e6;border:1px solid #f0e8cc;border-radius:8px;padding:12px 16px;font-size:13px;color:#7a6a30;margin-top:12px;}
  .footer{text-align:center;font-size:12px;color:#999;margin-top:20px;padding:16px;}
  .highlight{color:#d4af37;font-weight:700;}
  .url-box{background:#080600;color:#d4af37;padding:12px 16px;border-radius:8px;font-size:14px;font-weight:700;text-align:center;margin:10px 0;word-break:break-all;}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo-text">PHYSICAL DEFINITION</div>
    <div class="tagline">${t.tagline.toUpperCase()}</div>
  </div>

  <div class="card">
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:40px;margin-bottom:8px;">🎉</div>
      <div style="font-size:20px;font-weight:700;color:#080600;">${t.pdfGreeting}</div>
      <div style="font-size:14px;color:#666;margin-top:6px;">${t.pdfReady}</div>
    </div>
    <div class="cred-row"><span class="cred-label">👤 ${isAr ? "الاسم" : "Name"}</span><span class="cred-value">${data.name}</span></div>
    <div class="cred-row"><span class="cred-label">📧 ${t.pdfUser}</span><span class="cred-value">${data.email}</span></div>
    <div class="cred-row"><span class="cred-label">🔑 ${t.pdfPass}</span><span class="cred-value">${data.password}</span></div>
    <div class="cred-row"><span class="cred-label">🌐 ${t.pdfUrl}</span><span class="cred-value" style="font-size:11px;">${TRAINER.appUrl}</span></div>
    <div class="url-box">🌐 ${TRAINER.appUrl}</div>
    <div class="note">⚠️ ${t.pdfNote}</div>
  </div>

  <div class="card">
    <div class="card-title">📱 ${t.installTitle}</div>
    
    <div class="section-title"><span class="phone-icon">🍎</span> iPhone (iOS)</div>
    <ol class="step-list">${iosList}</ol>

    <div class="section-title" style="margin-top:16px;"><span class="phone-icon">🤖</span> Android</div>
    <ol class="step-list">${androidList}</ol>
  </div>

  <div class="card" style="text-align:center;">
    <div style="font-size:14px;color:#666;margin-bottom:12px;">${isAr ? "مدربك" : "Your Trainer"}</div>
    <div style="font-size:22px;font-weight:900;color:#d4af37;letter-spacing:1px;">${TRAINER.name}</div>
    <div style="font-size:13px;color:#999;margin-top:4px;">${isAr ? TRAINER.designationAr : TRAINER.designation}</div>
    <div style="margin-top:12px;">
      <a href="https://wa.me/${TRAINER.whatsapp}" style="display:inline-block;background:#25d366;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;">💬 WhatsApp</a>
    </div>
  </div>

  <div class="footer">${isAr ? "© Physical Definition · جميع الحقوق محفوظة" : "© Physical Definition · All Rights Reserved"}</div>
</div>
</body>
</html>`;
}

// ── OPEN PDF IN NEW TAB ───────────────────────────────────────────────────────
function openWelcomePDF(data, lang) {
  const html = generatePDFHtml(data, lang);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

// ── REALISTIC EXERCISE ANIMATIONS ────────────────────────────────────────────
function ExAnim({ id, color, size = 140 }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setFrame(f => (f + 1) % 120), 33);
    return () => clearInterval(i);
  }, []);

  const phase = (frame / 120) * Math.PI * 2;
  const s = Math.sin(phase);
  const ease = (Math.sin(phase - Math.PI / 2) + 1) / 2; // 0→1 smooth

  const skin = color;
  const dark = color + "cc";
  const light = color + "44";
  const muscle = color + "88";

  // Reusable body parts
  const Head = ({ cx, cy, r = 9 }) => (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={skin} />
      <circle cx={cx - 3} cy={cy - 2} r={1.5} fill="#080600" opacity="0.5" />
      <circle cx={cx + 3} cy={cy - 2} r={1.5} fill="#080600" opacity="0.5" />
      <path d={`M ${cx - 3} ${cy + 3} Q ${cx} ${cy + 6} ${cx + 3} ${cy + 3}`} stroke="#080600" strokeWidth="1" fill="none" opacity="0.4" />
    </g>
  );

  const Torso = ({ x1, y1, x2, y2, w = 10 }) => {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len * w, ny = dx / len * w;
    return (
      <g>
        <polygon points={`${x1 + nx},${y1 + ny} ${x1 - nx},${y1 - ny} ${x2 - nx * 0.7},${y2 - ny * 0.7} ${x2 + nx * 0.7},${y2 + ny * 0.7}`} fill={skin} />
        <line x1={(x1 + x2) / 2 + nx * 0.3} y1={(y1 + y2) / 2 + ny * 0.3} x2={(x1 + x2) / 2 - nx * 0.3} y2={(y1 + y2) / 2 - ny * 0.3} stroke={muscle} strokeWidth="1.5" opacity="0.6" />
      </g>
    );
  };

  const Limb = ({ x1, y1, x2, y2, w = 6, joint = false }) => {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len * w, ny = dx / len * w;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return (
      <g>
        <polygon points={`${x1 + nx},${y1 + ny} ${x1 - nx},${y1 - ny} ${x2 - nx * 0.5},${y2 - ny * 0.5} ${x2 + nx * 0.5},${y2 + ny * 0.5}`} fill={skin} />
        <ellipse cx={mx} cy={my} rx={w * 0.5} ry={len * 0.18} transform={`rotate(${Math.atan2(dy, dx) * 180 / Math.PI} ${mx} ${my})`} fill={muscle} opacity="0.5" />
        {joint && <circle cx={x2} cy={y2} r={w * 0.55} fill={dark} opacity="0.7" />}
      </g>
    );
  };

  const Floor = ({ y, x1 = 10, x2 = 150 }) => (
    <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth="2" opacity="0.15" strokeDasharray="4,4" />
  );

  const anims = {
    pushup: () => {
      const lift = ease * 16;
      const bY = 68 - lift;
      const elbowAngle = ease * 35;
      // Body horizontal
      const bodyTilt = ease * 5;
      return (
        <svg viewBox="0 0 160 100" width={size} height={size * 0.625}>
          <Floor y={82} />
          {/* shadow */}
          <ellipse cx="80" cy="83" rx={30 + lift} ry="3" fill={color} opacity={0.08 + ease * 0.05} />
          {/* feet */}
          <rect x="112" y="76" width="12" height="6" rx="3" fill={dark} opacity="0.8" />
          {/* legs */}
          <Limb x1={80} y1={bY + 14} x2={112} y2={78} w={7} />
          {/* torso */}
          <Torso x1={44} y1={bY + 4} x2={80} y2={bY + 14} w={9} />
          {/* upper arms */}
          <Limb x1={52} y1={bY + 4} x2={44 - elbowAngle * 0.3} y2={bY + 16 + elbowAngle * 0.4} w={5} joint />
          <Limb x1={52} y1={bY + 4} x2={60 + elbowAngle * 0.3} y2={bY + 16 + elbowAngle * 0.4} w={5} joint />
          {/* forearms */}
          <Limb x1={44 - elbowAngle * 0.3} y1={bY + 16 + elbowAngle * 0.4} x2={36} y2={78} w={4} />
          <Limb x1={60 + elbowAngle * 0.3} y1={bY + 16 + elbowAngle * 0.4} x2={68} y2={78} w={4} />
          {/* hands */}
          <circle cx="36" cy="78" r="4" fill={dark} opacity="0.8" />
          <circle cx="68" cy="78" r="4" fill={dark} opacity="0.8" />
          {/* head */}
          <Head cx={36} cy={bY - 6} r={9} />
          {/* muscle highlight on chest */}
          <ellipse cx="55" cy={bY + 8} rx="7" ry="4" fill={color} opacity={0.15 + ease * 0.2} transform={`rotate(-10 55 ${bY + 8})`} />
        </svg>
      );
    },

    squat: () => {
      const dip = ease * 22;
      const kneeOut = ease * 8;
      const hipY = 35 + dip;
      const kneeY = 62 + dip * 0.4;
      return (
        <svg viewBox="0 0 120 120" width={size} height={size}>
          <Floor y={108} x1={20} x2={100} />
          <ellipse cx="60" cy="109" rx={18 + dip * 0.3} ry="3" fill={color} opacity={0.1 + ease * 0.05} />
          {/* feet */}
          <rect x="38" y="102" width="12" height="6" rx="3" fill={dark} opacity="0.8" />
          <rect x="70" y="102" width="12" height="6" rx="3" fill={dark} opacity="0.8" />
          {/* shins */}
          <Limb x1={44} y1={kneeY} x2={44} y2={104} w={5} />
          <Limb x1={76} y1={kneeY} x2={76} y2={104} w={5} />
          {/* thighs */}
          <Limb x1={56} y1={hipY + 10} x2={44 - kneeOut} y2={kneeY} w={7} joint />
          <Limb x1={64} y1={hipY + 10} x2={76 + kneeOut} y2={kneeY} w={7} joint />
          {/* torso */}
          <Torso x1={60} y1={hipY - 14} x2={60} y2={hipY + 10} w={10} />
          {/* arms out for balance */}
          <Limb x1={54} y1={hipY - 6} x2={38} y2={hipY + 4 - dip * 0.3} w={4} />
          <Limb x1={66} y1={hipY - 6} x2={82} y2={hipY + 4 - dip * 0.3} w={4} />
          {/* head */}
          <Head cx={60} cy={hipY - 24} r={9} />
          {/* quad muscle highlight */}
          <ellipse cx={46} cy={kneeY - 10} rx="4" ry="8" fill={color} opacity={0.12 + ease * 0.18} transform={`rotate(-15 46 ${kneeY - 10})`} />
          <ellipse cx={74} cy={kneeY - 10} rx="4" ry="8" fill={color} opacity={0.12 + ease * 0.18} transform={`rotate(15 74 ${kneeY - 10})`} />
        </svg>
      );
    },

    deadlift: () => {
      const liftH = ease * 26;
      const hipAngle = (1 - ease) * 28;
      const hipY = 72 - liftH * 0.5;
      const barY = 88 - liftH;
      const shoulderY = hipY - 24 - hipAngle * 0.3;
      const shoulderX = 60 - hipAngle * 0.4;
      return (
        <svg viewBox="0 0 160 110" width={size} height={size * 0.6875}>
          <Floor y={96} />
          {/* barbell */}
          <rect x="28" y={barY - 4} width="104" height="8" rx="4" fill={dark} opacity="0.85" />
          <rect x="26" y={barY - 10} width="12" height="20" rx="6" fill={dark} opacity="0.7" />
          <rect x="122" y={barY - 10} width="12" height="20" rx="6" fill={dark} opacity="0.7" />
          <rect x="18" y={barY - 14} width="14" height="28" rx="7" fill={dark} opacity="0.5" />
          <rect x="128" y={barY - 14} width="14" height="28" rx="7" fill={dark} opacity="0.5" />
          {/* shadow */}
          <ellipse cx="80" cy="97" rx="22" ry="3" fill={color} opacity="0.08" />
          {/* feet */}
          <rect x="52" y="90" width="12" height="6" rx="3" fill={dark} opacity="0.8" />
          <rect x="76" y="90" width="12" height="6" rx="3" fill={dark} opacity="0.8" />
          {/* legs */}
          <Limb x1={58} y1={hipY + 4} x2={58} y2={92} w={7} />
          <Limb x1={82} y1={hipY + 4} x2={82} y2={92} w={7} />
          {/* torso tilted */}
          <Torso x1={shoulderX} y1={shoulderY} x2={70} y2={hipY + 4} w={10} />
          {/* arms to bar */}
          <Limb x1={shoulderX - 2} y1={shoulderY + 6} x2={52} y2={barY + 2} w={5} joint />
          <Limb x1={shoulderX + 10} y1={shoulderY + 6} x2={88} y2={barY + 2} w={5} joint />
          {/* hands */}
          <circle cx="52" cy={barY + 2} r="5" fill={dark} opacity="0.8" />
          <circle cx="88" cy={barY + 2} r="5" fill={dark} opacity="0.8" />
          {/* head */}
          <Head cx={shoulderX - 4} cy={shoulderY - 10} r={9} />
          {/* back muscle */}
          <ellipse cx={shoulderX + 4} cy={shoulderY + 14} rx="5" ry="10" fill={color} opacity={0.1 + ease * 0.2} transform={`rotate(${-hipAngle * 0.5} ${shoulderX + 4} ${shoulderY + 14})`} />
        </svg>
      );
    },

    pullup: () => {
      const pullH = ease * 20;
      const bodyY = 32 + pullH;
      const elbowFlare = ease * 18;
      return (
        <svg viewBox="0 0 120 130" width={size} height={size * 1.08}>
          {/* pull-up bar */}
          <rect x="10" y="10" width="100" height="10" rx="5" fill={dark} opacity="0.8" />
          <rect x="16" y="10" width="8" height="24" rx="4" fill={dark} opacity="0.5" />
          <rect x="96" y="10" width="8" height="24" rx="4" fill={dark} opacity="0.5" />
          {/* shadow on floor */}
          <ellipse cx="60" cy="128" rx="18" ry="3" fill={color} opacity="0.06" />
          {/* hands */}
          <circle cx="32" cy="24" r="5" fill={dark} opacity="0.8" />
          <circle cx="88" cy="24" r="5" fill={dark} opacity="0.8" />
          {/* forearms */}
          <Limb x1={32} y1={24} x2={42 - elbowFlare} y2={bodyY - 18 + 8} w={4} />
          <Limb x1={88} y1={24} x2={78 + elbowFlare} y2={bodyY - 18 + 8} w={4} />
          {/* upper arms */}
          <Limb x1={42 - elbowFlare} y1={bodyY - 18 + 8} x2={50} y2={bodyY - 14} w={6} joint />
          <Limb x1={78 + elbowFlare} y1={bodyY - 18 + 8} x2={70} y2={bodyY - 14} w={6} joint />
          {/* torso */}
          <Torso x1={60} y1={bodyY - 14} x2={60} y2={bodyY + 12} w={10} />
          {/* legs slightly bent */}
          <Limb x1={56} y1={bodyY + 12} x2={52} y2={bodyY + 38} w={7} joint />
          <Limb x1={64} y1={bodyY + 12} x2={68} y2={bodyY + 38} w={7} joint />
          <Limb x1={52} y1={bodyY + 38} x2={54} y2={bodyY + 56} w={5} />
          <Limb x1={68} y1={bodyY + 38} x2={66} y2={bodyY + 56} w={5} />
          {/* head */}
          <Head cx={60} cy={bodyY - 24} r={9} />
          {/* bicep highlight */}
          <ellipse cx={43 - elbowFlare * 0.5} cy={bodyY - 10} rx="3.5" ry="6" fill={color} opacity={0.1 + ease * 0.25} />
          <ellipse cx={77 + elbowFlare * 0.5} cy={bodyY - 10} rx="3.5" ry="6" fill={color} opacity={0.1 + ease * 0.25} />
        </svg>
      );
    },

    plank: () => {
      const breathe = s * 1.2;
      const glowPulse = (Math.sin(phase * 2) + 1) / 2;
      return (
        <svg viewBox="0 0 180 90" width={size} height={size * 0.5}>
          <Floor y={78} x1={10} x2={170} />
          {/* shadow */}
          <ellipse cx="95" cy="79" rx="70" ry="4" fill={color} opacity="0.07" />
          {/* feet / toes */}
          <rect x="138" y="70" width="14" height="8" rx="4" fill={dark} opacity="0.8" />
          {/* legs */}
          <Limb x1={82} y1={55 + breathe} x2={138} y2={74} w={9} />
          {/* torso */}
          <Torso x1={42} y1={48 + breathe * 0.6} x2={82} y2={55 + breathe} w={11} />
          {/* core highlight pulses */}
          <ellipse cx="62" cy={51 + breathe * 0.7} rx="10" ry="5" fill={color} opacity={0.06 + glowPulse * 0.12} transform={`rotate(-8 62 ${51 + breathe * 0.7})`} />
          {/* upper arms */}
          <Limb x1={50} y1={48 + breathe * 0.6} x2={36} y2={62} w={6} joint />
          <Limb x1={50} y1={48 + breathe * 0.6} x2={62} y2={60} w={6} joint />
          {/* forearms */}
          <Limb x1={36} y1={62} x2={28} y2={74} w={5} />
          <Limb x1={62} y1={60} x2={70} y2={74} w={5} />
          {/* elbows on ground */}
          <circle cx="28" cy="74" r="5" fill={dark} opacity="0.75" />
          <circle cx="70" cy="74" r="5" fill={dark} opacity="0.75" />
          {/* head */}
          <Head cx={30} cy={40 + breathe * 0.4} r={9} />
          {/* glute highlight */}
          <ellipse cx="84" cy={54 + breathe * 0.9} rx="7" ry="5" fill={color} opacity={0.08 + glowPulse * 0.1} />
        </svg>
      );
    },
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", filter: `drop-shadow(0 4px 12px ${color}40)` }}>
      {(anims[id] || anims.pushup)()}
    </div>
  );
}

// ── THEME ─────────────────────────────────────────────────────────────────────
const G = { bg: "#080600", surf: "#110e00", surf2: "#1c1500", border: "rgba(212,175,55,0.14)", borderHi: "rgba(212,175,55,0.4)", gold: "#d4af37", grad: "linear-gradient(135deg,#d4af37,#f5d76e,#b8860b)", text: "#f0e8cc", muted: "#7a6a30", dim: "#3a2d10", green: "#22c55e", red: "#ef4444", amber: "#f59e0b", blue: "#60a5fa" };
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html{font-size:16px;-webkit-text-size-adjust:100%;text-size-adjust:100%;}
html,body{background:#080600;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;max-width:100vw;}
input,select,button,textarea{font-family:'Inter',sans-serif;}
.sf{font-family:'Cormorant Garamond',serif;}
.gd{background:linear-gradient(90deg,#f5d76e,#d4af37);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.btn{cursor:pointer;border:none;transition:all .15s;outline:none;-webkit-tap-highlight-color:transparent;}
.btn:active{opacity:.75;transform:scale(.97);}
.inp{background:#1c1500;border:1px solid rgba(212,175,55,0.15);border-radius:10px;padding:12px 14px;color:#f0e8cc;font-size:14px;width:100%;outline:none;}
.inp:focus{border-color:rgba(212,175,55,0.5);}
.inp::placeholder{color:#3a2d10;}
.card{background:#110e00;border:1px solid rgba(212,175,55,0.14);border-radius:14px;}
.fd{animation:fi .25s ease;}
@keyframes fi{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
.sp{width:34px;height:34px;border:3px solid #1c1500;border-top:3px solid #d4af37;border-radius:50%;animation:spin .7s linear infinite;}
.rtl{direction:rtl;text-align:right;}
.ltr{direction:ltr;text-align:left;}
`;

const Logo = ({ s = 32 }) => (<svg width={s} height={s} viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="url(#lg)" /><defs><linearGradient id="lg" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stopColor="#d4af37" /><stop offset="50%" stopColor="#f5d76e" /><stop offset="100%" stopColor="#b8860b" /></linearGradient></defs><text x="6" y="33" fontFamily="Georgia,serif" fontSize="22" fontWeight="900" fill="#080600" letterSpacing="-1">PD</text><rect x="6" y="37" width="36" height="2.5" rx="1.25" fill="#080600" opacity="0.5" /></svg>);
const Av = ({ name = "?", sz = 38 }) => (<div style={{ width: sz, height: sz, borderRadius: 10, background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz * 0.33, fontWeight: 800, color: "#080600", flexShrink: 0 }}>{(name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</div>);
const VV = { gold: { background: G.grad, color: "#080600", fontWeight: 700, borderRadius: 10 }, ghost: { background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: G.gold, borderRadius: 8 }, danger: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", borderRadius: 8 }, green: { background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: G.green, borderRadius: 8 }, amber: { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: G.amber, borderRadius: 8 }, blue: { background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", color: G.blue, borderRadius: 8 } };
const Btn = ({ ch, v = "gold", onClick, full, sx = {} }) => (<button className="btn" onClick={onClick} style={{ padding: "9px 14px", fontSize: 13, fontWeight: 600, width: full ? "100%" : undefined, ...VV[v], ...sx }}>{ch}</button>);
const Ovl = ({ show, close, ch, mw = 520 }) => { if (!show) return null; return (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: 16, overflowY: "auto" }} onClick={close}><div className="card" style={{ width: "100%", maxWidth: mw, padding: 22, border: `1px solid ${G.borderHi}`, marginTop: 20, marginBottom: 20 }} onClick={e => e.stopPropagation()}>{ch}</div></div>); };

// Language Toggle Button
const LangBtn = ({ lang, setLang }) => (
  <button className="btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}
    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 20, color: G.gold, fontSize: 13, fontWeight: 700 }}>
    <span style={{ fontSize: 16 }}>{lang === "en" ? "🇸🇦" : "🇬🇧"}</span>
    <span>{lang === "en" ? "العربية" : "English"}</span>
  </button>
);

// FF
const FF = ({ label, value, onChange, type = "text", ph, opts, dir = "ltr" }) => (
  <div>
    <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
    {opts ? <select className="inp" value={value} onChange={e => onChange(e.target.value)} style={{ direction: dir }}>{opts.map(o => <option key={typeof o === "object" ? o.id : o} value={typeof o === "object" ? o.id : o} style={{ background: G.surf2 }}>{typeof o === "object" ? o.label : o}</option>)}</select>
      : <input className="inp" type={type} placeholder={ph} value={value} onChange={e => onChange(e.target.value)} style={{ direction: dir }} />}
  </div>
);

// TDEE Card
function TDEECard({ client, t, lang }) {
  const pal = PAL.find(p => p.id === (client.pal || "moderate")) || PAL[2];
  const tdee = calcTDEE(client.weight, client.height, client.age, client.gender || "male", pal.factor);
  const target = goalCal(tdee, client.goal);
  const surplus = target - tdee;
  const protein = Math.round(client.weight * 2.0);
  const fat = Math.round((target * 0.25) / 9);
  const carbs = Math.round((target - protein * 4 - fat * 9) / 4);
  const isAr = lang === "ar";
  return (
    <div className="card" style={{ padding: 16, marginBottom: 12, border: `1px solid ${G.borderHi}` }}>
      <div style={{ fontSize: 11, color: G.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12, direction: isAr ? "rtl" : "ltr" }}>{t.tdee}</div>
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
      <div style={{ fontSize: 11, color: G.muted }}>{pal.icon} {isAr ? pal.ar : pal.en} — {isAr ? pal.desc_ar : pal.desc_en}</div>
    </div>
  );
}

// Meal Selector
function MealSel({ client, onSelect, onClose, lang }) {
  const [sel, setSel] = useState(null);
  const t = T[lang]; const isAr = lang === "ar";
  const pal = PAL.find(p => p.id === (client?.pal || "moderate")) || PAL[2];
  const tdee = client ? calcTDEE(client.weight, client.height, client.age, client.gender || "male", pal.factor) : 2000;
  const target = client ? goalCal(tdee, client.goal) : 2000;
  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div className="sf gd" style={{ fontSize: 20, fontWeight: 700 }}>{t.chooseMeal} {isAr ? "خطة الوجبات" : "Meal Plan"}</div>
        <button className="btn" onClick={onClose} style={{ background: "none", color: G.muted, fontSize: 20 }}>✕</button>
      </div>
      {client && <div style={{ fontSize: 12, color: G.muted, marginBottom: 14, background: G.surf2, borderRadius: 8, padding: "7px 12px" }}>{isAr ? "الهدف لـ" : "Target for"} {client.name}: <strong style={{ color: G.gold }}>{target} kcal</strong></div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {MEALS.map(p => (
          <div key={p.id} className="card btn" onClick={() => setSel(sel === p.id ? null : p.id)}
            style={{ overflow: "hidden", border: sel === p.id ? `2px solid ${p.color}` : `1px solid ${G.border}`, transition: "all .2s" }}>
            <div style={{ position: "relative" }}>
              <img src={p.image} alt={p.name} style={{ width: "100%", height: 76, objectFit: "cover" }} />
              {sel === p.id && <div style={{ position: "absolute", top: 5, right: 5, background: p.color, borderRadius: 20, padding: "2px 7px", fontSize: 10, fontWeight: 700, color: "#080600" }}>✓</div>}
            </div>
            <div style={{ padding: "9px 10px 11px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{p.emoji} {isAr ? p.nameAr : p.name}</div>
              <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{isAr ? p.tagAr : p.tag}</div>
              <div style={{ fontSize: 10, color: p.color, marginTop: 3, fontWeight: 700 }}>{p.baseCal} kcal</div>
            </div>
          </div>
        ))}
      </div>
      {sel && (() => {
        const plan = MEALS.find(p => p.id === sel);
        const tot = plan.meals.reduce((a, m) => ({ cal: a.cal + m.cal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f }), { cal: 0, p: 0, c: 0, f: 0 });
        return (
          <div>
            <div style={{ background: `${plan.color}12`, border: `1px solid ${plan.color}30`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <img src={plan.image} alt={plan.name} style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover" }} />
                <div><div style={{ fontSize: 14, fontWeight: 700, color: plan.color }}>{plan.emoji} {isAr ? plan.nameAr : plan.name}</div><div style={{ fontSize: 11, color: G.muted }}>{isAr ? plan.tagAr : plan.tag}</div></div>
              </div>
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
                  <div style={{ width: 58, flexShrink: 0 }}>
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
            <Btn ch={`✓ ${isAr ? "إضافة الخطة" : "Add This Plan"}`} v="gold" full onClick={() => onSelect(plan, tot, target)} sx={{ padding: "12px", fontSize: 14, fontWeight: 700 }} />
          </div>
        );
      })()}
    </div>
  );
}

// Workout Selector
function WOSel({ onSelect, onClose, lang }) {
  const [sel, setSel] = useState([]); const [prev, setPrev] = useState(null);
  const t = T[lang]; const isAr = lang === "ar";
  const toggle = id => setSel(p => p.includes(id) ? p.filter(x => x !== id) : p.length < 5 ? [...p, id] : p);
  const build = () => {
    const chosen = WORKOUTS.filter(w => sel.includes(w.id));
    const text = (isAr ? "⚡ خطة التمارين\n" : "⚡ WORKOUT PLAN\n") + "─".repeat(28) + "\n\n" +
      chosen.map((w, i) => `${i + 1}. ${w.emoji} ${isAr ? w.nameAr : w.name} (${isAr ? w.typeAr : w.type})\n   ${isAr ? "الهدف" : "Target"}: ${isAr ? w.targetAr : w.target}\n   ${w.sets} · Rest ${w.rest}\n   ${isAr ? "الخطوات" : "Steps"}:\n${(isAr ? w.steps_ar : w.steps_en).map((s, j) => `   ${j + 1}. ${s}`).join("\n")}`).join("\n\n─────────────\n\n");
    onSelect(text);
  };
  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div className="sf gd" style={{ fontSize: 20, fontWeight: 700 }}>{t.chooseWorkout} {isAr ? "التمارين" : "Exercises"}</div>
        <button className="btn" onClick={onClose} style={{ background: "none", color: G.muted, fontSize: 20 }}>✕</button>
      </div>
      <div style={{ fontSize: 12, color: G.muted, marginBottom: 12 }}>{isAr ? "اختر حتى 5 تمارين" : "Select up to 5 exercises"}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {WORKOUTS.map(w => {
          const isSel = sel.includes(w.id); const isPrev = prev === w.id;
          return (
            <div key={w.id} className="card" style={{ border: isSel ? `2px solid ${w.color}` : `1px solid ${G.border}`, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", cursor: "pointer" }} onClick={() => toggle(w.id)}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${w.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{w.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isSel ? w.color : G.text }}>{isAr ? w.nameAr : w.name}</div>
                  <div style={{ fontSize: 11, color: G.muted }}>{isAr ? w.typeAr : w.type} · {isAr ? w.targetAr : w.target}</div>
                  <div style={{ fontSize: 10, color: G.dim, marginTop: 1 }}>{w.sets} · {w.rest}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: isSel ? w.color : G.surf2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: isSel ? "#080600" : G.dim, fontWeight: 800 }}>{isSel ? "✓" : ""}</div>
                  <button className="btn" onClick={e => { e.stopPropagation(); setPrev(isPrev ? null : w.id); }} style={{ fontSize: 9, padding: "2px 6px", ...VV.ghost, borderRadius: 5 }}>{isPrev ? (isAr ? "إخفاء" : "Hide") : (isAr ? "معاينة" : "Anim")}</button>
                </div>
              </div>
              {isPrev && (
                <div style={{ borderTop: `1px solid ${G.border}`, padding: "12px", background: `${w.color}08` }}>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flexShrink: 0, width: 110 }}><ExAnim id={w.id} color={w.color} size={110} /></div>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      {(isAr ? w.steps_ar : w.steps_en).map((s, i) => (
                        <div key={i} style={{ fontSize: 11, color: G.muted, marginBottom: 4, display: "flex", gap: 6 }}>
                          <span style={{ color: w.color, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>{s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {sel.length > 0 && <Btn ch={`✓ ${isAr ? `إضافة ${sel.length} تمارين` : `Add ${sel.length} Exercise${sel.length > 1 ? "s" : ""}`}`} v="gold" full onClick={build} sx={{ padding: "12px", fontSize: 14, fontWeight: 700 }} />}
    </div>
  );
}

// Plans Tab
function PlansTab({ clients, selC, setSelC, setClients, genAI, lang }) {
  const [editing, setEditing] = useState(null); const [draft, setDraft] = useState(""); const [showMeal, setShowMeal] = useState(false); const [showWO, setShowWO] = useState(false);
  const t = T[lang]; const isAr = lang === "ar";
  const sc = clients.find(c => c.id === selC?.id);
  const startEdit = (c, type) => { setEditing({ id: c.id, type }); setDraft(c[type === "workout" ? "workoutPlan" : "nutritionPlan"] || ""); };
  const saveEdit = () => { if (!editing) return; const key = editing.type === "workout" ? "workoutPlan" : "nutritionPlan"; setClients(p => p.map(c => c.id === editing.id ? { ...c, [key]: draft } : c)); setSelC(p => p?.id === editing.id ? { ...p, [key]: draft } : p); setEditing(null); setDraft(""); };
  const clearPlan = (c, type) => setClients(p => p.map(x => x.id === c.id ? { ...x, [type === "workout" ? "workoutPlan" : "nutritionPlan"]: null } : x));
  const applyMeal = (plan, tot, target) => { if (!sc) return; const text = `🥗 ${plan.emoji} ${isAr ? plan.nameAr : plan.name}\n${"─".repeat(28)}\n${isAr ? "الهدف اليومي" : "Daily Target"}: ${target} kcal | ${isAr ? "الإجمالي" : "Total"}: ${tot.cal} kcal\n${isAr ? "البروتين" : "Protein"}: ${tot.p}g ${isAr ? "الكارب" : "Carbs"}: ${tot.c}g ${isAr ? "الدهون" : "Fat"}: ${tot.f}g\n\n` + plan.meals.map(m => `🕐 ${m.time} — ${isAr ? m.nameAr : m.name}\n   ${m.items}\n   ${m.cal} kcal | P:${m.p}g C:${m.c}g F:${m.f}g`).join("\n\n"); setClients(p => p.map(c => c.id === sc.id ? { ...c, nutritionPlan: text } : c)); setShowMeal(false); };
  const applyWO = (text) => { if (!sc) return; setClients(p => p.map(c => c.id === sc.id ? { ...c, workoutPlan: text } : c)); setShowWO(false); };
  return (
    <div className="fd" dir={isAr ? "rtl" : "ltr"}>
      <div style={{ marginBottom: 12 }}><div className="sf gd" style={{ fontSize: 22, fontWeight: 700 }}>{t.plans}</div></div>
      <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
        {clients.map(c => <Btn key={c.id} ch={c.name.split(" ")[0]} v={selC?.id === c.id ? "gold" : "ghost"} onClick={() => { setSelC(clients.find(x => x.id === c.id)); setEditing(null); }} sx={{ padding: "7px 13px", fontSize: 12 }} />)}
      </div>
      {!sc ? <div className="card" style={{ padding: "36px 20px", textAlign: "center", color: G.dim }}><div style={{ fontSize: 26, marginBottom: 8 }}>◈</div><div>{t.selectClient}</div></div> : (
        <div>
          <div className="card" style={{ padding: "11px 13px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, border: `1px solid ${G.borderHi}` }}>
            <Av name={sc.name} sz={36} /><div><div style={{ fontSize: 13, fontWeight: 700 }}>{sc.name}</div><div style={{ fontSize: 11, color: G.muted }}>{sc.goal} · {sc.weight}kg · {sc.age}y</div></div>
          </div>
          <TDEECard client={sc} t={t} lang={lang} />
          {[{ key: "workoutPlan", label: "⚡ " + (isAr ? "خطة التمارين" : "Workout Plan"), type: "workout", c: G.gold }, { key: "nutritionPlan", label: "🥗 " + (isAr ? "خطة التغذية" : "Nutrition Plan"), type: "nutrition", c: G.green }].map(plan => {
            const isEditing = editing?.id === sc.id && editing?.type === plan.type; const has = !!sc[plan.key];
            return (
              <div key={plan.key} className="card" style={{ padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: plan.c }}>{plan.label}</div>
                  {!isEditing ? <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <Btn ch={plan.type === "workout" ? t.chooseWorkout : t.chooseMeal} v="ghost" onClick={() => plan.type === "workout" ? setShowWO(true) : setShowMeal(true)} sx={{ padding: "5px 9px", fontSize: 10 }} />
                    <Btn ch={t.writeManual} v="ghost" onClick={() => startEdit(sc, plan.type)} sx={{ padding: "5px 9px", fontSize: 10 }} />
                    <Btn ch={t.generateAI} v={plan.type === "workout" ? "ghost" : "green"} onClick={() => genAI(sc, plan.type)} sx={{ padding: "5px 9px", fontSize: 10 }} />
                    {has && <Btn ch="🗑️" v="danger" onClick={() => clearPlan(sc, plan.type)} sx={{ padding: "5px 9px", fontSize: 10 }} />}
                  </div> : <div style={{ display: "flex", gap: 5 }}>
                    <Btn ch={`✓ ${t.save}`} v="gold" onClick={saveEdit} sx={{ padding: "5px 12px", fontSize: 11 }} />
                    <Btn ch="✕" v="danger" onClick={() => { setEditing(null); setDraft(""); }} sx={{ padding: "5px 9px", fontSize: 11 }} />
                  </div>}
                </div>
                {isEditing ? <div><textarea value={draft} onChange={e => setDraft(e.target.value)} style={{ width: "100%", minHeight: 220, background: G.surf2, border: `1px solid ${G.borderHi}`, borderRadius: 10, padding: 12, color: G.text, fontSize: 13, lineHeight: 1.8, resize: "vertical", outline: "none", fontFamily: "Inter,sans-serif", direction: isAr ? "rtl" : "ltr" }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 9 }}><Btn ch={t.cancel} v="danger" onClick={() => { setEditing(null); setDraft(""); }} sx={{ padding: "8px 14px" }} /><Btn ch={`✓ ${t.save}`} v="gold" onClick={saveEdit} sx={{ padding: "8px 20px", fontWeight: 700 }} /></div>
                </div> : has ? <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.9, color: G.text, direction: isAr ? "rtl" : "ltr" }}>{sc[plan.key]}</pre> : (
                  <div style={{ textAlign: "center", padding: "22px 0", color: G.dim }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{plan.type === "workout" ? "⚡" : "🥗"}</div>
                    <div style={{ fontSize: 12, marginBottom: 10 }}>{t.noPlan}</div>
                    <div style={{ display: "flex", gap: 7, justifyContent: "center", flexWrap: "wrap" }}>
                      <Btn ch={plan.type === "workout" ? t.chooseWorkout : t.chooseMeal} v="ghost" onClick={() => plan.type === "workout" ? setShowWO(true) : setShowMeal(true)} sx={{ padding: "7px 12px", fontSize: 11 }} />
                      <Btn ch={t.generateAI} v={plan.type === "workout" ? "ghost" : "green"} onClick={() => genAI(sc, plan.type)} sx={{ padding: "7px 12px", fontSize: 11 }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <Ovl show={showMeal} close={() => setShowMeal(false)} mw={580} ch={<MealSel client={sc} onSelect={applyMeal} onClose={() => setShowMeal(false)} lang={lang} />} />
      <Ovl show={showWO} close={() => setShowWO(false)} mw={580} ch={<WOSel onSelect={applyWO} onClose={() => setShowWO(false)} lang={lang} />} />
    </div>
  );
}

// Register Page
function RegPage({ onSubmit, lang, setLang }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", age: "", weight: "", height: "", gender: "male", goal: "Weight Loss", pal: "moderate" });
  const [done, setDone] = useState(false);
  const t = T[lang]; const isAr = lang === "ar";
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const submit = () => { if (!f.name || !f.email || !f.phone) return; onSubmit(f); setDone(true); };
  const goals = isAr ? GOALS_AR : GOALS_EN;
  if (done) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{CSS}</style>
      <div className="card" style={{ maxWidth: 400, width: "100%", padding: "36px 22px", textAlign: "center", border: `1px solid ${G.borderHi}` }} dir={isAr ? "rtl" : "ltr"}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div className="sf gd" style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{t.regSubmitted}</div>
        <div style={{ fontSize: 14, color: G.muted, lineHeight: 1.8 }}>{t.regDesc} <strong style={{ color: G.gold }}>{TRAINER.name}</strong>.<br />{t.regApproval}</div>
      </div>
    </div>
  );
  return (
    <div style={{ minHeight: "100vh", background: G.bg, padding: 20 }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><LangBtn lang={lang} setLang={setLang} /></div>
        <div style={{ textAlign: "center", padding: "16px 0 18px" }} dir={isAr ? "rtl" : "ltr"}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Logo s={44} /></div>
          <div className="sf gd" style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>{t.appName}</div>
          <div style={{ fontSize: 11, color: G.muted, letterSpacing: 2, marginTop: 5 }}>{t.joinUs}</div>
        </div>
        <div className="card" style={{ padding: 20, border: `1px solid ${G.borderHi}` }} dir={isAr ? "rtl" : "ltr"}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            <div style={{ gridColumn: "1/-1" }}><FF label={`${t.fullName} *`} value={f.name} onChange={v => set("name", v)} ph="Name" dir={isAr ? "rtl" : "ltr"} /></div>
            <div style={{ gridColumn: "1/-1" }}><FF label="Email *" value={f.email} onChange={v => set("email", v)} ph="email@example.com" /></div>
            <div style={{ gridColumn: "1/-1" }}><FF label={`${t.phone} *`} value={f.phone} onChange={v => set("phone", v)} ph="+974 00000000" /></div>
            <FF label={t.age} value={f.age} onChange={v => set("age", v)} ph="25" />
            <FF label={`${t.weight} (kg)`} value={f.weight} onChange={v => set("weight", v)} ph="70" />
            <FF label={`${t.height} (cm)`} value={f.height} onChange={v => set("height", v)} ph="170" />
            <FF label={t.gender} value={f.gender} onChange={v => set("gender", v)} opts={[{ id: "male", label: t.male }, { id: "female", label: t.female }]} />
            <FF label={t.goal} value={f.goal} onChange={v => set("goal", v)} opts={goals} />
            <div style={{ gridColumn: "1/-1" }}><FF label={t.activityLevel} value={f.pal} onChange={v => set("pal", v)} opts={PAL.map(p => ({ id: p.id, label: `${p.icon} ${isAr ? p.ar : p.en}` }))} /></div>
          </div>
          <Btn ch={t.submitRequest} v="gold" full onClick={submit} sx={{ padding: "12px", fontSize: 14, marginTop: 16 }} />
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: G.dim }} dir={isAr ? "rtl" : "ltr"}>
          {t.alreadyAccount} <a href="/" style={{ color: G.gold }}>{t.loginHere}</a>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState(() => ld(LK, "en"));
  const [clients, setClients] = useState(() => ld(SK, DEMO));
  const [regs, setRegs] = useState(() => ld(RK, []));
  const [screen, setScreen] = useState("login");
  const [curUser, setCurUser] = useState(null);
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
  const [showRegLinkModal, setShowRegLinkModal] = useState(false);
  const blank = { name: "", email: "", password: "", age: "", weight: "", height: "", gender: "male", goal: "Weight Loss", pal: "moderate", phone: "" };
  const [form, setForm] = useState(blank);
  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiTitle, setAiTitle] = useState("");

  const t = T[lang]; const isAr = lang === "ar";
  useEffect(() => { sv(SK, clients); }, [clients]);
  useEffect(() => { sv(RK, regs); }, [regs]);
  useEffect(() => { sv(LK, lang); }, [lang]);

  if (window.location.pathname === "/register") {
    return <RegPage lang={lang} setLang={setLang} onSubmit={data => { const r = ld(RK, []); sv(RK, [...r, { ...data, id: Date.now(), submittedAt: new Date().toISOString() }]); }} />;
  }

  const login = () => {
    setLErr("");
    if (lf.u === ADMIN.u && lf.p === ADMIN.p) { setCurUser({ name: TRAINER.name }); setScreen("admin"); return; }
    const c = clients.find(x => x.email === lf.u && x.password === lf.p);
    if (c) { if (c.status !== "Active") { setLErr(t.accountDisabled); return; } setCurUser(c); setScreen("client"); return; }
    setLErr(t.invalidCredentials);
  };
  const logout = () => { setScreen("login"); setCurUser(null); setLf({ u: "", p: "" }); };

  const genAI = useCallback(async (client, type) => {
    const pal = PAL.find(p => p.id === (client.pal || "moderate")) || PAL[2];
    const tdee = calcTDEE(client.weight, client.height, client.age, client.gender || "male", pal.factor);
    const target = goalCal(tdee, client.goal);
    const bmi = (client.weight / ((client.height / 100) ** 2)).toFixed(1);
    const prompt = type === "workout"
      ? `Professional trainer. 7-day workout plan for: ${client.name}, Age:${client.age}, ${client.weight}kg, ${client.height}cm, BMI:${bmi}, Goal:${client.goal}, Activity:${pal.en}. Days 1-7, exercises, sets, reps, rest.`
      : `Professional nutritionist. Daily meal plan for: ${client.name}, Age:${client.age}, ${client.weight}kg, ${client.height}cm, BMI:${bmi}, Goal:${client.goal}, TDEE:${tdee}kcal, Target:${target}kcal. Breakfast/lunch/dinner/2snacks with foods, portions, calories, macros total close to ${target}kcal.`;
    setAiLoading(true); setAiText(""); setAiTitle(type === "workout" ? "⚡ " + (isAr ? "خطة التمارين" : "Workout Plan") : "🥗 " + (isAr ? "خطة التغذية" : "Nutrition Plan")); setAiOpen(true);
    try { const r = await callAI(prompt); setAiText(r); setClients(prev => prev.map(c => c.id === client.id ? { ...c, [type === "workout" ? "workoutPlan" : "nutritionPlan"]: r } : c)); if (curUser?.id === client.id) setCurUser(p => ({ ...p, [type === "workout" ? "workoutPlan" : "nutritionPlan"]: r })); }
    catch { setAiText("ERROR"); }
    setAiLoading(false);
  }, [curUser, isAr]);

  const addClient = () => {
    if (!form.name || !form.email) return;
    const pwd = form.password || genPwd();
    const c = { ...form, password: pwd, id: Date.now(), age: +form.age || 25, weight: +form.weight || 70, height: +form.height || 170, joinDate: new Date().toISOString().split("T")[0], status: "Active", workoutPlan: null, nutritionPlan: null, progress: [{ date: new Date().toISOString().split("T")[0], weight: +form.weight || 70 }] };
    setClients(p => [...p, c]); setShowAdd(false); setShareD({ name: c.name, email: c.email, password: pwd, phone: c.phone }); setShowShare(true); setForm(blank);
  };
  const saveEdit = () => { if (!editC) return; setClients(p => p.map(c => c.id === editC.id ? { ...c, name: form.name || c.name, email: form.email || c.email, password: form.password || c.password, age: +form.age || c.age, weight: +form.weight || c.weight, height: +form.height || c.height, gender: form.gender || c.gender, goal: form.goal || c.goal, pal: form.pal || c.pal, phone: form.phone !== undefined ? form.phone : c.phone } : c)); setShowEdit(false); setEditC(null); setForm(blank); };
  const openEdit = (c) => { setEditC(c); setForm({ name: c.name, email: c.email, password: c.password, age: String(c.age), weight: String(c.weight), height: String(c.height), gender: c.gender || "male", goal: c.goal, pal: c.pal || "moderate", phone: c.phone || "" }); setShowEdit(true); };
  const approveReg = (reg) => { const pwd = genPwd(); const c = { id: Date.now(), name: reg.name, email: reg.email, password: pwd, age: +reg.age || 25, weight: +reg.weight || 70, height: +reg.height || 170, gender: reg.gender || "male", goal: reg.goal || "General Fitness", pal: reg.pal || "moderate", phone: reg.phone, joinDate: new Date().toISOString().split("T")[0], status: "Active", workoutPlan: null, nutritionPlan: null, progress: [{ date: new Date().toISOString().split("T")[0], weight: +reg.weight || 70 }] }; setClients(p => [...p, c]); setRegs(p => p.filter(r => r.id !== reg.id)); setShareD({ name: c.name, email: c.email, password: pwd, phone: c.phone }); setShowShare(true); };
  const toggleStatus = (id) => setClients(p => p.map(c => c.id === id ? { ...c, status: c.status === "Active" ? "Disabled" : "Active" } : c));
  const waMsgUrl = (d) => { if (!d) return "#"; const msg = `🏋️ *Physical Definition*\n\n${isAr ? "مرحباً" : "Hi"} ${d.name}!\n\n${isAr ? "بيانات الدخول:" : "Login Details:"}\n📧 Email: ${d.email}\n🔑 ${isAr ? "كلمة المرور" : "Password"}: ${d.password}\n\n🌐 ${TRAINER.appUrl}\n\n_${t.tagline}_\n— ${TRAINER.name}`; return `https://wa.me/${(d.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`; };
  const regLink = `${window.location.origin}/register`;
  const liveC = clients.find(c => c.id === curUser?.id) || curUser;
  const activeCount = clients.filter(c => c.status === "Active").length;
  const goals = clients.reduce((a, c) => { a[c.goal] = (a[c.goal] || 0) + 1; return a; }, {});
  const GOALS = isAr ? GOALS_AR : GOALS_EN;
  const NAV = [{ id: "dashboard", l: t.dashboard, i: "◈" }, { id: "clients", l: t.clients, i: "◎" }, { id: "ai-tools", l: t.aiTools, i: "✦" }, { id: "plans", l: t.plans, i: "▤" }, { id: "requests", l: `${t.requests}${regs.length ? `(${regs.length})` : ""}`, i: "📋" }];

  // ── LOGIN ──
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
          <div style={{ marginBottom: 11 }}><div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{t.email}</div><input className="inp" placeholder={t.email} value={lf.u} onChange={e => setLf(p => ({ ...p, u: e.target.value }))} onKeyDown={e => e.key === "Enter" && login()} style={{ direction: "ltr" }} /></div>
          <div style={{ marginBottom: 20 }}><div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{t.password}</div><input className="inp" type="password" placeholder="••••••••" value={lf.p} onChange={e => setLf(p => ({ ...p, p: e.target.value }))} onKeyDown={e => e.key === "Enter" && login()} /></div>
          <Btn ch={t.enter} v="gold" full onClick={login} sx={{ padding: "13px", fontSize: 15, letterSpacing: 1 }} />
          <div style={{ textAlign: "center", marginTop: 12 }}><a href="/register" style={{ fontSize: 13, color: G.gold, textDecoration: "none" }}>{t.newMember}</a></div>
        </div>
        {/* Professional trainer contact strip */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: G.grad, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#080600", fontSize: 13 }}>MR</div>
            <div style={{ textAlign: isAr ? "right" : "left" }}>
              <div className="sf gd" style={{ fontSize: 14, fontWeight: 700 }}>{TRAINER.name}</div>
              <div style={{ fontSize: 11, color: G.muted }}>{isAr ? TRAINER.designationAr : TRAINER.designation}</div>
            </div>
          </div>
          <a href={`https://wa.me/${TRAINER.whatsapp}`} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 20, color: G.green, textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
            💬 {isAr ? "تواصل معنا على واتساب" : "Contact us on WhatsApp"}
          </a>
        </div>
      </div>
    </div>
  );

  // ── CLIENT ──
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
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Logo s={26} /><div className="sf gd" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>{t.appName}</div></div>
          <div style={{ display: "flex", gap: 8 }}><LangBtn lang={lang} setLang={setLang} /><Btn ch={t.logout} v="danger" onClick={logout} sx={{ padding: "5px 12px", fontSize: 12 }} /></div>
        </div>
        <div style={{ background: G.surf, borderBottom: `1px solid ${G.border}`, display: "flex", overflowX: "auto" }}>
          {[{ id: "profile", l: t.profile }, { id: "workout", l: t.workout }, { id: "nutrition", l: t.nutrition }, { id: "progress", l: t.progress }].map(tab => (
            <button key={tab.id} className="btn" onClick={() => setCTab(tab.id)} style={{ padding: "12px 16px", background: "none", fontSize: 13, fontWeight: 600, color: cTab === tab.id ? G.gold : G.muted, borderBottom: cTab === tab.id ? `2px solid ${G.gold}` : "2px solid transparent", whiteSpace: "nowrap" }}>{tab.l}</button>
          ))}
        </div>
        <div style={{ padding: 14, maxWidth: 600, margin: "0 auto" }}>
          {cTab === "profile" && (
            <div className="fd">
              <div style={{ marginBottom: 14 }}><div className="sf gd" style={{ fontSize: 22, fontWeight: 700 }}>{t.welcome}, {liveC.name.split(" ")[0]}!</div><div style={{ fontSize: 12, color: G.muted, marginTop: 3 }}>{t.memberSince} {liveC.joinDate}</div></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 11 }}>
                {[{ l: t.age, v: `${liveC.age} ${isAr ? "سنة" : "yrs"}` }, { l: t.weight, v: `${liveC.weight} kg` }, { l: t.height, v: `${liveC.height} cm` }, { l: t.goal, v: liveC.goal }].map((x, i) => (
                  <div key={i} className="card" style={{ padding: 12 }}><div style={{ fontSize: 9, color: G.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>{x.l}</div><div style={{ fontSize: 15, fontWeight: 700 }}>{x.v}</div></div>
                ))}
              </div>
              <div className="card" style={{ padding: 14, marginBottom: 11 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div><div style={{ fontSize: 9, color: G.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>{t.bmi}</div><div style={{ fontSize: 38, fontWeight: 800, color: bmiColor, lineHeight: 1 }}>{bmi}</div><div style={{ fontSize: 12, fontWeight: 700, color: bmiColor, marginTop: 3 }}>{bmiLabel}</div></div>
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
            </div>
          )}
          {(cTab === "workout" || cTab === "nutrition") && (
            <div className="fd">
              <div className="sf gd" style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>{cTab === "workout" ? "⚡ " + t.workout : "🥗 " + t.nutrition}</div>
              <div className="card" style={{ padding: 16, minHeight: 150 }}>
                {(cTab === "workout" ? liveC.workoutPlan : liveC.nutritionPlan)
                  ? <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.9, color: G.text }}>{cTab === "workout" ? liveC.workoutPlan : liveC.nutritionPlan}</pre>
                  : <div style={{ textAlign: "center", padding: "36px 20px", color: G.dim }}><div style={{ fontSize: 28, marginBottom: 8 }}>{cTab === "workout" ? "⚡" : "🥗"}</div><div style={{ color: G.muted }}>{t.trainerWillAdd}</div></div>}
              </div>
            </div>
          )}
          {cTab === "progress" && (
            <div className="fd">
              <div className="sf gd" style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>{t.progress}</div>
              <div className="card" style={{ padding: 13 }}>
                {liveC.progress.map((p, i) => { const diff = i > 0 ? (p.weight - liveC.progress[i - 1].weight).toFixed(1) : null; return (<div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderBottom: i < liveC.progress.length - 1 ? `1px solid ${G.border}` : "none" }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: G.grad, flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ fontSize: 10, color: G.muted }}>{p.date}</div><div style={{ fontSize: 17, fontWeight: 700 }}>{p.weight} <span style={{ fontSize: 10, color: G.muted }}>kg</span></div></div>{diff !== null && <div style={{ fontSize: 12, fontWeight: 700, color: parseFloat(diff) <= 0 ? G.green : G.red }}>{parseFloat(diff) > 0 ? "+" : ""}{diff} kg</div>}</div>); })}
              </div>
            </div>
          )}
        </div>
        <Ovl show={aiOpen} close={() => !aiLoading && setAiOpen(false)} mw={580} ch={<>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }} dir={isAr ? "rtl" : "ltr"}>
            <div className="sf gd" style={{ fontSize: 18, fontWeight: 700 }}>{aiTitle}</div>
            {!aiLoading && <button className="btn" onClick={() => setAiOpen(false)} style={{ background: "none", color: G.muted, fontSize: 20 }}>✕</button>}
          </div>
          {aiLoading ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "36px 0", gap: 12 }}><div className="sp" /><div style={{ color: G.gold, fontWeight: 600 }}>{isAr ? "جاري التوليد..." : "Generating plan..."}</div></div>
            : aiText === "ERROR" ? <div style={{ textAlign: "center", padding: "28px 0" }}><div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div><div style={{ color: G.amber, fontWeight: 700 }}>{isAr ? "فشل التوليد" : "Generation Failed"}</div></div>
            : <div dir={isAr ? "rtl" : "ltr"}><div style={{ background: "rgba(212,175,55,0.08)", border: `1px solid ${G.border}`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: G.gold }}>✦ {isAr ? "تم حفظ الخطة" : "Saved to profile"}</div><pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.9, color: G.text }}>{aiText}</pre></div>}
        </>} />
      </div>
    );
  }

  // ── ADMIN ──
  return (
    <div style={{ minHeight: "100vh", background: G.bg, color: G.text }} dir={isAr ? "rtl" : "ltr"}>
      <style>{CSS}</style>
      <div style={{ background: G.surf, borderBottom: `1px solid ${G.border}`, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Logo s={26} /><div className="sf gd" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>{t.appName}</div></div>
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
              {[{ l: t.total, v: clients.length, c: G.gold }, { l: t.active, v: activeCount, c: G.green }, { l: t.pending, v: regs.length, c: G.amber }, { l: t.aiPlans, v: clients.filter(c => c.workoutPlan || c.nutritionPlan).length, c: G.blue }].map((s, i) => (
                <div key={i} className="card" style={{ padding: 14 }}><div style={{ fontSize: 28, fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</div><div style={{ fontSize: 11, color: G.muted, marginTop: 5 }}>{s.l}</div></div>
              ))}
            </div>
            <div className="card" style={{ padding: 14, marginBottom: 12, border: `1px solid ${G.borderHi}` }}>
              <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>{t.registrationLink}</div>
              <div style={{ background: G.surf2, borderRadius: 7, padding: "7px 11px", fontSize: 11, color: G.muted, marginBottom: 10, wordBreak: "break-all", direction: "ltr" }}>{regLink}</div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
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
              return (
                <div key={c.id} className="card" style={{ padding: 13, marginBottom: 9, opacity: disabled ? 0.6 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
                    <Av name={c.name} sz={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: G.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</div>
                    </div>
                    <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: c.status === "Active" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: c.status === "Active" ? G.green : G.red, border: `1px solid ${c.status === "Active" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` }}>{c.status === "Active" ? t.active : disabled ? t.disabled : t.inactive}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 9 }}>
                    {[{ l: t.goal, v: c.goal }, { l: t.weight, v: `${c.weight}kg` }, { l: t.age, v: `${c.age}y` }].map(x => (<div key={x.l} style={{ background: G.surf2, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}><div style={{ fontSize: 9, color: G.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{x.l}</div><div style={{ fontSize: 11, fontWeight: 700 }}>{x.v}</div></div>))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 5, marginBottom: 9 }}>
                    <Btn ch="✏️" v="ghost" onClick={() => openEdit(c)} sx={{ padding: "6px", fontSize: 12 }} />
                    <Btn ch="📋" v="ghost" onClick={() => { setSelC(c); setATab("plans"); }} sx={{ padding: "6px", fontSize: 12 }} />
                    <Btn ch="💪" v="ghost" onClick={() => genAI(c, "workout")} sx={{ padding: "6px", fontSize: 12 }} />
                    <Btn ch="🥗" v="green" onClick={() => genAI(c, "nutrition")} sx={{ padding: "6px", fontSize: 12 }} />
                    <Btn ch={disabled ? "▶" : "⏸"} v={disabled ? "green" : "amber"} onClick={() => toggleStatus(c.id)} sx={{ padding: "6px", fontSize: 12 }} />
                    <Btn ch="🗑️" v="danger" onClick={() => { if (window.confirm(`${isAr ? "هل تريد حذف" : "Delete"} ${c.name}?`)) setClients(p => p.filter(x => x.id !== c.id)); }} sx={{ padding: "6px", fontSize: 12 }} />
                  </div>
                  {c.phone && (
                    <a href={`https://wa.me/${c.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`🏋️ *Physical Definition*\n\n${isAr ? "مرحباً" : "Hi"} ${c.name}!\n\n📧 Email: ${c.email}\n🔑 ${isAr ? "كلمة المرور" : "Password"}: ${c.password}\n\n🌐 ${TRAINER.appUrl}\n— ${TRAINER.name}`)}`}
                      target="_blank" rel="noreferrer"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "7px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, color: G.green, textDecoration: "none", fontSize: 11, fontWeight: 700 }}>
                      💬 {t.shareLogin}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* AI TOOLS */}
        {aTab === "ai-tools" && (
          <div className="fd">
            <div style={{ marginBottom: 12 }}><div className="sf gd" style={{ fontSize: 22, fontWeight: 700 }}>{t.aiTools}</div></div>
            {clients.map(c => { const pal = PAL.find(p => p.id === (c.pal || "moderate")) || PAL[2]; const tdee = calcTDEE(c.weight, c.height, c.age, c.gender || "male", pal.factor); const target = goalCal(tdee, c.goal); return (<div key={c.id} className="card" style={{ padding: 14, marginBottom: 10 }}><div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}><Av name={c.name} sz={38} /><div><div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div><div style={{ fontSize: 11, color: G.muted }}>{c.goal} · {target} kcal · {pal.icon} {isAr ? pal.ar : pal.en}</div></div></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 10 }}>{[{ icon: "⚡", l: isAr ? "تمارين" : "Workout", has: c.workoutPlan }, { icon: "🥗", l: isAr ? "تغذية" : "Nutrition", has: c.nutritionPlan }].map(p => (<div key={p.l} style={{ background: G.surf2, borderRadius: 7, padding: 9, textAlign: "center", border: `1px solid ${p.has ? "rgba(34,197,94,0.2)" : G.border}` }}><div style={{ fontSize: 17 }}>{p.icon}</div><div style={{ fontSize: 10, color: G.muted, marginTop: 3 }}>{p.l}</div><div style={{ fontSize: 10, fontWeight: 700, color: p.has ? G.green : G.amber, marginTop: 2 }}>{p.has ? "✓" : isAr ? "معلق" : "Pending"}</div></div>))}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}><Btn ch={`⚡ ${isAr ? "تمارين AI" : "Workout AI"}`} v="ghost" onClick={() => genAI(c, "workout")} sx={{ padding: "8px", fontSize: 12 }} /><Btn ch={`🥗 ${isAr ? "تغذية AI" : "Nutrition AI"}`} v="green" onClick={() => genAI(c, "nutrition")} sx={{ padding: "8px", fontSize: 12 }} /></div></div>); })}
          </div>
        )}

        {/* PLANS */}
        {aTab === "plans" && <PlansTab clients={clients} selC={selC} setSelC={setSelC} setClients={setClients} genAI={genAI} lang={lang} />}

        {/* REQUESTS */}
        {aTab === "requests" && (
          <div className="fd">
            <div style={{ marginBottom: 12 }}><div className="sf gd" style={{ fontSize: 22, fontWeight: 700 }}>{t.pendingRequests}</div></div>
            <div className="card" style={{ padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: G.muted, marginBottom: 8 }}>{t.shareRegLinkDesc}</div>
              <div style={{ display: "flex", gap: 7 }}>
                <Btn ch={t.copyLink} v="ghost" onClick={() => navigator.clipboard.writeText(regLink)} sx={{ padding: "6px 12px", fontSize: 11 }} />
                <a href={`https://wa.me/?text=${encodeURIComponent(`${regLink}`)}`} target="_blank" rel="noreferrer" style={{ ...VV.green, padding: "6px 12px", fontSize: 11, fontWeight: 600, borderRadius: 7, textDecoration: "none" }}>💬 {isAr ? "واتساب" : "WhatsApp"}</a>
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
          <div className="sf gd" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{t.addClient} {isAr ? "— عميل جديد" : "— New Client"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ gridColumn: "1/-1" }}><FF label={`${t.fullName} *`} value={form.name} onChange={v => sf("name", v)} ph="Name" dir={isAr ? "rtl" : "ltr"} /></div>
            <FF label="Email *" value={form.email} onChange={v => sf("email", v)} ph="email@example.com" />
            <FF label={t.phone} value={form.phone} onChange={v => sf("phone", v)} ph="+974 00000000" />
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
          <div className="sf gd" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>✏️ {t.edit} {isAr ? "العميل" : "Client"}</div>
          {editC && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ gridColumn: "1/-1" }}><FF label={t.fullName} value={form.name} onChange={v => sf("name", v)} ph={editC.name} dir={isAr ? "rtl" : "ltr"} /></div>
            <FF label="Email" value={form.email} onChange={v => sf("email", v)} ph={editC.email} />
            <FF label={t.phone} value={form.phone} onChange={v => sf("phone", v)} ph={editC.phone || "Phone"} />
            <FF label={isAr ? "كلمة مرور جديدة" : "New Password"} value={form.password} onChange={v => sf("password", v)} ph={isAr ? "اتركه فارغاً" : "Blank = keep"} />
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

      {/* SHARE CREDENTIALS */}
      <Ovl show={showShare} close={() => setShowShare(false)} mw={420} ch={
        <div dir={isAr ? "rtl" : "ltr"}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 42, marginBottom: 9 }}>🎉</div>
            <div className="sf gd" style={{ fontSize: 19, fontWeight: 700 }}>{t.credentialsSent}</div>
            <div style={{ fontSize: 13, color: G.muted, marginTop: 5 }}>{t.shareDetails} {shareD?.name}</div>
          </div>
          {shareD && (
            <div style={{ background: G.surf2, border: `1px solid ${G.borderHi}`, borderRadius: 11, padding: 14, marginBottom: 16 }}>
              {[{ l: isAr ? "الاسم" : "Name", v: shareD.name }, { l: isAr ? "البريد" : "Email", v: shareD.email }, { l: isAr ? "كلمة المرور" : "Password", v: shareD.password }, { l: isAr ? "الرابط" : "App", v: TRAINER.appUrl }].map(x => (
                <div key={x.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${G.border}` }}>
                  <span style={{ fontSize: 12, color: G.muted }}>{x.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, direction: "ltr" }}>{x.v}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {shareD?.phone && <a href={waMsgUrl(shareD)} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 11, color: G.green, textDecoration: "none", fontSize: 14, fontWeight: 700 }}>💬 {t.sendWhatsapp}</a>}
            <Btn ch={t.sharePDF} v="blue" full onClick={() => openWelcomePDF(shareD, lang)} sx={{ padding: "11px", fontSize: 13 }} />
            <Btn ch={t.copyCredentials} v="ghost" full onClick={() => navigator.clipboard.writeText(`Email: ${shareD?.email}\nPassword: ${shareD?.password}\nApp: ${TRAINER.appUrl}`)} sx={{ padding: "11px", fontSize: 12 }} />
            <Btn ch={t.close} v="danger" full onClick={() => setShowShare(false)} sx={{ padding: "11px", fontSize: 13 }} />
          </div>
        </div>
      } />

      {/* AI MODAL */}
      <Ovl show={aiOpen} close={() => !aiLoading && setAiOpen(false)} mw={600} ch={
        <div dir={isAr ? "rtl" : "ltr"}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div className="sf gd" style={{ fontSize: 19, fontWeight: 700 }}>{aiTitle}</div>
            {!aiLoading && <button className="btn" onClick={() => setAiOpen(false)} style={{ background: "none", color: G.muted, fontSize: 20 }}>✕</button>}
          </div>
          {aiLoading
            ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: 13 }}><div className="sp" /><div style={{ color: G.gold, fontWeight: 600, fontSize: 13 }}>{isAr ? "جاري التوليد بناءً على مستوى النشاط..." : "Generating based on TDEE & activity..."}</div></div>
            : aiText === "ERROR"
            ? <div style={{ textAlign: "center", padding: "30px 0" }}><div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div><div style={{ color: G.amber, fontWeight: 700 }}>{isAr ? "فشل التوليد" : "Generation Failed"}</div><div style={{ fontSize: 12, color: G.muted, marginTop: 6 }}>{isAr ? "تحقق من متغير ANTHROPIC_API_KEY → GEMINI_API_KEY في Vercel" : "Check ANTHROPIC_API_KEY → GEMINI_API_KEY in Vercel environment variables"}</div></div>
            : <div><div style={{ background: "rgba(212,175,55,0.08)", border: `1px solid ${G.border}`, borderRadius: 7, padding: "8px 11px", marginBottom: 12, fontSize: 11, color: G.gold }}>✦ {isAr ? "تم الحفظ" : "Saved to client profile"}</div><pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.9, color: G.text }}>{aiText}</pre></div>}
        </div>
      } />
    </div>
  );
}
