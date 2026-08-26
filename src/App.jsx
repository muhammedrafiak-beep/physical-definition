import { useState, useEffect, useCallback } from "react";
import { ExerciseIllustration } from "./ExerciseIllustration";
import { WorkoutPlayer } from "./WorkoutPlayer";
import { AdminWorkoutHistory, ClientWorkoutHistory } from "./WorkoutHistory";
import { PDScore } from "./PDScore";
import { Icon } from "./Icons";
import { programmeState } from "./programme";
import { T } from "./i18n";
import { WORKOUT_SYSTEMS, LEVEL_META } from "./workouts";
import { MEALS, MEAL_PREP, MEAL_IMAGES, scaleMealPlan } from "./meals";

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

const TRAINER = { name: "Muhammed Rafi", designation: "Certified Personal Trainer", designationAr: "مدرب شخصي معتمد", whatsapp: "97471000786", appUrl: "https://www.physicaldefinition.com" };
// The admin username and password used to live here, which meant they shipped
// inside the browser bundle — anyone who opened devtools could read them.
// They are now environment variables checked by /api/admin-login.

const adminToken = () => {
  try { return sessionStorage.getItem("pd_admin_token") || ""; } catch { return ""; }
};

// Issues a NEW password for a client and returns it once. Nobody can read a
// client's existing password any more — it is stored only as a hash.
const apiResetClientPassword = async (clientId) => {
  const r = await fetch("/api/admin-reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken()}` },
    body: JSON.stringify({ clientId }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Could not reset the password");
  return d;
};
const SK = "pd_v7_clients"; const RK = "pd_v7_regs"; const LK = "pd_v7_lang";

// ── CLIENT DATA ──────────────────────────────────────────
// Progress photos and workout logs used to go straight to Supabase from here
// with the anon key. That key is public — it is inside this very bundle — so
// anyone could read every client's progress photos, weights and notes. They
// now go through /api/client-data, which takes the client id from the signed
// session token and never from anything the browser sends. A client can only
// reach their own rows.
const clientToken = () => {
  try { return sessionStorage.getItem("pd_token") || ""; } catch { return ""; }
};

const clientPost = async (payload) => {
  const r = await fetch("/api/client-data", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${clientToken()}` },
    body: JSON.stringify(payload),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "That didn't work. Try again.");
  return d;
};

// Phone cameras produce 3-5 MB photos. Stored raw, a few hundred of them fill
// the entire free storage tier, and every one has to travel over a phone
// connection. A progress photo loses nothing visible at 1000px, and shrinks to
// roughly 150 KB. Modern browsers apply the EXIF rotation when drawing an
// <img>, so a photo taken sideways stays the right way up.
const PHOTO_MAX_EDGE = 1000;

const resizeImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as a photo."));
    };
    img.src = url;
  });

// No clientId argument any more, on any of these — it comes from the token.
// Passing one would have been the bug: it is exactly the number an attacker
// would change.
const dbGetPhotos = async () => {
  const d = await clientPost({ action: "photos.list" });
  return d.photos || [];
};
const dbAddPhoto = async (file, weight, notes) => {
  const image = await resizeImage(file);
  const d = await clientPost({ action: "photos.add", image, weight, notes });
  return d.photo;
};
const dbDeletePhoto = async (id) => {
  await clientPost({ action: "photos.delete", id });
};

// No Supabase client in this file any more. Every read and write now goes
// through an authenticated endpoint — /api/admin-data for the trainer,
// /api/client-data for a client — so App.jsx never holds a database key at
// all. Only the exercise photo and video URLs above are still Supabase, and
// those are public artwork by design.

// ── ADMIN DATA ─────────────────────────────────────────────
// These used to query Supabase straight from the browser with the anon key,
// which put the whole clients table — names, emails, phone numbers — one
// devtools window away from anyone. They now go through /api/admin-data,
// which checks the admin session token and uses the service role key
// server-side. No password ever comes back from these calls.

const adminPost = async (payload) => {
  const r = await fetch("/api/admin-data", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken()}` },
    body: JSON.stringify(payload),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
};

const dbGetClients = async () => {
  try { return (await adminPost({ action: "list_clients" })).clients; }
  catch (e) { console.error("getClients:", e.message); return null; }
};

// Returns { client, password } — the password is shown once and never stored
// in readable form, so it cannot be looked up again later.
const dbAddClient = async (c) => {
  try { return await adminPost({ action: "create_client", client: c }); }
  catch (e) { console.error("addClient:", e.message); return null; }
};

const dbUpdateClient = async (c) => {
  try { await adminPost({ action: "update_client", client: c }); }
  catch (e) { console.error("updateClient:", e.message); }
};

const dbDeleteClient = async (id) => {
  try { await adminPost({ action: "delete_client", id }); }
  catch (e) { console.error("deleteClient:", e.message); }
};

const dbGetRegs = async () => {
  try { return (await adminPost({ action: "list_registrations" })).registrations; }
  catch (e) { console.error("getRegs:", e.message); return null; }
};

const dbDeleteReg = async (id) => {
  try { await adminPost({ action: "delete_registration", id }); }
  catch (e) { console.error("deleteReg:", e.message); }
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

// Passwords are generated on the server now (api/_lib/admin.js), using
// crypto.randomInt rather than Math.random, which is not safe for this.

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
  const workoutSystem = systemFor(client);
  const mealPlanRaw = MEALS.find(m => m.id === client.mealPlanId);
  const mealPlan = mealPlanRaw ? scaleMealPlan(mealPlanRaw, target) : null;

  // Build exercise GIF URLs for PDF using ExerciseDB cache
  const BASE_IMG = "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos";
  const getGifForPDF = (exName) => {
    const l = (exName || "").toLowerCase();let url = null;
    if(l.includes("incline push")) url = BASE_IMG+"/Incline_Push_Ups.jpeg";
    else if(l.includes("push-up")||l.includes("pushup")||l.includes("push up")) url = BASE_IMG+"/Push_Ups.jpeg";
    else if(l.includes("incline dumbbell")||l.includes("incline press")) url = BASE_IMG+"/Incline_Dumbbell_Press.jpeg";
    else if(l.includes("bench press")||l.includes("chest press")) url = BASE_IMG+"/Bench_Press.jpeg";
    else if(l.includes("overhead press")||l.includes("military press")||l.includes("ohp")||l.includes("shoulder press")||l.includes("arnold")) url = BASE_IMG+"/Overhead_Press.jpeg";
    else if(l.includes("squat")) url = BASE_IMG+"/Barbell_Squat.jpeg";
    else if(l.includes("deadlift")) url = BASE_IMG+"/Deadlift.jpeg";
    else if(l.includes("pull-up")||l.includes("pullup")||l.includes("chin-up")||l.includes("lat pulldown")||l.includes("pull up")) url = BASE_IMG+"/Pull_Up.jpeg";
    else if(l.includes("barbell row")||l.includes("t-bar row")||l.includes("cable row")||l.includes("seated row")||l.includes("bent over row")) url = BASE_IMG+"/Barbell_Row.jpeg";
    else if(l.includes("hammer curl")) url = BASE_IMG+"/Hammer_Curl.jpeg";
    else if(l.includes("bicep curl")||l.includes("barbell curl")||l.includes("preacher curl")) url = BASE_IMG+"/Bicep_Curl.jpeg";
    else if(l.includes("lateral raise")||l.includes("front raise")||l.includes("side delt")) url = BASE_IMG+"/Lateral_Raise.jpeg";
    else if(l.includes("face pull")) url = BASE_IMG+"/Face_Pull.jpeg";
    else if(l.includes("overhead tricep")||l.includes("overhead extension")) url = BASE_IMG+"/Overhead_Tricep_Extension.jpeg";
    else if(l.includes("tricep dip")||l.includes("chair dip")) url = BASE_IMG+"/Tricep_Dips.jpeg";
    else if(l.includes("tricep pushdown")||l.includes("rope pushdown")||l.includes("skull crusher")) url = BASE_IMG+"/Tricep_Pushdown.jpeg";
    else if(l.includes("leg press")) url = BASE_IMG+"/Leg_Press.jpeg";
    else if(l.includes("leg extension")||l.includes("band seated leg")) url = BASE_IMG+"/Leg_Extension.jpeg";
    else if(l.includes("leg curl")) url = BASE_IMG+"/Leg_Curl.jpeg";
    else if(l.includes("calf raise")||l.includes("calf")) url = BASE_IMG+"/Calf_Raise.jpeg";
    else if(l.includes("lunge")||l.includes("reverse lunge")||l.includes("step-up")||l.includes("split squat")) url = BASE_IMG+"/Lunge.jpeg";
    else if(l.includes("superman")) url = BASE_IMG+"/Superman_Hold.jpeg";
    else if(l.includes("plank shoulder")||l.includes("shoulder tap")) url = BASE_IMG+"/Plank_Shoulder_Taps.jpeg";
    else if(l.includes("plank")) url = BASE_IMG+"/Plank.jpeg";
    else if(l.includes("glute bridge")) url = BASE_IMG+"/Glute_Bridges.jpeg";
    else if(l.includes("wall sit")) url = BASE_IMG+"/Wall_Sit.jpeg";
    else if(l.includes("burpee")) url = BASE_IMG+"/Burpees.jpeg";
    else if(l.includes("mountain climber")) url = BASE_IMG+"/Mountain_Climbers.jpeg";
    else if(l.includes("bicycle crunch")) url = BASE_IMG+"/Bicycle_Crunches.jpeg";
    else if(l.includes("straight leg raise")) url = BASE_IMG+"/Straight_Leg_Raises.jpeg";
    else if(l.includes("foam roller")) url = BASE_IMG+"/Foam_Roller_Quad.jpeg";
    else if(l.includes("clamshell")) url = BASE_IMG+"/Clamshells.jpeg";
    else if(l.includes("stationary bike")||l.includes("pool walking")) url = BASE_IMG+"/Stationary_Bike.jpeg";
    else if(l.includes("pilates ring")||l.includes("inner thigh")) url = BASE_IMG+"/Pilates_Ring_Squeeze.jpeg";
    else if(l.includes("light jog")||l.includes("jog in place")) url = BASE_IMG+"/Light_Jog.jpeg";
    else if(l.includes("jumping jack")) url = BASE_IMG+"/Jumping_Jacks.jpeg";
    else if(l.includes("neck rotation")) url = BASE_IMG+"/Neck_Rotations.jpeg";
    else if(l.includes("shoulder rotation")) url = BASE_IMG+"/Shoulder_Rotations.jpeg";
    else if(l.includes("elbow circle")) url = BASE_IMG+"/Elbow_Circles.jpeg";
    else if(l.includes("wrist circle")) url = BASE_IMG+"/Wrist_Circles.jpeg";
    else if(l.includes("torso rotation")) url = BASE_IMG+"/Torso_Rotations.jpeg";
    else if(l.includes("hip circle")) url = BASE_IMG+"/Hip_Circles.jpeg";
    else if(l.includes("knee circle")) url = BASE_IMG+"/Knee_Circles.jpeg";
    else if(l.includes("ankle rotation")) url = BASE_IMG+"/Ankle_Rotations.jpeg";
    else if(l.includes("leg swing")) url = BASE_IMG+"/Leg_Swings.jpeg";
    else if(l.includes("arm swing")) url = BASE_IMG+"/Arm_Swings.jpeg";
    else if(l.includes("hip flexor")) url = BASE_IMG+"/Hip_Flexor_Stretch.jpeg";
    else if(l.includes("light walk")) url = BASE_IMG+"/Light_Walk.jpeg";
    else if(l.includes("quad stretch")) url = BASE_IMG+"/Standing_Quad_Stretch.jpeg";
    else if(l.includes("hamstring stretch")) url = BASE_IMG+"/Hamstring_Stretch.jpeg";
    else if(l.includes("chest stretch")) url = BASE_IMG+"/Chest_Stretch.jpeg";
    else if(l.includes("shoulder stretch")) url = BASE_IMG+"/Shoulder_Stretch.jpeg";
    else if(l.includes("child")) url = BASE_IMG+"/Childs_Pose.jpeg";
    else if(l.includes("deep breath")) url = BASE_IMG+"/Deep_Breathing.jpeg";
    else if(l.includes("bodyweight squat")) url = BASE_IMG+"/Barbell_Squat.jpeg";
    else if(l.includes("high knee")) url = BASE_IMG+"/Light_Jog.jpeg";
    return url ? `<img src="${url}" alt="${exName}" style="width:160px;height:100px;object-fit:contain;border-radius:8px;background:#fff;" />` : `<div style="width:160px;height:100px;background:#f5f5f5;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;">🏋️</div>`;
  };

  const workoutHTML = workoutSystem ? `
    <div class="section">
      <div class="section-title" style="color:${workoutSystem.color}">⚡ ${isAr ? workoutSystem.nameAr : workoutSystem.name}</div>
      <p style="color:#666;font-size:13px;margin-bottom:16px">${isAr ? workoutSystem.descAr : workoutSystem.desc}</p>
      <div class="day-block">
        <div class="day-title" style="color:#f59e0b">🔥 Warm-up</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;padding:10px;">
          ${[{name:"Light Jog in Place",sets:1,reps:"2 min",rest:"10s"},{name:"Jumping Jacks",sets:1,reps:"60 sec",rest:"10s"},{name:"Neck Rotations",sets:1,reps:"30 sec",rest:"10s"},{name:"Shoulder Rotations",sets:1,reps:"30 sec",rest:"10s"},{name:"Elbow Circles",sets:1,reps:"30 sec",rest:"10s"},{name:"Wrist Circles",sets:1,reps:"30 sec",rest:"10s"},{name:"Torso Rotations",sets:1,reps:"30 sec",rest:"10s"},{name:"Hip Circles",sets:1,reps:"30 sec",rest:"10s"},{name:"Knee Circles",sets:1,reps:"30 sec",rest:"10s"},{name:"Ankle Rotations",sets:1,reps:"30 sec",rest:"10s"},{name:"Leg Swings",sets:1,reps:"30 sec",rest:"10s"},{name:"Arm Swings",sets:1,reps:"30 sec",rest:"10s"},{name:"Bodyweight Squat",sets:1,reps:"10",rest:"20s"},{name:"Hip Flexor Stretch",sets:1,reps:"30 sec",rest:"10s"}].map(ex => `
            <div style="background:#fff8e7;border-radius:8px;overflow:hidden;border:1px solid #f59e0b30;">
              <div style="padding:8px;display:flex;justify-content:center;align-items:center;min-height:70px;background:#fef3c7;">
                ${getGifForPDF(ex.name)}
              </div>
              <div style="padding:8px;">
                <div style="font-weight:700;font-size:11px;color:#111;margin-bottom:4px;">${ex.name}</div>
                <span style="background:#f59e0b20;color:#f59e0b;font-size:10px;font-weight:700;padding:2px 6px;border-radius:10px;">${ex.reps}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
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
      <div class="day-block">
        <div class="day-title" style="color:#22c55e">🧘 Cool-down & Stretching</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;padding:10px;">
          ${[{name:"Light Walk in Place",sets:1,reps:"60 sec",rest:"10s"},{name:"Standing Quad Stretch",sets:1,reps:"30 sec",rest:"10s"},{name:"Hamstring Stretch",sets:1,reps:"30 sec",rest:"10s"},{name:"Hip Flexor Stretch",sets:1,reps:"30 sec",rest:"10s"},{name:"Chest Stretch",sets:1,reps:"30 sec",rest:"10s"},{name:"Shoulder Stretch",sets:1,reps:"30 sec",rest:"10s"},{name:"Childs Pose",sets:1,reps:"60 sec",rest:"10s"},{name:"Deep Breathing",sets:1,reps:"60 sec",rest:"10s"}].map(ex => `
            <div style="background:#f0fdf4;border-radius:8px;overflow:hidden;border:1px solid #22c55e30;">
              <div style="padding:8px;display:flex;justify-content:center;align-items:center;min-height:70px;background:#dcfce7;">
                ${getGifForPDF(ex.name)}
              </div>
              <div style="padding:8px;">
                <div style="font-weight:700;font-size:11px;color:#111;margin-bottom:4px;">${ex.name}</div>
                <span style="background:#22c55e20;color:#22c55e;font-size:10px;font-weight:700;padding:2px 6px;border-radius:10px;">${ex.reps}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
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
      <img src="${mealPlan.image}" alt="${mealPlan.name}" style="width:100%;height:200px;object-fit:cover;border-radius:10px;margin-bottom:14px;" />
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
//
// Direction A, "clinical premium": ink on paper, one navy accent, a serif for
// titles and numbers. Chosen over the black-and-gold alternative because PD's
// whole argument is that the programme follows a measurement — a document a
// clinician would hand you reads that way — and because #0E2035 on #FCFCFD is
// 14.9:1, which an eighty-year-old can read on a phone in a lit room. The old
// #21509B on #FCFCFD was 7.4:1 and every label sat below 4.5:1.
//
// TWO palettes, deliberately:
//   DAY   — everything the client reads, decides and signs in with.
//   NIGHT — the workout player, and only the player. It is held at arm's
//           length mid-set, often one-handed; a dark field stops a phone at
//           full brightness from being the loudest object in the room.
//
// `G` keeps every key name it had — gold, green, amber, blue — so moving the
// whole app across took no edit at any of the 440-odd call sites. What those
// names RESOLVE to is the only thing that changed. `gold` means "the accent",
// whatever colour the accent happens to be; renaming it would have been a
// day of churn for a word.
const G = {
  bg: "#F3F6FA", surf: "#FFFFFF", surf2: "#F3F6FA",
  border: "#E4E9F0", borderHi: "#CBD6E6",
  gold: "#21509B",
  grad: "linear-gradient(180deg,#16304F,#0E2035)",
  text: "#0E2035", muted: "#5C6D84", dim: "#93A2B7",
  green: "#12795A", red: "#A63A3A", amber: "#9A6212", blue: "#21509B",

  // Additive. A dark theme can wash a colour over the page at 10% alpha and
  // get a tint; over white the same wash goes grey. Light themes need the
  // tint mixed properly, so each status colour gets a companion fill.
  ink: "#0E2035", paper: "#FCFCFD", soft: "#F3F6FA",
  // `dim` is decorative only — empty-state icons, hairlines, the chevron in a
  // select. Anything a person has to READ uses `muted`, which is measured.
  accent: "#21509B", accentSoft: "#E8EEF8", accentLine: "#D3E0F2",
  greenSoft: "#E6F2ED", greenLine: "#C9E3D8",
  amberSoft: "#FBF2E3", amberLine: "#EFE0C2",
  redSoft: "#FBECEC", redLine: "#F0D6D6",

  // NIGHT — the player only.
  nBg: "#0E2035", nSurf: "#152B45", nSurf2: "#1B3350", nLine: "#24405F",
  nText: "#FCFCFD", nMuted: "#8FA3BE", nAccent: "#8FB4EA",
};
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Public+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html{font-size:16px;-webkit-text-size-adjust:100%;text-size-adjust:100%;}
html,body{background:${G.bg};color:${G.text};font-family:'Public Sans',ui-sans-serif,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;max-width:100vw;touch-action:manipulation;}
input,select,button,textarea{font-family:'Public Sans',ui-sans-serif,system-ui,sans-serif;font-size:16px;color:inherit;}

/* The display face. Used for titles and for numbers that are the answer to
   something — a weight, a score, a count of sessions. Not for labels: at
   11px a serif stops being elegant and starts being hard. */
.sf{font-family:'Instrument Serif',Georgia,'Times New Roman',serif;font-weight:400;letter-spacing:-.01em;}

/* .gd used to paint gold gradient text by clipping a background. There is no
   gradient text in this design, and there were ~40 call sites, so rather than
   remove the class it is now a no-op that keeps whatever colour it is given.
   -webkit-text-fill-color has to be reset explicitly or the old transparent
   fill would survive and every title would vanish. */
.gd{background:none;-webkit-background-clip:border-box;background-clip:border-box;-webkit-text-fill-color:currentColor;}

.btn{cursor:pointer;border:none;transition:background .15s,border-color .15s,opacity .15s;outline:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
.btn:active{opacity:.8;transform:scale(.985);}
.btn:focus-visible,.inp:focus-visible,a:focus-visible{outline:2px solid ${G.accent};outline-offset:2px;}

.inp{background:#fff;border:1px solid ${G.border};border-radius:12px;padding:14px 15px;color:${G.text};font-size:16px;width:100%;min-height:52px;outline:none;-webkit-appearance:none;appearance:none;transition:border-color .15s,box-shadow .15s;}
.inp:focus{border-color:${G.accent};box-shadow:0 0 0 3px ${G.accentSoft};}
.inp::placeholder{color:#7E8FA8;}
select.inp{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%235C6D84' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;}

.card{background:#fff;border:1px solid ${G.border};border-radius:16px;box-shadow:0 1px 2px rgba(14,32,53,.04);}

/* NIGHT. The player sets this on its root, and the shared primitives follow
   it there rather than each needing a dark variant passed in. */
.night{background:${G.nBg};color:${G.nText};}
.night .card{background:${G.nSurf};border-color:${G.nLine};box-shadow:none;}
.night .inp{background:${G.nBg};border-color:${G.nLine};color:${G.nText};}
.night .inp:focus{border-color:${G.nAccent};box-shadow:0 0 0 3px rgba(143,180,234,.16);}
.night .inp::placeholder{color:${G.nMuted};}

.fd{animation:fi .25s ease;}
@keyframes fi{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
.sp{width:34px;height:34px;border:3px solid ${G.border};border-top:3px solid ${G.accent};border-radius:50%;animation:spin .7s linear infinite;}
.night .sp{border-color:${G.nLine};border-top-color:${G.nAccent};}
@keyframes squat3d{0%{transform:rotateX(0deg) translateY(0px);}50%{transform:rotateX(12deg) translateY(18px);}100%{transform:rotateX(0deg) translateY(0px);}}
@keyframes push3d{0%{transform:rotateZ(0deg) translateY(0px);}50%{transform:rotateZ(2deg) translateY(-14px);}100%{transform:rotateZ(0deg) translateY(0px);}}
@keyframes pull3d{0%{transform:translateY(0px);}50%{transform:translateY(-20px);}100%{transform:translateY(0px);}}
@keyframes deadlift3d{0%{transform:rotateX(25deg) translateY(20px);}50%{transform:rotateX(0deg) translateY(0px);}100%{transform:rotateX(25deg) translateY(20px);}}
@keyframes plank3d{0%,100%{transform:scaleX(1);}50%{transform:scaleX(1.02) translateY(-2px);}}
@keyframes muscleGlow{0%,100%{opacity:0.2;}50%{opacity:0.7;}}
@keyframes breathe{0%,100%{transform:scaleY(1);}50%{transform:scaleY(1.04);}}
@media(max-width:480px){
  html{font-size:15px;}
  .inp{padding:13px 14px;}
}
@media (prefers-reduced-motion: reduce){
  *{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important;}
}

/* ── PAR-Q answer buttons ────────────────────────────────────
   Measured at 390px: these were 41x26 and 46x26, five pixels apart —
   the smallest buttons in the app, and the ones that record whether
   somebody gets chest pain. Everything else here can be mis-tapped and
   corrected on the next screen; a health answer is written down and
   believed. On a phone they now take the full width, one above the
   other, at 48px. */
.parq-row{display:flex;gap:12px;align-items:flex-start;}
.parq-btns{display:flex;gap:8px;flex-shrink:0;}
.parq-btn{min-width:62px;min-height:44px;border-radius:9px;font-size:13px;font-weight:700;}
@media(max-width:480px){
  .parq-row{flex-direction:column;align-items:stretch;}
  .parq-btns{width:100%;}
  .parq-btn{flex:1;min-height:48px;font-size:14px;}
}
`;


const Logo = ({ s = 32 }) => (
  <svg width={s} height={s} viewBox="0 0 48 48" role="img" aria-label="Physical Definition">
    <rect width="48" height="48" rx="13" fill="#0E2035" />
    <text x="24" y="32" textAnchor="middle" fontFamily="'Instrument Serif',Georgia,serif" fontSize="21" fill="#FCFCFD">PD</text>
  </svg>
);
const Av = ({ name = "?", sz = 38 }) => (<div style={{ width: sz, height: sz, borderRadius: Math.round(sz * 0.32), background: G.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(sz * 0.34), fontWeight: 700, color: G.accent, flexShrink: 0, letterSpacing: ".01em" }}>{(name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</div>);
const VV = {
  gold: { background: G.grad, color: G.paper, fontWeight: 600, borderRadius: 12 },
  ghost: { background: "#fff", border: `1px solid ${G.border}`, color: G.text, fontWeight: 600, borderRadius: 11 },
  danger: { background: G.redSoft, border: `1px solid ${G.redLine}`, color: G.red, fontWeight: 600, borderRadius: 11 },
  green: { background: G.greenSoft, border: `1px solid ${G.greenLine}`, color: G.green, fontWeight: 600, borderRadius: 11 },
  amber: { background: G.amberSoft, border: `1px solid ${G.amberLine}`, color: G.amber, fontWeight: 600, borderRadius: 11 },
  blue: { background: G.accentSoft, border: `1px solid ${G.accentLine}`, color: G.accent, fontWeight: 600, borderRadius: 11 },
};
const Btn = ({ ch, v = "gold", onClick, full, sx = {} }) => (<button className="btn" onClick={onClick} style={{ padding: "9px 14px", fontSize: 13, fontWeight: 600, width: full ? "100%" : undefined, ...VV[v], ...sx }}>{ch}</button>);
// A system's days for a particular client.
//
// A programme is authored for a number of days a week. Run at a different
// number it stops being that programme: three days done twice a week reaches
// some muscles once every ten days, which is under the benchmark the audit
// already caught PPL and Full Body failing. So a system may carry variants,
// and the client's own days_per_week picks one.
//
// Variants are AUTHORED, never derived. Deciding which exercise goes on which
// day is programming, and the audit is the record of what happens when that is
// got wrong — a heavy squat and a heavy deadlift stacked on one day. Software
// repacking a clinical programme is not a thing this app does.
//
// No variant for that number → the system as written. Nothing breaks.
function daysFor(system, daysPerWeek) {
  const n = Number(daysPerWeek);
  const variant = system?.schedules && Number.isFinite(n) ? system.schedules[n] : null;
  return Array.isArray(variant) && variant.length ? variant : (system?.days || []);
}

// Resolve the system ONCE, here, with its days already matched to the client.
// Everything downstream — the list, the day picker, the player, the PDF —
// then reads `.days` and is simply right, with no idea any of this happened.
function systemFor(client) {
  const sys = WORKOUT_SYSTEMS.find(w => w.id === client?.workoutSystemId);
  if (!sys) return null;
  // Both spellings, because the admin list and the client login return the
  // client in slightly different shapes and this must not depend on which.
  const days = daysFor(sys, client?.days_per_week ?? client?.daysPerWeek);
  return days === sys.days ? sys : { ...sys, days };
}

// Every exercise a client's programme actually puts in front of them, so the
// assessment can show which of them the levels just recorded allow. Warm-up
// and cool-down are left out: those are chosen by the player at run time and
// are supported movements anyway.
function systemExerciseNames(client) {
  const sys = systemFor(client);
  if (!sys || !Array.isArray(sys.days)) return [];
  const seen = [];
  for (const day of sys.days) {
    for (const ex of day.exercises || []) {
      if (ex?.name && !seen.includes(ex.name)) seen.push(ex.name);
    }
  }
  return seen;
}

const Ovl = ({ show, close, ch, mw = 520 }) => { if (!show) return null; return (<div style={{ position: "fixed", inset: 0, background: "rgba(14,32,53,0.42)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: 16, overflowY: "auto" }} onClick={close}><div className="card" style={{ width: "100%", maxWidth: mw, padding: 22, border: `1px solid ${G.borderHi}`, marginTop: 20, marginBottom: 20 }} onClick={e => e.stopPropagation()}>{ch}</div></div>); };
// Flags are not languages: a flag names a country, and this button also has
// to work for an Arabic speaker sitting in Qatar. The word alone says it, in
// the script it switches to.
const LangBtn = ({ lang, setLang }) => (
  <button className="btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}
    aria-label={lang === "en" ? "Switch to Arabic" : "Switch to English"}
    style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 44, padding: "0 16px", background: "#fff", border: `1px solid ${G.border}`, borderRadius: 22, color: G.text, fontSize: 13, fontWeight: 600 }}>
    {lang === "en" ? "العربية" : "English"}
  </button>);
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
          <div className="sf" style={{ fontSize: 26, lineHeight: 1, color: G.text }}>{tdee}</div>
          <div style={{ fontSize: 10, color: G.muted }}>kcal</div>
        </div>
        <div style={{ flex: 1, background: G.surf2, borderRadius: 10, padding: "10px 12px", border: `1px solid ${G.accentLine}` }}>
          <div style={{ fontSize: 9, color: G.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{t.target}</div>
          <div className="sf" style={{ fontSize: 26, lineHeight: 1, color: G.text }}>{target}</div>
          <div style={{ fontSize: 10, color: surplus > 0 ? G.green : G.red }}>{surplus > 0 ? "+" : ""}{surplus} kcal</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 10 }}>
        {/* Six figures in five colours is a chart, not a card: nothing can be
            ranked, so nothing stands out. Only the surplus keeps a colour,
            because only it carries a judgement. */}
        {[{ l: "Protein", v: `${protein}g` }, { l: "Carbs", v: `${carbs}g` }, { l: "Fat", v: `${fat}g` }].map(x => (
          <div key={x.l} style={{ background: G.surf2, borderRadius: 7, padding: 8, textAlign: "center" }}>
            <div className="sf" style={{ fontSize: 19, lineHeight: 1, color: G.text }}>{x.v}</div>
            <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>{x.l}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: G.muted }}>{isAr ? pal.ar : pal.en}</div>
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

// ── EXERCISE METADATA ──────────────────────────────────────
// Explicit muscle + equipment tags, keyed by exercise name.
//
// The keyword guesser below used to be the ONLY source of muscle tags. It
// labelled anything it did not recognise as "Full Body" (e.g. Straight Leg
// Raises, Clamshells, Wall Sit), and because of rule ordering it tagged
// "Leg Curl" as Biceps and "Leg Extension" as Triceps. It is now only a
// fallback for names not listed here.
//
// These move onto the exercise objects when the schema is widened; keeping
// them in one table for now avoids touching all 215 entries at once.
// EXERCISE_META and getExerciseEquipment now live in ./exerciseMeta.js — the
// workout player needs the same table to know whether an exercise is loaded.
import { EXERCISE_META, getExerciseEquipment, getExerciseRequirement } from "./exerciseMeta";
import { meetsRequirement, blockedBy } from "./assessment";
import { AssessmentForm } from "./AssessmentForm";
import { AssessmentProgress } from "./AssessmentProgress";

function getMuscleTargets(name) {
  const m = EXERCISE_META[name];
  if (m) {
    return [
      ...m.p.map((x) => [x, "primary"]),
      ...m.s.map((x) => [x, "secondary"]),
    ];
  }

  // Fallback for anything not in the table above.
  const l = (name || "").toLowerCase();
  // Specific leg rules MUST stay above the generic curl/extension/press rules,
  // otherwise "Leg Curl" matches "curl" and "Leg Extension" matches "extension".
  if (l.includes("leg curl")) return [["Hamstrings", "primary"]];
  if (l.includes("leg extension")) return [["Quads", "primary"]];
  if (l.includes("leg press")) return [["Quads", "primary"], ["Glutes", "secondary"]];
  if (l.includes("squat") || l.includes("goblet") || l.includes("hack")) return [["Quads", "primary"], ["Glutes", "secondary"], ["Hamstrings", "secondary"]];
  if (l.includes("deadlift") || l.includes("rdl")) return [["Lower Back", "primary"], ["Glutes", "primary"], ["Hamstrings", "secondary"]];
  if (l.includes("bench") || l.includes("push-up") || l.includes("pushup") || l.includes("chest") || l.includes("fly") || l.includes("incline")) return [["Chest", "primary"], ["Triceps", "secondary"], ["Shoulders", "secondary"]];
  if (l.includes("pull-up") || l.includes("pullup") || l.includes("chin") || l.includes("lat")) return [["Lats", "primary"], ["Biceps", "secondary"], ["Core", "secondary"]];
  if (l.includes("row")) return [["Mid Back", "primary"], ["Biceps", "secondary"], ["Rear Delt", "secondary"]];
  if (l.includes("press") && (l.includes("over") || l.includes("shoulder") || l.includes("military") || l.includes("arnold"))) return [["Delts", "primary"], ["Triceps", "secondary"], ["Core", "secondary"]];
  if (l.includes("lunge") || l.includes("step")) return [["Quads", "primary"], ["Glutes", "secondary"], ["Balance", "secondary"]];
  if (l.includes("plank") || l.includes("bird") || l.includes("dead bug") || l.includes("ab wheel")) return [["Core", "primary"], ["Stabilizers", "secondary"]];
  if (l.includes("lateral raise")) return [["Side Delts", "primary"], ["Traps", "secondary"]];
  if (l.includes("face pull")) return [["Rear Delts", "primary"], ["Rotator Cuff", "secondary"]];
  if (l.includes("curl") || l.includes("bicep")) return [["Biceps", "primary"], ["Forearms", "secondary"]];
  if (l.includes("tricep") || l.includes("extension") || l.includes("pushdown") || l.includes("skull") || l.includes("dip")) return [["Triceps", "primary"], ["Chest", "secondary"]];
  if (l.includes("calf")) return [["Calves", "primary"]];
  if (l.includes("glute") || l.includes("hip thrust")) return [["Glutes", "primary"], ["Hamstrings", "secondary"]];
  if (l.includes("stretch") || l.includes("rotation") || l.includes("circle") || l.includes("swing")) return [["Mobility", "primary"]];
  return [["Full Body", "primary"]];
}

const VB = "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-videos/";
const VM_LIST = [["side plank",null],["plank shoulder",null],["wall push",null],["incline push","incline_pushups.mp4.mp4"],["push-up","pushups.mp4.mp4"],["pushup","pushups.mp4.mp4"],["push up","pushups.mp4.mp4"],["plank","plank.mp4.mp4"],["mountain climber","mountain_climbers.mp4.mp4"],["bicycle crunch","bicycle_crunches.mp4.mp4"],["dead bug","dead_bug.mp4.mp4"],["bird dog","bird_dog.mp4.mp4"],["superman","superman_hold.mp4.mp4"],["glute bridge","glute_bridges.mp4.mp4"],["bodyweight squat","bodyweight_squats.mp4.mp4"],["air squat","bodyweight_squats.mp4.mp4"],["jumping jack","jumping_jacks.mp4.mp4"],["arm swing","arm_swings.mp4.mp4"],["leg swing","leg_swings.mp4.mp4"],["hip circle","hip_circles.mp4.mp4"],["hip flexor","hip_flexor_stretch.mp4.mp4"],["knee circle","knee_circles.mp4.mp4"],["neck rotation","neck_rotations.mp4.mp4"],["shoulder rotation","shoulder_rotations.mp4.mp4"],["torso rotation","torso_rotations.mp4.mp4"],["chest stretch","chest_stretch.mp4.mp4"],["shoulder stretch","shoulder_stretch.mp4.mp4"],["quad stretch","standing_quad_stretch.mp4.mp4"],["hamstring stretch","hamstring_stretch.mp4.mp4"],["child","childs_pose.mp4.mp4"],["light jog","light_jog_in_place.mp4.mp4"],["light walk","light_walk_in_place.mp4.mp4"]];
const getVideoForExercise = (name) => { const n = (name||"").toLowerCase(); for (const [k,v] of VM_LIST) { if (n.includes(k)) return v ? VB+v : null; } return null; };
function ExerciseCard({ exercise, color, lang }) {
  const isAr = lang === "ar";
  const muscles = getMuscleTargets(exercise.name);
  const equipment = getExerciseEquipment(exercise.name);
  const ytSearchUrl = getYTSearchUrl(exercise.name);

  return (
    <div style={{ background: G.surf2, borderRadius: 12, overflow: "hidden", border: `1px solid ${color}22` }}>
      {/* Uniform animation area — same dark bg, same size for all */}
      <div style={{ background: G.soft, padding: "14px 8px 6px", display: "flex", flexDirection: "column", alignItems: "center", minHeight: 155 }}>
        {(() => { const vid = getVideoForExercise(exercise.name); return vid ? (
          <video src={vid} autoPlay loop muted playsInline style={{ width: "100%", aspectRatio: "9/16", objectFit: "cover", borderRadius: 10, maxHeight: 200 }} />
        ) : <ExerciseIllustration exerciseId={exercise.name} size={118} />; })()}
        {/* muscle tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center", marginTop: 7 }}>
          {muscles.map(([m, type], i) => (
            <span key={i} style={{
              fontSize: 9, padding: "2px 7px", borderRadius: 20,
              background: type === "primary" ? G.accentSoft : G.soft,
              color: type === "primary" ? G.accent : G.muted,
              fontWeight: type === "primary" ? 700 : 500,
              border: `1px solid ${type === "primary" ? G.accentLine : G.border}`
            }}>{m}</span>
          ))}
        </div>
      </div>
      {/* Info */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: G.text, marginBottom: 7, textAlign: "center", lineHeight: 1.3 }}>
          {exercise.name}
        </div>
        {equipment.length > 0 && (
          <div style={{ fontSize: 9.5, color: G.muted, textAlign: "center", marginTop: -3, marginBottom: 7, letterSpacing: 0.3 }}>
            {equipment.join(" · ")}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginBottom: 8 }}>
          {[
            // Sets, reps and rest were three different colours, as if one of
            // them were a warning. They are three facts of equal weight; the
            // label under each is what tells them apart.
            { l: isAr ? "مجموعات" : "Sets", v: exercise.sets },
            { l: isAr ? "تكرار" : "Reps", v: exercise.reps },
            { l: isAr ? "راحة" : "Rest", v: exercise.rest },
          ].map(x => (
            <div key={x.l} style={{ background: G.soft, borderRadius: 8, padding: "6px 3px", textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{x.v}</div>
              <div style={{ fontSize: 8.5, color: G.muted, marginTop: 2 }}>{x.l}</div>
            </div>
          ))}
        </div>
        {exercise.notes && (
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 7, lineHeight: 1.5, display: "flex", gap: 6, alignItems: "flex-start" }}><Icon n="spark" s={13} c={G.dim} sx={{ marginTop: 2 }} />{exercise.notes}</div>
        )}
        {/* YouTube link button only — no thumbnail */}

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
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
              <div style={{ fontSize: 11, color: G.muted }}>{ws.days.length} {isAr ? "أيام" : "days"}</div>
              {LEVEL_META[ws.level] && (
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, color: LEVEL_META[ws.level].color, background: `${LEVEL_META[ws.level].color}1f` }}>
                  {isAr ? LEVEL_META[ws.level].labelAr : LEVEL_META[ws.level].label}
                </span>
              )}
            </div>
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
              {LEVEL_META[ws.level]?.warn && (
                <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: `${LEVEL_META[ws.level].color}14`, border: `1px solid ${LEVEL_META[ws.level].color}45`, borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
                  <span style={{ fontSize: 14, lineHeight: 1.3 }}>⚠️</span>
                  <span style={{ fontSize: 11.5, lineHeight: 1.5, color: G.text }}>
                    {isAr ? LEVEL_META[ws.level].warnAr : LEVEL_META[ws.level].warn}
                  </span>
                </div>
              )}
              {(ws.warmup || ws.cooldown) && (
                <div style={{ fontSize: 11, color: G.muted, marginBottom: 14, fontStyle: "italic" }}>
                  {isAr ? "يستخدم هذا النظام إحماءً وتهدئة مخصصين له." : "This system uses its own warm-up and cool-down, not the standard one."}
                </div>
              )}
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
      {client && <div style={{ fontSize: 12, color: G.muted, marginBottom: 14, background: G.surf2, borderRadius: 8, padding: "7px 12px" }}>{isAr ? "الهدف لـ" : "Target for"} {client.name}: <strong style={{ color: G.gold }}>{target} kcal</strong> <span style={{ fontSize: 10, color: G.muted }}>— {isAr ? "سيتم ضبط الكميات تلقائياً" : "portions auto-adjusted to match"}</span></div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {MEALS.map(p => {
          const scaledCal = client ? Math.round(p.baseCal * Math.max(0.55, Math.min(1.8, target / p.baseCal))) : p.baseCal;
          return (
            <div key={p.id} className="card btn" onClick={() => setSel(sel === p.id ? null : p.id)}
              style={{ overflow: "hidden", border: sel === p.id ? `2px solid ${p.color}` : `1px solid ${G.border}` }}>
              <div style={{ position: "relative" }}>
                <img src={p.image} alt={p.name} style={{ width: "100%", height: 76, objectFit: "cover" }} />
                {sel === p.id && <div style={{ position: "absolute", top: 5, right: 5, background: p.color, borderRadius: 20, padding: "2px 7px", fontSize: 10, fontWeight: 700, color: "#FCFCFD" }}>✓</div>}
              </div>
              <div style={{ padding: "9px 10px 11px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{p.emoji} {isAr ? p.nameAr : p.name}</div>
                <div style={{ fontSize: 10, color: p.color, marginTop: 3, fontWeight: 700 }}>{scaledCal} kcal {client && scaledCal !== p.baseCal && <span style={{ color: G.muted, fontWeight: 400 }}>({isAr ? "مُعدّل" : "adjusted"})</span>}</div>
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
                {[{ l: "Cal", v: tot.cal, c: plan.color }, { l: "Pro", v: `${tot.p}g`, c: "#A63A3A" }, { l: "Carb", v: `${tot.c}g`, c: G.amber }, { l: "Fat", v: `${tot.f}g`, c: G.blue }].map(x => (
                  <div key={x.l} style={{ background: G.surf2, borderRadius: 7, padding: 7, textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: x.c }}>{x.v}</div>
                    <div style={{ fontSize: 9, color: G.muted, marginTop: 1 }}>{x.l}</div>
                  </div>
                ))}
              </div>
              {plan.meals.map((m, i) => {
                const mealImg = MEAL_IMAGES[rawPlan?.id]?.[m.name];
                return (
                  <div key={i} style={{ marginBottom: 10, borderRadius: 10, overflow: "hidden", border: `1px solid ${G.border}` }}>
                    {mealImg && <img src={mealImg} alt={m.name} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />}
                    <div style={{ display: "flex", gap: 10, padding: "8px 10px" }}>
                      <div style={{ width: 52, flexShrink: 0 }}>
                        <div style={{ fontSize: 10, color: plan.color, fontWeight: 700 }}>{m.time}</div>
                        <div style={{ fontSize: 9, color: G.muted }}>{isAr ? m.nameAr : m.name}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: G.text }}>{m.items}</div>
                        <div style={{ fontSize: 10, color: G.muted, marginTop: 1 }}>{m.cal} kcal · P:{m.p}g C:{m.c}g F:{m.f}g</div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
  const [showPlayer, setShowPlayer] = useState(false);
  // Which day the player was asked for. This was missing: the day picker in
  // this tab called setActiveDay and the player read activeDay, and neither
  // existed here — they belong to the top-level App component, several
  // hundred lines away. Opening the picker and choosing a day threw a
  // ReferenceError and the error boundary ate the admin screen. Found by
  // running tsc with --checkJs and grepping for TS2304, which is the only
  // thing in this toolchain that catches an undefined name.
  const [activeDay, setActiveDay] = useState(null);
  const [showDayPicker, setShowDayPicker] = useState(false);
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

  const ws = sc ? systemFor(sc) : null;

  return (
    <div className="fd" dir={isAr ? "rtl" : "ltr"}>
      <div style={{ marginBottom: 14 }}>
        <div className="sf gd" style={{ fontSize: 22, fontWeight: 700 }}>{t.plans}</div>
      </div>
      <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
        {clients.map(c => <Btn key={c.id} ch={c.name.split(" ")[0]} v={selC?.id === c.id ? "gold" : "ghost"} onClick={() => { setSelC(clients.find(x => x.id === c.id)); setEditing(null); }} sx={{ padding: "7px 13px", fontSize: 12 }} />)}
      </div>

      {!sc ? (
        <div className="card" style={{ padding: "36px 20px", textAlign: "center", color: G.muted }}>
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
                {ws && <button onClick={() => setShowDayPicker(true)} style={{ marginTop: 8, background: G.gold, color: "#FCFCFD", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>▶ Start Workout</button>}
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
              <div style={{ textAlign: "center", padding: "24px 0", color: G.muted }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
                <div style={{ fontSize: 12, marginBottom: 12 }}>{t.noPlan}</div>
                <div style={{ display: "flex", gap: 7, justifyContent: "center", flexWrap: "wrap" }}>
                  <Btn ch={t.chooseWorkout} v="gold" onClick={() => setShowWO(true)} sx={{ padding: "8px 14px", fontSize: 12 }} />
                  <Btn ch={t.writeManual} v="ghost" onClick={() => startEdit(sc, "workout")} sx={{ padding: "8px 14px", fontSize: 12 }} />
                </div>
              </div>
            )}
          </div>

          {showDayPicker && ws && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(14,32,53,0.45)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
              <div className="card" style={{ borderRadius: 18, padding: 24, width: "100%", maxWidth: 360 }}>
                <div className="sf" style={{ fontSize: 21, marginBottom: 16 }}>Select a day</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  <button onClick={() => { setActiveDay(null); setShowPlayer(true); setShowDayPicker(false); }} style={{ background: G.accentSoft, color: G.accent, border: "none", borderRadius: 10, padding: "12px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", textAlign: "left" }}>
                    Full workout — every day
                  </button>
                  {ws.days.map((day, i) => (
                    <button key={i} onClick={() => { setActiveDay(day.name); setShowPlayer(true); setShowDayPicker(false); }} style={{ background: `${ws.color}15`, color: ws.color, border: `1px solid ${ws.color}30`, borderRadius: 10, padding: "12px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", textAlign: "left" }}>
                      {day.name}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowDayPicker(false)} style={{ width: "100%", background: "#fff", color: G.text, border: "none", borderRadius: 10, padding: "10px", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}
          {showPlayer && ws && (
            <WorkoutPlayer workoutSystem={ws} dayName={activeDay} client={sc} onClose={() => { setShowPlayer(false); setActiveDay(null); }} accentColor={G.nAccent} />
          )}

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
              <div style={{ textAlign: "center", padding: "24px 0", color: G.muted }}>
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
// ── HEALTH SCREENING (client answers it themselves) ────────
//
// PAR-Q+ was designed to be self-administered — that is what makes it usable
// at all. Seven clients predate the signup flow and were never screened, and
// asking each of them once, at their own login, closes that without the
// trainer having to chase anybody.
//
// The workout is blocked until this is done. That is not a technicality: the
// whole point of a pre-participation questionnaire is that it comes BEFORE
// participation. A screening that can be skipped is decoration.
function ScreeningCard({ client, isAr, onAnswered }) {
  const st = screeningState(client);
  const wantIntake = needsIntake(client);
  const [answers, setAnswers] = useState({});
  const [intake, setIntake] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);

  if (!st.blocked) return null;

  // Already answered, something was flagged, nobody has cleared it yet.
  if (!st.needed) {
    return (
      <div className="card" style={{ padding: "16px 16px", marginBottom: 14, border: `1px solid ${G.amber}`, background: "#FBF2E3" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.amber }}>
          {isAr ? "تحدث مع مدربك أولاً" : "Speak to your trainer first"}
        </div>
        <div style={{ fontSize: 12.5, color: G.text, marginTop: 8, lineHeight: 1.7 }}>
          {isAr
            ? "بناءً على إجاباتك، من الأفضل التحدث مع رافي — ومع طبيبك إن لزم — قبل الجلسة القادمة. خطتك موجودة هنا في انتظارك."
            : "From your answers, it is worth speaking to Rafi — and to your doctor if he suggests it — before your next session. Your plan is here waiting; nothing has been taken away."}
        </div>
        <a href={`https://wa.me/${TRAINER.whatsapp}`} target="_blank" rel="noreferrer"
          style={{ display: "inline-block", marginTop: 12, padding: "11px 16px", borderRadius: 10, background: "#E6F2ED", border: `1px solid ${G.green}`, color: G.green, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          <Icon n="whatsapp" s={15} /> {isAr ? "راسل رافي" : "Message Rafi"}
        </a>
      </div>
    );
  }

  const allAnswered =
    PARQ.every(q => answers[q.id] === true || answers[q.id] === false) &&
    (!wantIntake || INTAKE_QUESTIONS.every(q => !!intake[q.id]));

  const submit = async () => {
    setErr(""); setBusy(true);
    try {
      const d = await clientPost({
        action: "parq.submit",
        answers,
        ...(wantIntake ? { intake: { ...intake, daysPerWeek: Number(intake.daysPerWeek) } } : {}),
      });
      onAnswered?.(d);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div className="card" style={{ padding: "16px", marginBottom: 14, border: `1px solid ${G.borderHi}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.gold }}>
          <Icon n="heart" s={15} /> {isAr ? "فحص صحي قصير" : "One health check first"}
        </div>
        <div style={{ fontSize: 12.5, color: G.text, marginTop: 8, lineHeight: 1.7 }}>
          {isAr
            ? (wantIntake
                ? "اثنا عشر سؤالاً، أقل من دقيقتين. هذه هي الأسئلة القياسية التي يطرحها أي مدرب قبل التدريب — ولم نسألك إياها من قبل."
                : "ثمانية أسئلة، أقل من دقيقة. هذه هي الأسئلة القياسية التي يطرحها أي مدرب قبل التدريب — ولم نسألك إياها من قبل.")
            : (wantIntake
                ? "Twelve questions, under two minutes. Four about how you train and eight about your health — the standard questions any trainer asks before training somebody, and we never asked you them."
                : "Eight questions, under a minute. These are the standard questions any trainer asks before training somebody, and we never asked you them.")}
        </div>
        <button type="button" className="btn" onClick={() => setOpen(true)}
          style={{ width: "100%", marginTop: 14, padding: "13px", borderRadius: 10, background: G.grad, color: "#FCFCFD", fontWeight: 700, fontSize: 14 }}>
          {isAr ? "لنبدأ" : "Answer them now"}
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "16px", marginBottom: 14, border: `1px solid ${G.borderHi}` }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: G.gold }}>
        <Icon n="heart" s={14} /> {isAr ? "فحص صحي" : "Health check"}
      </div>
      <div style={{ fontSize: 12, color: G.muted, marginTop: 6, marginBottom: 12, lineHeight: 1.6 }}>
        {isAr
          ? "أجب بصدق. \"نعم\" لا تعني التوقف عن التدريب — تعني أن رافي يتحدث معك أولاً."
          : "Answer honestly. A yes does not mean you stop training — it means Rafi speaks to you first."}
      </div>

      {/* How they train. Asked first because it is the easy half, and because
          the app has been choosing programmes without these answers. */}
      {wantIntake && INTAKE_QUESTIONS.map(q => (
        <div key={q.id} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, color: G.text, marginBottom: 7, lineHeight: 1.5 }}>{isAr ? q.ar : q.en}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {q.opts.map(o => {
              const on = intake[q.id] === o.id;
              return (
                <button key={o.id} type="button" className="btn"
                  onClick={() => setIntake(p => ({ ...p, [q.id]: o.id }))}
                  style={{
                    padding: "10px 13px", borderRadius: 9, fontSize: 12, fontWeight: 700, minHeight: 42,
                    background: on ? "#E8EEF8" : G.surf2,
                    color: on ? G.gold : G.muted,
                    border: `1px solid ${on ? G.borderHi : G.border}`,
                  }}>{isAr ? o.ar : o.en}</button>
              );
            })}
          </div>
        </div>
      ))}
      {wantIntake && intake.limitation && intake.limitation !== "none" && (
        <div style={{ fontSize: 11.5, color: G.blue, background: "#E8EEF8", border: `1px solid #D3E0F2`, borderRadius: 9, padding: "10px 12px", marginBottom: 14, lineHeight: 1.6 }}>
          {isAr
            ? "سيراجع رافي هذا معك. لن يتوقف تدريبك."
            : "Rafi will look at this with you. It does not stop your training."}
        </div>
      )}
      {wantIntake && (
        <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.4, textTransform: "uppercase", fontWeight: 700, margin: "18px 0 4px" }}>
          {isAr ? "الصحة" : "Health"}
        </div>
      )}

      {PARQ.map(q => {
        const v = answers[q.id];
        return (
          <div key={q.id} className="parq-row" style={{ padding: "11px 0", borderBottom: `1px solid ${G.border}` }}>
            <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.55, color: v === true ? G.amber : G.text }}>{isAr ? q.ar : q.en}</div>
            <div className="parq-btns">
              {[[isAr ? "لا" : "No", false], [isAr ? "نعم" : "Yes", true]].map(([label, val]) => (
                <button key={String(val)} type="button" className="btn parq-btn"
                  onClick={() => setAnswers(p => ({ ...p, [q.id]: val }))}
                  style={{
                    background: v === val ? (val ? G.amber : G.green) : G.surf2,
                    color: v === val ? G.paper : G.muted,
                    border: `1px solid ${v === val ? "transparent" : G.border}`,
                  }}>{label}</button>
              ))}
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 11, color: G.muted, marginTop: 12, lineHeight: 1.65 }}>
        {isAr
          ? "بالمتابعة تؤكد أن هذه الإجابات صحيحة، وتفهم أن هذا تدريب لياقة وليس علاجاً طبياً."
          : "By continuing you confirm these answers are accurate, and understand this is fitness coaching, not medical treatment."}
      </div>
      {err && <div style={{ color: G.red, fontSize: 12.5, marginTop: 10 }}>{err}</div>}
      <button type="button" className="btn" onClick={submit} disabled={!allAnswered || busy}
        style={{ width: "100%", marginTop: 14, padding: "13px", borderRadius: 10, fontWeight: 700, fontSize: 14,
                 background: allAnswered ? G.grad : G.surf2, color: allAnswered ? "#FCFCFD" : G.dim }}>
        {busy ? "…" : (isAr ? "حفظ" : "Save answers")}
      </button>
      {!allAnswered && (
        <div style={{ fontSize: 11, color: G.muted, textAlign: "center", marginTop: 8 }}>
          {isAr ? "أجب على كل الأسئلة" : "Answer every question"}
        </div>
      )}
    </div>
  );
}

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
  // Uploads can now fail for reasons a person needs to hear about — an expired
  // session, a photo that will not decode, the daily cap. Swallowing those
  // into console.error left the screen looking like nothing had happened.
  const [photoErr, setPhotoErr] = useState("");
  // Which photo is mid-delete, so its own button can say so rather than the
  // whole grid going quiet.
  const [deletingId, setDeletingId] = useState(null);
  const fileRef = useCallback(node => {}, []);

  useEffect(() => {
    if (!client?.id) return;
    dbGetPhotos()
      .then(p => setPhotos(p))
      .catch(e => setPhotoErr(e.message))
      .finally(() => setLoadingPhotos(false));
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
    setPhotoErr("");
    // Update weight in progress array
    if (newWeight) {
      const entry = { date: new Date().toISOString().split("T")[0], weight: +newWeight };
      const updatedProgress = [...(client.progress || []), entry];
      const updated = { ...client, weight: +newWeight, progress: updatedProgress };
      await dbUpdateClient(updated);
      setClients(p => p.map(c => c.id === client.id ? updated : c));
    }
    // Upload photo. Resized in the browser and posted to /api/client-data,
    // which stores it under this client's id — taken from the session token.
    if (newFile) {
      try {
        const photo = await dbAddPhoto(newFile, newWeight, newNotes);
        if (photo) setPhotos(p => [photo, ...p]);
      } catch (e) {
        setPhotoErr(e.message);
        setUploading(false);
        return;   // keep the form open with what they typed still in it
      }
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
          <div style={{ fontSize: 13, fontWeight: 700, color: G.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}><Icon n="bars" s={15} c={G.accent} />{isAr ? "تحديث التقدم" : "Log Progress"}</div>
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
            <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{isAr ? "صورة التقدم" : "Progress Photo"}</div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: G.surf2, border: `1px dashed ${G.border}`, borderRadius: 10, cursor: "pointer" }}>
              <Icon n="camera" s={22} c={G.dim} />
              <span style={{ fontSize: 13, color: G.muted }}>{newFile ? newFile.name : (isAr ? "اضغط لاختيار صورة" : "Tap to choose photo")}</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
            </label>
            {previewUrl && <img src={previewUrl} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10, marginTop: 8 }} />}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn ch={uploading ? "…" : (isAr ? "حفظ" : "Save")} v="gold" onClick={addEntry} sx={{ flex: 1, padding: "11px", fontSize: 13 }} />
            <Btn ch={isAr ? "إلغاء" : "Cancel"} v="ghost" onClick={() => { setShowAdd(false); setNewFile(null); setPreviewUrl(null); }} sx={{ padding: "11px 16px" }} />
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
        {photoErr && (
          <div className="card" style={{ padding: "10px 12px", marginBottom: 10, border: `1px solid ${G.red}`, color: G.red, fontSize: 12 }}>
            {photoErr}
          </div>
        )}
        {loadingPhotos ? (
          <div style={{ textAlign: "center", padding: 20 }}><div className="sp" style={{ margin: "0 auto" }} /></div>
        ) : photos.length === 0 ? (
          <div className="card" style={{ padding: "24px 16px", textAlign: "center", color: G.muted }}>
            <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}><Icon n="camera" s={26} c={G.dim} /></div>
            <div style={{ fontSize: 12 }}>{isAr ? "لا توجد صور بعد" : "No photos yet"}</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {photos.map(ph => (
              <div key={ph.id} className="card" style={{ overflow: "hidden", position: "relative" }}>
                <img src={ph.photo_url} alt="progress" style={{ width: "100%", height: 160, objectFit: "cover" }} />
                {/* A progress photo is the most personal thing in this app.
                    Deleting one has worked on the server since the lockdown,
                    but there was no way to ask for it — so a person could put a
                    photo of their own body in and never take it out again. */}
                <button
                  type="button"
                  aria-label={isAr ? "حذف الصورة" : "Delete photo"}
                  disabled={deletingId === ph.id}
                  onClick={async () => {
                    const ask = isAr
                      ? "حذف هذه الصورة نهائياً؟ لا يمكن التراجع."
                      : "Delete this photo? This cannot be undone.";
                    if (!window.confirm(ask)) return;
                    setPhotoErr("");
                    setDeletingId(ph.id);
                    try {
                      await dbDeletePhoto(ph.id);
                      setPhotos(p => p.filter(x => x.id !== ph.id));
                    } catch (e) {
                      setPhotoErr(e.message);
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                  style={{
                    position: "absolute", top: 6, right: 6, width: 28, height: 28,
                    borderRadius: 8, cursor: "pointer", fontSize: 12, lineHeight: 1,
                    background: "rgba(0,0,0,0.55)", color: "#fff",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}>
                  {deletingId === ph.id ? "…" : <Icon n="trash" s={15} />}
                </button>
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

// Where a client stands with health screening, worked out in one place so the
// card, the buttons and the wording can never disagree with each other.
//
//   needed  — never screened. Seven clients predate the signup flow.
//   flagged — reported something. NOT the same as unscreened, and it is not a
//             diagnosis either: it means a person should be spoken to before
//             they train, which is the entire purpose of PAR-Q.
//   blocked — do not start a session. Cleared by every answer being No, or by
//             the trainer recording that he has spoken to them.
function screeningState(c) {
  const answers = c?.parq_answers || null;
  const flagged = answers ? Object.entries(answers).filter(([, v]) => v === true).map(([k]) => k) : [];
  const cleared = !!c?.parq_cleared_at;
  return {
    needed: !answers,
    flagged,
    cleared,
    blocked: !answers || (flagged.length > 0 && !cleared),
  };
}

// The four intake answers, in one place, because two screens ask for them: the
// register page for a new person, and the health-check card for the clients
// who predate that page. The ids must match api/_lib/assign.js — the server
// validates against the same lists and the assignment rules read them.
const INTAKE_QUESTIONS = [
  {
    id: "experience",
    en: "How long have you been training?", ar: "خبرتك في التدريب",
    opts: [
      { id: "beginner", en: "New to it (under 6 months)", ar: "مبتدئ (أقل من 6 أشهر)" },
      { id: "intermediate", en: "6 months to 2 years", ar: "متوسط (6 أشهر - سنتان)" },
      { id: "advanced", en: "Over 2 years, consistently", ar: "متقدم (أكثر من سنتين)" },
    ],
  },
  {
    id: "daysPerWeek",
    en: "How many days a week can you train?", ar: "كم يوماً في الأسبوع؟",
    opts: ["2", "3", "4", "5", "6"].map(n => ({ id: n, en: n, ar: n })),
  },
  {
    id: "equipment",
    en: "What do you have access to?", ar: "ما المتاح لديك؟",
    opts: [
      { id: "full_gym", en: "A full gym", ar: "صالة رياضية كاملة" },
      { id: "home_basic", en: "Dumbbells / bands at home", ar: "دمبل وأحزمة في المنزل" },
      { id: "none", en: "Nothing — bodyweight only", ar: "لا شيء — وزن الجسم فقط" },
    ],
  },
  {
    id: "limitation",
    en: "Any ongoing pain anywhere?", ar: "هل لديك ألم مستمر في مكان ما؟",
    opts: [
      { id: "none", en: "No", ar: "لا" },
      { id: "knee", en: "Knee", ar: "الركبة" },
      { id: "back", en: "Lower back", ar: "أسفل الظهر" },
      { id: "shoulder", en: "Shoulder", ar: "الكتف" },
    ],
  },
];

// Missing intake, for a client who predates the register page. Not blocking on
// its own — it is asked in the same breath as the health check because the two
// are one conversation, and because catching somebody twice is how you get
// answered once.
function needsIntake(c) {
  return !c?.experience || !c?.equipment || !c?.limitation;
}

// PAR-Q+ ids must match api/_lib/assign.js — the server screens on these.
const PARQ = [
  { id: "heart",     en: "Has a doctor ever said you have a heart condition, or that you should only exercise under medical supervision?", ar: "هل قال لك طبيب إن لديك مشكلة في القلب أو أنه يجب أن تتمرن تحت إشراف طبي؟" },
  { id: "chestPain", en: "Do you get chest pain during physical activity, or have you had chest pain at rest in the last month?", ar: "هل تشعر بألم في الصدر أثناء النشاط البدني أو أثناء الراحة خلال الشهر الماضي؟" },
  { id: "dizzy",     en: "Do you lose balance from dizziness, or have you fainted in the last 12 months?", ar: "هل تفقد توازنك بسبب الدوخة أو فقدت الوعي خلال 12 شهراً؟" },
  { id: "bonejoint", en: "Do you have a bone or joint problem that could get worse with exercise?", ar: "هل لديك مشكلة في العظام أو المفاصل قد تسوء بالتمرين؟" },
  { id: "bp",        en: "Are you taking medication for blood pressure or a heart condition?", ar: "هل تتناول أدوية لضغط الدم أو القلب؟" },
  { id: "pregnancy", en: "Are you pregnant, or have you given birth in the last 6 months?", ar: "هل أنتِ حامل أو ولدتِ خلال الأشهر الستة الماضية؟" },
  { id: "surgery",   en: "Have you had surgery in the last 6 months?", ar: "هل أجريت عملية جراحية خلال الأشهر الستة الماضية؟" },
  { id: "other",     en: "Is there any other reason you should not do physical activity?", ar: "هل هناك أي سبب آخر يمنعك من ممارسة النشاط البدني؟" },
];

// Short forms of the same questions, for the trainer's screen. A registration
// is only waiting there because the app REFUSED to hand out a programme — the
// reason it refused is the one thing that screen must not hide.
const PARQ_SHORT = {
  heart: "Heart condition diagnosed",
  chestPain: "Chest pain on exertion or at rest",
  dizzy: "Dizziness or fainting",
  bonejoint: "Bone or joint problem",
  bp: "On blood pressure / heart medication",
  pregnancy: "Pregnant or gave birth in last 6 months",
  surgery: "Surgery in last 6 months",
  other: "Other reason not to exercise",
};

function YesNo({ value, onChange, isAr }) {
  const opt = (v, label, color) => (
    <button type="button" onClick={() => onChange(v)}
      style={{
        flex: 1, padding: "7px 0", fontSize: 12, fontWeight: 700, cursor: "pointer",
        borderRadius: 7, border: `1px solid ${value === v ? color : G.border}`,
        background: value === v ? `${color}22` : "transparent",
        color: value === v ? color : G.muted,
      }}>{label}</button>
  );
  return (
    <div style={{ display: "flex", gap: 6, width: 132, flexShrink: 0 }}>
      {opt(false, isAr ? "لا" : "No", G.green)}
      {opt(true, isAr ? "نعم" : "Yes", G.amber)}
    </div>
  );
}

function RegPage({ lang, setLang }) {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({
    name: "", email: "", phone: "", age: "", weight: "", height: "",
    gender: "male", goal: "Weight Loss", pal: "moderate",
    experience: "beginner", daysPerWeek: "3", equipment: "full_gym", limitation: "none",
  });
  const [parq, setParq] = useState({});
  const [country, setCountry] = useState("+974");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const t = T[lang]; const isAr = lang === "ar";
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, phone: `${country} ${f.phone}`, daysPerWeek: +f.daysPerWeek, parq }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(d.error || "Something went wrong. Try again."); return; }
      setResult(d);
    } catch {
      setErr("Could not reach the server. Check your connection and try again.");
    } finally { setBusy(false); }
  };

  const shell = (children) => (
    <div style={{ minHeight: "100vh", background: G.bg, padding: 20 }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><LangBtn lang={lang} setLang={setLang} /></div>
        <div style={{ textAlign: "center", padding: "16px 0 18px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Logo s={44} /></div>
          <div className="sf gd" style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>{t.appName}</div>
        </div>
        <div dir={isAr ? "rtl" : "ltr"}>{children}</div>
      </div>
    </div>
  );

  // ── Done: account created, plan already assigned ───────────
  if (result && result.status === "ready") return shell(
    <div className="card" style={{ padding: "30px 22px", border: `1px solid ${G.borderHi}` }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><div style={{ width: 56, height: 56, borderRadius: 18, background: G.greenSoft, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon n="check" s={26} c={G.green} /></div></div>
      <div className="sf gd" style={{ fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>
        {isAr ? "حسابك جاهز" : "You're in"}
      </div>
      <div style={{ fontSize: 13, color: G.muted, textAlign: "center", lineHeight: 1.7, marginBottom: 20 }}>
        {isAr ? "خطتك التدريبية جاهزة بالفعل. احفظ كلمة المرور هذه — لن تظهر مرة أخرى."
              : "Your training plan is already waiting. Save this password — it will not be shown again."}
      </div>
      {[[isAr ? "البريد" : "Email", result.email], [isAr ? "كلمة المرور" : "Password", result.password]].map(([k, v]) => (
        <div key={k} style={{ background: "#F3F6FA", border: `1px solid ${G.border}`, borderRadius: 10, padding: "11px 13px", marginBottom: 9 }}>
          <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: G.text, wordBreak: "break-all" }}>{v}</div>
            <button onClick={() => navigator.clipboard.writeText(v)} className="btn"
              style={{ flexShrink: 0, background: G.accentSoft, border: `1px solid ${G.accentLine}`, borderRadius: 7, padding: "6px 12px", color: G.accent, fontSize: 12, fontWeight: 600 }}>
              <Icon n="copy" s={14} /> {isAr ? "نسخ" : "Copy"}
            </button>
          </div>
        </div>
      ))}
      {result.needsReview && (
        <div style={{ fontSize: 12, color: G.amber, background: "#FBF2E3", border: "1px solid #EFE0C2", borderRadius: 9, padding: "10px 12px", margin: "12px 0", lineHeight: 1.6 }}>
          <Icon n="alert" s={14} sx={{ display: "inline-block", verticalAlign: "-2px", marginInlineEnd: 6 }} />{isAr ? "سيتواصل معك أحد مدربينا للتأكد من أن هذه الخطة مناسبة لك." : "One of our coaches will check in to make sure this plan suits you."}
        </div>
      )}
      <Btn ch={isAr ? "تسجيل الدخول" : "Sign in →"} v="gold" full onClick={() => { window.location.href = "/"; }} sx={{ padding: "13px", fontSize: 14, marginTop: 10 }} />
    </div>
  );

  // ── Done: this one needs the trainer, not the app ──────────
  if (result) return shell(
    <div className="card" style={{ padding: "32px 22px", textAlign: "center", border: `1px solid ${G.borderHi}` }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><Logo s={52} /></div>
      <div className="sf gd" style={{ fontSize: 19, fontWeight: 700, marginBottom: 10 }}>
        {isAr ? "شكراً لك" : "Thanks — got it"}
      </div>
      <div style={{ fontSize: 14, color: G.muted, lineHeight: 1.8 }}>{result.message}</div>
      <a href={`https://wa.me/${TRAINER.whatsapp}`} target="_blank" rel="noreferrer"
        style={{ display: "inline-block", marginTop: 18, padding: "10px 18px", background: "#E6F2ED", border: "1px solid #C9E3D8", borderRadius: 9, color: G.green, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
        <Icon n="whatsapp" s={15} /> {isAr ? "تواصل معنا" : "Message us"}
      </a>
    </div>
  );

  const dots = (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
      {[1, 2, 3].map(n => (
        <div key={n} style={{ width: step === n ? 22 : 7, height: 7, borderRadius: 4, background: n <= step ? G.gold : G.dim, transition: "width .2s" }} />
      ))}
    </div>
  );

  const nav = (back, next, nextLabel, disabled) => (
    <div style={{ display: "flex", gap: 9, marginTop: 18 }}>
      {back && <Btn ch={isAr ? "رجوع" : "← Back"} v="ghost" onClick={back} sx={{ padding: "12px 18px", fontSize: 13 }} />}
      <div style={{ flex: 1 }}>
        <Btn ch={nextLabel} v="gold" full onClick={next} sx={{ padding: "12px", fontSize: 14, opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }} />
      </div>
    </div>
  );

  // ── Step 1: who they are ───────────────────────────────────
  if (step === 1) return shell(<>
    {dots}
    <div className="card" style={{ padding: 20, border: `1px solid ${G.borderHi}` }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: G.text, marginBottom: 14 }}>{isAr ? "عن نفسك" : "About you"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
        <div style={{ gridColumn: "1/-1" }}><FF label={`${t.fullName} *`} value={f.name} onChange={v => set("name", v)} ph="Name" /></div>
        <div style={{ gridColumn: "1/-1" }}><FF label="Email *" value={f.email} onChange={v => set("email", v)} ph="email@example.com" /></div>
        <div style={{ gridColumn: "1/-1" }}><PhoneField label={`${t.phone} *`} country={country} setCountry={setCountry} phone={f.phone} setPhone={v => set("phone", v)} /></div>
        <FF label={t.age} value={f.age} onChange={v => set("age", v)} ph="25" />
        <FF label={`${t.weight} (kg)`} value={f.weight} onChange={v => set("weight", v)} ph="70" />
        <FF label={`${t.height} (cm)`} value={f.height} onChange={v => set("height", v)} ph="170" />
        <FF label={t.gender} value={f.gender} onChange={v => set("gender", v)} opts={[{ id: "male", label: t.male }, { id: "female", label: t.female }]} />
        <div style={{ gridColumn: "1/-1" }}><FF label={t.goal} value={f.goal} onChange={v => set("goal", v)} opts={isAr ? GOALS_AR : GOALS_EN} /></div>
      </div>
      {nav(null, () => setStep(2), isAr ? "التالي" : "Next →", !f.name || !f.email || !f.phone)}
    </div>
    <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: G.muted }}>
      {t.alreadyAccount} <a href="/" style={{ color: G.gold }}>{t.loginHere}</a>
    </div>
  </>);

  // ── Step 2: how they train ─────────────────────────────────
  if (step === 2) return shell(<>
    {dots}
    <div className="card" style={{ padding: 20, border: `1px solid ${G.borderHi}` }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: G.text, marginBottom: 4 }}>{isAr ? "تدريبك" : "Your training"}</div>
      <div style={{ fontSize: 12, color: G.muted, marginBottom: 16, lineHeight: 1.6 }}>
        {isAr ? "هذه الإجابات تحدد خطتك." : "These answers decide which plan you get."}
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <FF label={isAr ? "خبرتك في التدريب" : "How long have you been training?"} value={f.experience} onChange={v => set("experience", v)}
          opts={[
            { id: "beginner", label: isAr ? "مبتدئ (أقل من 6 أشهر)" : "New to it (under 6 months)" },
            { id: "intermediate", label: isAr ? "متوسط (6 أشهر - سنتان)" : "6 months to 2 years" },
            { id: "advanced", label: isAr ? "متقدم (أكثر من سنتين)" : "Over 2 years, consistently" },
          ]} />
        <FF label={isAr ? "كم يوماً في الأسبوع؟" : "How many days a week can you train?"} value={f.daysPerWeek} onChange={v => set("daysPerWeek", v)}
          opts={[{ id: "2", label: "2" }, { id: "3", label: "3" }, { id: "4", label: "4" }, { id: "5", label: "5" }, { id: "6", label: "6" }]} />
        <FF label={isAr ? "ما المتاح لديك؟" : "What do you have access to?"} value={f.equipment} onChange={v => set("equipment", v)}
          opts={[
            { id: "full_gym", label: isAr ? "صالة رياضية كاملة" : "A full gym" },
            { id: "home_basic", label: isAr ? "دمبل وأحزمة في المنزل" : "Dumbbells / bands at home" },
            { id: "none", label: isAr ? "لا شيء — وزن الجسم فقط" : "Nothing — bodyweight only" },
          ]} />
        <FF label={isAr ? "هل لديك ألم مستمر في مكان ما؟" : "Any ongoing pain anywhere?"} value={f.limitation} onChange={v => set("limitation", v)}
          opts={[
            { id: "none", label: isAr ? "لا" : "No" },
            { id: "knee", label: isAr ? "الركبة" : "Knee" },
            { id: "back", label: isAr ? "أسفل الظهر" : "Lower back" },
            { id: "shoulder", label: isAr ? "الكتف" : "Shoulder" },
          ]} />
      </div>
      {f.limitation !== "none" && (
        <div style={{ fontSize: 12, color: G.blue, background: "#E8EEF8", border: "1px solid #D3E0F2", borderRadius: 9, padding: "10px 12px", marginTop: 12, lineHeight: 1.6 }}>
          {isAr ? "سيبني أحد مدربينا خطتك بنفسه بدلاً من أن يخمّن التطبيق." : "One of our coaches will build your plan personally rather than have the app guess — pain is not something software should be assessing."}
        </div>
      )}
      {nav(() => setStep(1), () => setStep(3), isAr ? "التالي" : "Next →", false)}
    </div>
  </>);

  // ── Step 3: PAR-Q screening ────────────────────────────────
  const answered = PARQ.every(q => parq[q.id] !== undefined);
  return shell(<>
    {dots}
    <div className="card" style={{ padding: 20, border: `1px solid ${G.borderHi}` }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: G.text, marginBottom: 4 }}>{isAr ? "استبيان السلامة" : "Health check"}</div>
      <div style={{ fontSize: 12, color: G.muted, marginBottom: 16, lineHeight: 1.6 }}>
        {isAr ? "أجب بصدق. إذا كانت إجابتك نعم على أي سؤال، سيتواصل معك رافي بدلاً من إعطائك خطة تلقائياً."
              : "Answer honestly. A yes to any of these means a coach contacts you, instead of the app handing you a plan."}
      </div>
      <div style={{ display: "grid", gap: 2 }}>
        {PARQ.map(q => (
          <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${G.border}` }}>
            <div style={{ flex: 1, fontSize: 12.5, color: G.text, lineHeight: 1.55 }}>{isAr ? q.ar : q.en}</div>
            <YesNo value={parq[q.id]} onChange={v => setParq(p => ({ ...p, [q.id]: v }))} isAr={isAr} />
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: G.muted, marginTop: 14, lineHeight: 1.65 }}>
        {isAr ? "بالمتابعة، أنت تؤكد أن هذه الإجابات صحيحة، وتفهم أن هذا تدريب لياقة وليس علاجاً طبياً."
              : "By continuing you confirm these answers are accurate, and understand this is fitness coaching, not medical treatment."}
      </div>
      {err && <div style={{ color: G.red, fontSize: 13, marginTop: 12, textAlign: "center" }}>{err}</div>}
      {nav(() => setStep(2), submit, busy ? "…" : (isAr ? "أنشئ حسابي" : "Create my account"), !answered || busy)}
      {!answered && (
        <div style={{ fontSize: 11, color: G.muted, textAlign: "center", marginTop: 8 }}>
          {isAr ? "أجب على كل الأسئلة للمتابعة" : "Answer every question to continue"}
        </div>
      )}
    </div>
  </>);
}

// ── MAIN APP ───────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState(() => ld(LK, "en"));
  const [clients, setClients] = useState([]);
  const [regs, setRegs] = useState([]);
  // Starts false: nothing is fetched at mount any more. The login screen must
  // render immediately — the admin data load flips this while it runs.
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState(() => {
    try { return sessionStorage.getItem("pd_screen") || "login"; } catch { return "login"; }
  });
  const [curUser, setCurUser] = useState(() => {
    try { const u = sessionStorage.getItem("pd_user"); return u ? JSON.parse(u) : null; } catch { return null; }
  });
  const [lf, setLf] = useState({ u: "", p: "" });
  const [lErr, setLErr] = useState("");
  const [lBusy, setLBusy] = useState(false);
  const [aTab, setATab] = useState("dashboard");
  const [cTab, setCTab] = useState("profile");
  // The client's finished sessions, used to say where they are in the block.
  // Fetched once here rather than inside the Train tab so switching tabs does
  // not re-hit the endpoint, and so the number is already there when the tab
  // opens instead of appearing a moment later.
  const [clientLogs, setClientLogs] = useState([]);
  const [lastAssessedAt, setLastAssessedAt] = useState(null);
  const [showClientPlayer, setShowClientPlayer] = useState(false);
  const [showClientDayPicker, setShowClientDayPicker] = useState(false);
  const [activeDay, setActiveDay] = useState(null);
  const [selC, setSelC] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  // The client currently being assessed. Null when the overlay is closed.
  const [assessC, setAssessC] = useState(null);
  // Which half of the assessment overlay is showing. Progress is the
  // default: a number taken without looking at the last one is not
  // progression, it is just a number.
  const [assessTab, setAssessTab] = useState("progress");
  const [editC, setEditC] = useState(null);
  const [notesDraft, setNotesDraft] = useState({});
  const [showShare, setShowShare] = useState(false);
  const [shareD, setShareD] = useState(null);
  const [resettingId, setResettingId] = useState(null);
  const blank = { name: "", email: "", password: "", age: "", weight: "", height: "", gender: "male", goal: "Weight Loss", pal: "moderate", phone: "", dob: "" };
  const [form, setForm] = useState(blank);
  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const [addCountry, setAddCountry] = useState("+974");
  const [editCountry, setEditCountry] = useState("+974");

  const t = T[lang]; const isAr = lang === "ar";

  // Load the trainer's data whenever the admin screen is entered — on sign-in,
  // and again on a refresh that restores an admin session.
  //
  // This deliberately keys off `screen` rather than running once on mount. At
  // mount nobody is signed in yet, so a mount-only fetch would have no admin
  // token to send and the list would sit empty until a manual reload.
  //
  // A signed-in client never reaches this: their portal runs off their own
  // record, and the server would refuse the request anyway.
  useEffect(() => {
    if (screen !== "admin") return;
    let cancelled = false;
    const load = async () => {
      if (!adminToken()) return;
      setLoading(true);
      const [cls, rgs] = await Promise.all([dbGetClients(), dbGetRegs()]);
      if (cancelled) return;
      if (cls) setClients(cls); else setClients(ld(SK, DEMO));
      if (rgs) setRegs(rgs); else setRegs(ld(RK, []));
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [screen]);

  // Pull the list again after something outside this file changed a client —
  // saving an assessment writes parq_answers and needs_review, and the card
  // should reflect that immediately rather than at the next screen change.
  const reloadClients = useCallback(async () => {
    const cls = await dbGetClients();
    if (cls) setClients(cls);
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

  // The signed-in client's finished sessions. Only fetched for a client — the
  // admin screens have their own history view and this endpoint scopes to
  // whoever the token says is signed in, so it would return Rafi's own.
  useEffect(() => {
    let cancelled = false;
    if (screen !== "client" || !curUser?.id) { setClientLogs([]); return; }
    Promise.all([
      clientPost({ action: "logs.list" }),
      clientPost({ action: "assessment.last" }),
    ])
      .then(([l, a]) => {
        if (cancelled) return;
        setClientLogs(Array.isArray(l.logs) ? l.logs : []);
        setLastAssessedAt(a?.assessed_at || null);
      })
      // A missing session count is not worth interrupting anybody for: the
      // card simply does not appear.
      .catch(e => console.error("programme position:", e.message || e));
    return () => { cancelled = true; };
  }, [screen, curUser?.id]);

  if (window.location.pathname === "/register") {
    return <RegPage lang={lang} setLang={setLang} />;
  }

  // Client credentials are verified on the server (/api/client-login) against a
  // scrypt hash. They are never compared in the browser, and the clients table
  // is no longer needed on this screen to sign someone in.
  const login = async () => {
    setLErr("");
    if (lBusy) return;
    setLBusy(true);
    try {
      // Try the admin endpoint first. A failure here is not an error — it just
      // means these are not the admin credentials, so fall through to a client
      // login. Neither password is ever compared in the browser.
      const ar = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: lf.u, password: lf.p }),
      });
      if (ar.ok) {
        const ad = await ar.json().catch(() => ({}));
        try { sessionStorage.setItem("pd_admin_token", ad.token || ""); } catch {}
        setCurUser({ name: TRAINER.name });
        setScreen("admin");
        return;
      }
      // 500 = misconfigured server, 429 = rate limited. Both are real answers
      // and must be shown. Falling through to the client endpoint would tell
      // the admin "invalid email or password", which is simply untrue.
      if (ar.status === 500 || ar.status === 429) {
        const ad = await ar.json().catch(() => ({}));
        setLErr(ad.error || t.invalidCredentials);
        return;
      }

      const r = await fetch("/api/client-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lf.u, password: lf.p }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.client) { setLErr(d.error || t.invalidCredentials); return; }
      try { sessionStorage.setItem("pd_token", d.token || ""); } catch {}
      setCurUser(d.client);
      setScreen("client");
    } catch {
      setLErr(t.invalidCredentials);
    } finally {
      setLBusy(false);
    }
  };
  const logout = () => {
    setScreen("login"); setCurUser(null); setLf({ u: "", p: "" });
    try { sessionStorage.removeItem("pd_screen"); sessionStorage.removeItem("pd_user"); sessionStorage.removeItem("pd_token"); sessionStorage.removeItem("pd_admin_token"); } catch {}
  };
  const addClient = async () => {
    if (!form.name || !form.email) return;
    const fullPhone = form.phone ? `${addCountry} ${form.phone}` : "";
    // No password is generated here any more. The server makes one (unless the
    // trainer typed one), stores only its hash, and hands the plaintext back
    // once — below is the only place it is ever readable.
    const c = { ...form, phone: fullPhone, age: +form.age || 25, weight: +form.weight || 70, height: +form.height || 170, joinDate: new Date().toISOString().split("T")[0], status: "Active", workoutPlan: null, nutritionPlan: null, workoutSystemId: null, mealPlanId: null, progress: [{ date: new Date().toISOString().split("T")[0], weight: +form.weight || 70 }] };
    const saved = await dbAddClient(c);
    if (!saved) { window.alert("Could not add the client. Try again."); return; }
    setClients(p => [...p, saved.client]);
    setShowAdd(false); setShareD({ name: saved.client.name, email: saved.client.email, password: saved.password, phone: saved.client.phone }); setShowShare(true); setForm(blank); setAddCountry("+974");
  };
  const saveEdit = async () => {
    if (!editC) return;
    const fullPhone = form.phone ? `${editCountry} ${form.phone}` : editC.phone;
    // An empty password field means "leave it alone". A typed one is hashed
    // server-side and replaces whatever was there.
    const updated = { ...editC, name: form.name || editC.name, email: form.email || editC.email, password: form.password || "", age: +form.age || editC.age, weight: +form.weight || editC.weight, height: +form.height || editC.height, gender: form.gender || editC.gender, goal: form.goal || editC.goal, pal: form.pal || editC.pal, phone: fullPhone, dob: form.dob || editC.dob || "" };
    await dbUpdateClient(updated);
    // Never keep a password in React state.
    const { password: _pw, ...stored } = updated;
    setClients(p => p.map(c => c.id === editC.id ? stored : c));
    setShowEdit(false); setEditC(null); setForm(blank);
  };
  const openEdit = (c) => {
    setEditC(c);
    const parts = (c.phone || "").split(" ");
    const knownCode = COUNTRIES.find(cc => cc.code === parts[0]);
    setEditCountry(knownCode ? parts[0] : "+974");
    const restNumber = knownCode ? parts.slice(1).join("") : (c.phone || "").replace(/\D/g, "");
    // Blank, not the current password — there is nothing to prefill. Passwords
    // are stored as hashes, so this field can only ever SET a new one.
    setForm({ name: c.name, email: c.email, password: "", age: String(c.age), weight: String(c.weight), height: String(c.height), gender: c.gender || "male", goal: c.goal, pal: c.pal || "moderate", phone: restNumber, dob: c.dob || "" });
    setShowEdit(true);
  };
  const parqFlags = (reg) =>
    Object.entries(reg?.parq_answers || {}).filter(([, yes]) => yes).map(([id]) => id);

  const approveReg = async (reg) => {
    // Everyone in this list is here because the app declined to start them
    // automatically. For a health flag that is not a formality — approving is
    // saying you have spoken to this person. One deliberate click, not a
    // reflex on a green button.
    const flags = parqFlags(reg);
    if (flags.length) {
      const list = flags.map(id => `  - ${PARQ_SHORT[id] || id}`).join("\n");
      const ok = window.confirm(
        `${reg.name} answered YES to:\n\n${list}\n\n` +
        `Only approve if you have spoken to them and they have medical clearance.\n\nCreate the account?`
      );
      if (!ok) return;
    }

    const today = new Date().toISOString().split("T")[0];
    const c = {
      name: reg.name, email: reg.email,
      age: +reg.age || 25, weight: +reg.weight || 70, height: +reg.height || 170,
      gender: reg.gender || "male", goal: reg.goal || "General Fitness",
      pal: reg.pal || "moderate", phone: reg.phone,
      joinDate: today, status: "Active",
      workoutPlan: null, nutritionPlan: null, workoutSystemId: null, mealPlanId: null,
      progress: [{ date: today, weight: +reg.weight || 70 }],
      // Carry the intake across. Without this everything they told the form —
      // and the record that PAR-Q screening happened at all — is thrown away
      // the moment the registration row is deleted below.
      experience: reg.experience, daysPerWeek: reg.days_per_week,
      equipment: reg.equipment, limitation: reg.limitation,
      parqAnswers: reg.parq_answers || null,
      assignedReason: `Approved by the trainer — ${reg.blocked_reason || "no automatic programme"}`,
      needsReview: true,
      signupSource: "trainer_approved",
    };
    const saved = await dbAddClient(c);
    if (!saved) { window.alert("Could not approve this registration. Try again."); return; }
    setClients(p => [...p, saved.client]);
    await dbDeleteReg(reg.id);
    setRegs(p => p.filter(r => r.id !== reg.id));
    setShareD({ name: saved.client.name, email: saved.client.email, password: saved.password, phone: saved.client.phone }); setShowShare(true);
  };

  // Reject used to only drop the row out of React state, so it came straight
  // back on the next refresh and sat in the table for ever.
  const rejectReg = async (reg) => {
    if (!window.confirm(`Delete ${reg.name}'s request? This cannot be undone.`)) return;
    await dbDeleteReg(reg.id);
    setRegs(p => p.filter(r => r.id !== reg.id));
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

  // Records that the trainer has spoken to a flagged client, which is what
  // lets them train again. The note is required: a cleared health flag with
  // no reason behind it is just a timestamp, and this is the one record that
  // says screening actually happened.
  const clearFlag = async (c) => {
    const note = window.prompt(
      isAr
        ? `ماذا اتفقتما عليه مع ${c.name}؟ (سيُحفظ هذا)`
        : `What did you and ${c.name} agree? This is saved as the record.`,
      ""
    );
    if (note === null) return;
    if (!note.trim()) {
      window.alert(isAr ? "اكتب سبباً." : "Write what was agreed — it is the record that this was handled.");
      return;
    }
    try {
      await adminPost({ action: "clear_parq_flag", clientId: c.id, note: note.trim() });
      await reloadClients();
    } catch (e) {
      window.alert(e.message || "Could not save that.");
    }
  };
  const regLink = `${window.location.origin}/register`;
  const liveC = clients.find(c => c.id === curUser?.id) || curUser;
  const activeCount = clients.filter(c => c.status === "Active").length;
  const goals = clients.reduce((a, c) => { a[c.goal] = (a[c.goal] || 0) + 1; return a; }, {});
  const GOALS = isAr ? GOALS_AR : GOALS_EN;
  const NAV = [{ id: "dashboard", l: t.dashboard, i: "◈" }, { id: "clients", l: t.clients, i: "◎" }, { id: "plans", l: t.plans, i: "▤" }, { id: "requests", l: `${t.requests}${regs.length ? `(${regs.length})` : ""}`, i: "📋" }, { id: "history", l: "History", i: "📊" }];

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
            {/* The name is set in the display face at its natural weight. It
                used to be 24px, bold, tracked out 2px — letterspacing is what
                you reach for when the font is not carrying the line on its
                own, and a serif at 700 with 2px of tracking is neither the
                serif nor the sans. The little gold rule went with it. */}
            <div className="sf" style={{ fontSize: 30, lineHeight: 1.1, marginTop: 14 }}>{t.appName}</div>
            <div style={{ fontSize: 13, color: G.muted, marginTop: 8, lineHeight: 1.5 }}>{t.tagline}</div>
          </div>
          {lErr && <div style={{ background: G.redSoft, border: `1px solid ${G.redLine}`, borderRadius: 10, padding: "11px 14px", color: G.red, fontSize: 13, marginBottom: 14, textAlign: "center" }}>{lErr}</div>}
          <div style={{ marginBottom: 11 }}>
            <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{t.email}</div>
            <input className="inp" placeholder={t.email} value={lf.u} onChange={e => setLf(p => ({ ...p, u: e.target.value }))} onKeyDown={e => e.key === "Enter" && login()} style={{ direction: "ltr" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{t.password}</div>
            <input className="inp" type="password" placeholder="••••••••" value={lf.p} onChange={e => setLf(p => ({ ...p, p: e.target.value }))} onKeyDown={e => e.key === "Enter" && login()} />
          </div>
          <Btn ch={lBusy ? "…" : t.enter} v="gold" full onClick={login} sx={{ minHeight: 54, fontSize: 15, opacity: lBusy ? 0.6 : 1, pointerEvents: lBusy ? "none" : "auto" }} />
          <div style={{ textAlign: "center", marginTop: 12 }}><a href="/register" style={{ fontSize: 13, color: G.gold, textDecoration: "none" }}>{t.newMember}</a></div>
        </div>
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <Av name={TRAINER.name} sz={40} />
            <div style={{ textAlign: isAr ? "right" : "left" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{TRAINER.name}</div>
              <div style={{ fontSize: 11, color: G.muted }}>{isAr ? TRAINER.designationAr : TRAINER.designation}</div>
            </div>
          </div>
          <a href={`https://wa.me/${TRAINER.whatsapp}`} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 7, minHeight: 44, padding: "0 18px", background: G.greenSoft, border: `1px solid ${G.greenLine}`, borderRadius: 22, color: G.green, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
            <Icon n="whatsapp" s={15} /> {isAr ? "تواصل معنا" : "Contact on WhatsApp"}
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
        <div style={{ background: G.surf, borderBottom: `1px solid ${G.border}`, padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, height: 62, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Logo s={34} />
            <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: ".01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.appName}</div>
          </div>
          <LangBtn lang={lang} setLang={setLang} />
        </div>
        <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto", paddingBottom: 92 }}>
          {cTab === "profile" && (
            <div className="fd">
              <div style={{ marginBottom: 14 }}>
                <div className="sf" style={{ fontSize: 28, lineHeight: 1.15 }}>{t.welcome}, {liveC.name.split(" ")[0]}</div>
                <div style={{ fontSize: 13, color: G.muted, marginTop: 6 }}>{t.memberSince} {liveC.joinDate}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 11 }}>
                {[{ l: t.age, v: `${liveC.age}y` }, { l: t.weight, v: `${liveC.weight}kg` }, { l: t.height, v: `${liveC.height}cm` }, { l: t.goal, v: liveC.goal }].map((x, i) => (
                  <div key={i} className="card" style={{ padding: "14px 16px" }}><div style={{ fontSize: 10, color: G.muted, textTransform: "uppercase", letterSpacing: ".09em", fontWeight: 600, marginBottom: 6 }}>{x.l}</div><div className="sf" style={{ fontSize: 22, lineHeight: 1.1, fontWeight: 700 }}>{x.v}</div></div>
                ))}
              </div>
              <div className="card" style={{ padding: 14, marginBottom: 11 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div><div style={{ fontSize: 10, color: G.muted, textTransform: "uppercase", letterSpacing: ".09em", fontWeight: 600, marginBottom: 6 }}>{t.bmi}</div><div className="sf" style={{ fontSize: 42, lineHeight: 1, color: bmiColor }}>{bmi}</div><div style={{ fontSize: 12, fontWeight: 700, color: bmiColor }}>{bmiLabel}</div></div>
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
                    <Av name={TRAINER.name} sz={42} />
                    <div><div style={{ fontSize: 14.5, fontWeight: 600 }}>{TRAINER.name}</div><div style={{ fontSize: 11, color: G.muted }}>{isAr ? TRAINER.designationAr : TRAINER.designation}</div></div>
                  </div>
                  <a href={`https://wa.me/${TRAINER.whatsapp}?text=${encodeURIComponent(`Hi! 👋\nI am ${liveC.name}.\n\nI need help with: `)}`} target="_blank" rel="noreferrer" style={{ padding: "8px 14px", background: "#E6F2ED", border: "1px solid #C9E3D8", borderRadius: 8, color: G.green, textDecoration: "none", fontSize: 12, fontWeight: 700 }}>💬 WhatsApp</a>
                </div>
              </div>
              <button className="btn" onClick={logout}
                style={{ width: "100%", marginTop: 18, minHeight: 50, background: "transparent", border: `1px solid ${G.border}`, borderRadius: 12, color: G.muted, fontSize: 14, fontWeight: 600 }}>
                {t.logout}
              </button>
            </div>
          )}
          {(cTab === "workout" || cTab === "nutrition") && (
            <div className="fd">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div className="sf" style={{ fontSize: 26, lineHeight: 1.15 }}>{cTab === "workout" ? t.workout : t.nutrition}</div>
              </div>
              {cTab === "workout" ? (
                (() => {
                  const ws = systemFor(liveC);
                  // Screening comes before the session, not beside it. The
                  // plan stays visible — hiding it would read as punishment
                  // for answering honestly — but nothing starts until this is
                  // answered and clear.
                  const scr = screeningState(liveC);
                  const gate = (
                    <ScreeningCard
                      client={liveC}
                      isAr={isAr}
                      onAnswered={(d) => setCurUser(u => u ? {
                        ...u,
                        parq_answers: d.parq_answers,
                        parq_cleared_at: d.cleared ? new Date().toISOString() : null,
                        needs_review: !d.cleared,
                        ...(d.intake ? {
                          experience: d.intake.experience,
                          equipment: d.intake.equipment,
                          limitation: d.intake.limitation,
                          days_per_week: d.intake.days_per_week,
                        } : {}),
                      } : u)}
                    />
                  );
                  if (ws) {
                    return (
                      <div>
                        {gate}
                        {(() => {
                          // Where they are in the block, and — the point of the
                          // whole thing — when it is time to measure again.
                          const pr = programmeState(ws, clientLogs, lastAssessedAt);
                          if (!pr.weeks) return null;
                          if (pr.dueRetest) return (
                            <div className="card" style={{ padding: 18, marginBottom: 16, borderColor: G.accentLine, background: G.accentSoft }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                                <Icon n="ruler" s={16} c={G.accent} />
                                <div style={{ fontSize: 12.5, fontWeight: 700, color: G.accent }}>
                                  {isAr ? "حان وقت القياس" : "Time to measure again"}
                                </div>
                              </div>
                              <div style={{ fontSize: 13, color: G.text, lineHeight: 1.6 }}>
                                {isAr
                                  ? `أكملت ${pr.done} جلسة في هذا البرنامج. هذه هي النقطة التي يُعاد فيها القياس — والبرنامج يتبع النتيجة.`
                                  : `${pr.done} sessions done on this programme. This is the point where it is worth measuring again — and the programme follows the result.`}
                              </div>
                              <a href={`https://wa.me/${TRAINER.whatsapp}?text=${encodeURIComponent(`Hi Rafi, I have finished ${pr.done} sessions on ${ws.name}. Ready to be reassessed.`)}`}
                                target="_blank" rel="noreferrer"
                                style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, padding: "0 18px", marginTop: 13, background: G.greenSoft, border: `1px solid ${G.greenLine}`, borderRadius: 22, color: G.green, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                                <Icon n="whatsapp" s={15} /> {isAr ? "راسل رافي" : "Message Rafi"}
                              </a>
                            </div>
                          );
                          return (
                            <div className="card" style={{ padding: "16px 18px", marginBottom: 16 }}>
                              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                                <div style={{ fontSize: 10, color: G.muted, letterSpacing: ".09em", textTransform: "uppercase", fontWeight: 600 }}>
                                  {isAr ? `الأسبوع ${pr.week} من ${pr.weeks}` : `Week ${pr.week} of ${pr.weeks}`}
                                </div>
                                <div style={{ fontSize: 12, color: G.muted }}>
                                  {isAr ? `${pr.done} من ${pr.target} جلسة` : `${pr.done} of ${pr.target} sessions`}
                                </div>
                              </div>
                              <div style={{ height: 5, borderRadius: 3, background: G.soft, marginTop: 10, overflow: "hidden" }}>
                                <div style={{ height: 5, width: `${Math.round(pr.fraction * 100)}%`, background: G.accent, borderRadius: 3, transition: "width .3s" }} />
                              </div>
                              {pr.isDeloadWeek && (
                                <div style={{ fontSize: 12.5, color: G.text, marginTop: 12, lineHeight: 1.6 }}>
                                  {isAr
                                    ? "هذا أسبوع أخف — نفس التمارين، حوالي 60٪ من وزنك المعتاد. الأسبوع الأسهل جزء من البرنامج وليس انقطاعاً عنه."
                                    : "This is a lighter week — same movements, about 60% of your usual weight. The easier week is part of the programme, not a break from it."}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        {/* System header */}
                        {/* A programme's colour used to tint this card, the day
                            bar and both buttons, so Push/Pull/Legs arrived in
                            red — which reads as an error, not a plan. The
                            colour survives as a 3px rule on the day bar and
                            nowhere else. */}
                        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
                          <div className="sf" style={{ fontSize: 22, lineHeight: 1.2, color: G.text }}>{isAr ? ws.nameAr : ws.name}</div>
                          <div style={{ fontSize: 12.5, color: G.muted, marginTop: 6, lineHeight: 1.55 }}>{isAr ? ws.descAr : ws.desc}</div>
                          <button onClick={() => setShowClientDayPicker(true)} disabled={scr.blocked}
                            title={scr.blocked ? (isAr ? "أكمل الفحص الصحي أولاً" : "Finish the health check first") : undefined}
                            style={{ marginTop: 15, width: "100%", minHeight: 52, background: scr.blocked ? G.soft : G.grad, color: scr.blocked ? G.muted : G.paper, border: scr.blocked ? `1px solid ${G.border}` : "none", borderRadius: 12, fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, cursor: scr.blocked ? "not-allowed" : "pointer" }}><Icon n="play" s={14} c={scr.blocked ? G.muted : G.paper} /> Start session</button>
                        </div>
                        {/* Days with exercise cards */}
                        {ws.days.map((day, di) => (
                          <div key={di} style={{ marginBottom: 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: G.text, marginBottom: 12, padding: "10px 12px", background: G.soft, borderRadius: 10, borderInlineStart: `3px solid ${ws.color}` }}>
                              <span>{day.name}</span>
                              <button onClick={() => { setActiveDay(day.name); setShowClientPlayer(true); }} disabled={scr.blocked}
                                style={{ background: scr.blocked ? "transparent" : G.grad, color: scr.blocked ? G.muted : G.paper, border: scr.blocked ? `1px solid ${G.border}` : "none", borderRadius: 10, minHeight: 40, padding: "0 16px", fontWeight: 600, fontSize: 12, flexShrink: 0, cursor: scr.blocked ? "not-allowed" : "pointer" }}>Start</button>
                            </div>
                            {/* The list has to match the session. If the player
                                leaves a movement out because of the assessment,
                                showing it here would read as the app losing
                                exercises. Held-back ones are shown separately
                                and explained, not silently dropped — someone
                                working towards them should be able to see them. */}
                            {(() => {
                              const lv = liveC.capabilityLevels || liveC.capability_levels || null;
                              const gated = lv && Object.keys(lv).length;
                              const ready = [], notYet = [];
                              for (const ex of day.exercises) {
                                if (!gated || meetsRequirement(lv, getExerciseRequirement(ex.name))) ready.push(ex);
                                else notYet.push(ex);
                              }
                              return (
                                <>
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                    {ready.map((ex, ei) => (
                                      <ExerciseCard key={ei} exercise={ex} color={ws.color} lang={lang} />
                                    ))}
                                  </div>
                                  {notYet.length > 0 && (
                                    <div style={{ marginTop: 10, padding: "10px 12px", background: G.surf2, border: `1px dashed ${G.border}`, borderRadius: 10 }}>
                                      <div style={{ fontSize: 10, color: G.muted, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 700 }}>
                                        Working towards
                                      </div>
                                      {notYet.map((ex, ei) => {
                                        const why = blockedBy(lv, getExerciseRequirement(ex.name))[0];
                                        return (
                                          <div key={ei} style={{ marginTop: 7 }}>
                                            <div style={{ fontSize: 12, color: G.text }}>{ex.name}</div>
                                            {why && <div style={{ fontSize: 10.5, color: G.muted, marginTop: 1 }}>{why.name} — {why.neededLabel}</div>}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ))}
                        {showClientDayPicker && ws && (
                          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(14,32,53,0.45)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                            <div className="card" style={{ borderRadius: 18, padding: 24, width: "100%", maxWidth: 360 }}>
                              <div className="sf" style={{ fontSize: 21, marginBottom: 16 }}>Select a day</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                                <button onClick={() => { setActiveDay(null); setShowClientPlayer(true); setShowClientDayPicker(false); }} style={{ background: G.accentSoft, color: G.accent, border: "none", borderRadius: 10, padding: "12px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", textAlign: "left" }}>
                                  Full workout — every day
                                </button>
                                {ws.days.map((day, i) => (
                                  <button key={i} onClick={() => { setActiveDay(day.name); setShowClientPlayer(true); setShowClientDayPicker(false); }} style={{ background: `${ws.color}15`, color: ws.color, border: `1px solid ${ws.color}30`, borderRadius: 10, padding: "12px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", textAlign: "left" }}>
                                    {day.name}
                                  </button>
                                ))}
                              </div>
                              <button onClick={() => setShowClientDayPicker(false)} style={{ width: "100%", background: "#fff", color: G.text, border: "none", borderRadius: 10, padding: "10px", cursor: "pointer" }}>Cancel</button>
                            </div>
                          </div>
                        )}
                        {/* The buttons above are disabled while screening is
                            outstanding. This is the second lock: a disabled
                            button is a hint, and a health gate should not
                            depend on one. */}
                        {showClientPlayer && !scr.blocked && (
                          <WorkoutPlayer workoutSystem={ws} dayName={activeDay} client={liveC} onClose={() => { setShowClientPlayer(false); setActiveDay(null); }} accentColor={G.nAccent} />
                        )}
                      </div>
                    );
                  } else if (liveC.workoutPlan) {
                    return (
                      <div>
                        {gate}
                        <div className="card" style={{ padding: 16 }}>
                          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.9, color: G.text }}>{liveC.workoutPlan}</pre>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div>
                        {gate}
                        <div className="card" style={{ textAlign: "center", padding: "36px 20px", color: G.muted }}>
                          <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}><Icon n="train" s={26} c={G.dim} /></div>
                          <div style={{ color: G.muted }}>{t.trainerWillAdd}</div>
                        </div>
                      </div>
                    );
                  }
                })()
              ) : (
                <div>
                  {(() => {
                    const mp = MEALS.find(m => m.id === liveC.mealPlanId);
                    return mp ? (
                      <div>
                        <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 14, position: "relative" }}>
                          <img src={mp.image} alt={mp.name} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.8))", padding: "20px 14px 12px" }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{mp.emoji} {isAr ? mp.nameAr : mp.name}</div>
                          </div>
                        </div>
                        <div>
                          {(() => {
                            const pal = PAL.find(p => p.id === (liveC.pal || "moderate")) || PAL[2];
                            const tdee = calcTDEE(liveC.weight, liveC.height, liveC.age, liveC.gender || "male", pal.factor);
                            const target = goalCal(tdee, liveC.goal);
                            const scaledPlan = scaleMealPlan(mp, target);
                            return scaledPlan.meals.map((m, i) => {
                              const mealImg = MEAL_IMAGES[mp.id]?.[`${m.name}@${m.time}`] || MEAL_IMAGES[mp.id]?.[m.name];
                              const prepSteps = MEAL_PREP[mp.id]?.[m.name];
                              return (
                                <div key={i} style={{ marginBottom: 16, borderRadius: 18, overflow: "hidden", background: G.surf, boxShadow: "0 6px 20px rgba(14,32,53,0.08)" }}>
                                  {mealImg && (
                                    <div style={{ position: "relative" }}>
                                      <img src={mealImg} alt={m.name} style={{ width: "100%", height: 170, objectFit: "cover", display: "block" }} />
                                      <div style={{ position: "absolute", top: 10, left: 10, background: mp.color, color: "#FCFCFD", fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 20 }}>{m.time}</div>
                                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(transparent, rgba(0,0,0,0.65))" }} />
                                    </div>
                                  )}
                                  <div style={{ padding: "12px 14px" }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: G.text, marginBottom: 6 }}>{isAr ? m.nameAr : m.name}</div>
                                    <div style={{ fontSize: 11.5, color: G.muted, lineHeight: 1.5, marginBottom: 8 }}>{m.items}</div>
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: prepSteps ? 10 : 0 }}>
                                      <span style={{ background: G.amberSoft, color: G.amber, fontSize: 10.5, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>{m.cal} kcal</span>
                                      <span style={{ background: "#ef444415", color: "#A63A3A", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>P {m.p}g</span>
                                      <span style={{ background: "#f59e0b15", color: G.amber, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>C {m.c}g</span>
                                      <span style={{ background: "#60a5fa15", color: G.blue, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>F {m.f}g</span>
                                    </div>
                                    {prepSteps && (
                                      <details style={{ background: G.surf2, borderRadius: 12, padding: "10px 12px" }}>
                                        <summary style={{ fontSize: 12, fontWeight: 700, color: G.accent, cursor: "pointer", listStyle: "none", minHeight: 30, display: "flex", alignItems: "center" }}>How to prep</summary>
                                        <ol style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                                          {prepSteps.map((step, si) => (
                                            <li key={si} style={{ fontSize: 11.5, color: G.text, lineHeight: 1.6, marginBottom: 4 }}>{step}</li>
                                          ))}
                                        </ol>
                                      </details>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="card" style={{ padding: 16, minHeight: 150 }}>
                        {liveC.nutritionPlan
                          ? <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.9, color: G.text }}>{liveC.nutritionPlan}</pre>
                          : <div style={{ textAlign: "center", padding: "36px 20px", color: G.muted }}><div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}><Icon n="food" s={26} c={G.dim} /></div><div style={{ color: G.muted }}>{t.trainerWillAdd}</div></div>}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
          {cTab === "pdscore" && (
              <PDScore client={liveC} onClose={() => setCTab("workout")} />
            )}

          {cTab === "progress" && (
            <ProgressTab client={liveC} setClients={setClients} lang={lang} isAr={isAr} t={t} />
          )}
          {cTab === "history" && (
            <div className="fd">
              <ClientWorkoutHistory clientId={liveC.id} accentColor={G.gold} />
            </div>
          )}
        </div>
        {/* BOTTOM NAV */}
        {/* BOTTOM NAV
            Six drawn icons in place of six emoji. The emoji were the loudest
            thing in the old design and none of it was ours — 🏆 is a different
            picture on every phone, and a screen reader read the tab as
            "trophy". The selected tab is now stated three ways (ink icon, ink
            label, and a rule under it) rather than by colour alone.
            48px tall inside a 60px bar: comfortably past the 44px minimum. */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: G.surf, borderTop: `1px solid ${G.border}`, display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)" }}>
          {[
            { id: "workout", l: "Train", i: "train" },
            { id: "nutrition", l: "Food", i: "food" },
            { id: "pdscore", l: "PD-100", i: "score" },
            { id: "progress", l: "Progress", i: "progress" },
            { id: "history", l: "History", i: "history" },
            { id: "profile", l: "You", i: "you" },
          ].map(tab => {
            const on = cTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setCTab(tab.id)} aria-current={on ? "page" : undefined}
                style={{ flex: 1, background: "none", border: "none", padding: "9px 2px 7px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minHeight: 56, position: "relative" }}>
                <Icon n={tab.i} s={21} c={on ? G.ink : G.dim} w={on ? 1.9 : 1.7} />
                <span style={{ fontSize: 10, fontWeight: on ? 700 : 500, color: on ? G.ink : G.muted, letterSpacing: ".01em", whiteSpace: "nowrap" }}>{tab.l}</span>
                {on && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 22, height: 2, borderRadius: 2, background: G.ink }} />}
              </button>
            );
          })}
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
        <div style={{ display: "flex", gap: 7 }}><LangBtn lang={lang} setLang={setLang} /><Btn ch={t.logout} v="danger" onClick={logout} sx={{ padding: "9px 13px", fontSize: 12, minHeight: 40 }} /></div>
      </div>
      <div style={{ background: G.surf, borderBottom: `1px solid ${G.border}`, display: "flex", overflowX: "auto" }}>
        {NAV.map(n => (<button key={n.id} className="btn" onClick={() => setATab(n.id)} style={{ padding: "11px 12px", background: "none", fontSize: 12, fontWeight: 600, color: aTab === n.id ? G.gold : G.muted, borderBottom: aTab === n.id ? `2px solid ${G.gold}` : "2px solid transparent", whiteSpace: "nowrap" }}>{n.i} {n.l}</button>))}
      </div>

      <div style={{ padding: 14, maxWidth: 860, margin: "0 auto" }}>

        {/* DASHBOARD */}
        {aTab === "dashboard" && (
          <div className="fd">
            <div style={{ marginBottom: 14 }}><div className="sf gd" style={{ fontSize: 22, fontWeight: 700 }}>{t.welcome}, {TRAINER.name.split(" ")[0]}! 👋</div></div>
            {regs.length > 0 && <div style={{ background: "#FBF2E3", border: "1px solid #EFE0C2", borderRadius: 11, padding: "11px 13px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}><div><div style={{ fontSize: 13, fontWeight: 700, color: G.amber }}>📋 {regs.length} {t.pendingRequests}</div></div><Btn ch={isAr ? "مراجعة" : "Review"} v="amber" onClick={() => setATab("requests")} sx={{ padding: "7px 14px", fontSize: 12 }} /></div>}
            {/* Screening, above the numbers on purpose.
                A flagged client is someone who reported chest pain or
                dizziness and is now sitting locked out of their own workout
                waiting on a conversation. That belongs at the top of the
                first screen, not buried in a client card. */}
            {(() => {
              const flagged = clients.filter(c => { const st = screeningState(c); return st.flagged.length > 0 && !st.cleared; });
              const unscreened = clients.filter(c => screeningState(c).needed && c.status === "Active");
              if (!flagged.length && !unscreened.length) return null;
              return (
                <div className="card" style={{ padding: "13px 14px", marginBottom: 12, border: `1px solid ${flagged.length ? G.red : G.amber}` }}>
                  <div style={{ fontSize: 10, color: flagged.length ? G.red : G.amber, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
                    ⚕ {isAr ? "الفحص الصحي" : "Health screening"}
                  </div>
                  {flagged.map(c => (
                    <div key={c.id} style={{ padding: "9px 0", borderBottom: `1px solid ${G.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: G.text }}>{c.name}</div>
                      {(c.parq_answers ? Object.entries(c.parq_answers).filter(([, v]) => v).map(([id]) => id) : []).map(id => (
                        <div key={id} style={{ fontSize: 11, color: G.red, marginTop: 3, lineHeight: 1.5 }}>• {PARQ_SHORT[id] || id}</div>
                      ))}
                      <div style={{ fontSize: 11, color: G.muted, marginTop: 6, lineHeight: 1.55 }}>
                        {isAr ? "تدريبه متوقف حتى تتحدث معه." : "Their workout is stopped until you have spoken to them."}
                      </div>
                      <div style={{ display: "flex", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
                        <a href={`https://wa.me/${String(c.phone || "").replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer"
                          style={{ ...VV.green, padding: "9px 13px", fontSize: 12, fontWeight: 700, borderRadius: 8, textDecoration: "none" }}>💬 {isAr ? "تواصل" : "Message"}</a>
                        <Btn ch={isAr ? "✓ تحدثت معه" : "✓ I've spoken to them"} v="ghost"
                          onClick={() => clearFlag(c)} sx={{ padding: "9px 13px", fontSize: 12, minHeight: 40 }} />
                      </div>
                    </div>
                  ))}
                  {unscreened.length > 0 && (
                    <div style={{ fontSize: 12, color: G.muted, marginTop: flagged.length ? 10 : 0, lineHeight: 1.6 }}>
                      {unscreened.length} {isAr ? "لم يُفحصوا بعد" : (unscreened.length === 1 ? "client has not been screened yet" : "clients have not been screened yet")} — {isAr ? "سيُسألون عند تسجيل الدخول." : "they are asked at their next login."}
                      <div style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>{unscreened.map(c => c.name).join(" · ")}</div>
                    </div>
                  )}
                </div>
              );
            })()}
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
              {(()=>{const today=new Date();today.setHours(0,0,0,0);const up=clients.filter(cl=>cl.dob).map(cl=>{const[,m,d]=cl.dob.split("-");let b=new Date(today.getFullYear(),+m-1,+d);if(b<today)b.setFullYear(today.getFullYear()+1);return{...cl,days:Math.ceil((b-today)/864e5)};}).filter(cl=>cl.days<=30).sort((a,b)=>a.days-b.days);if(!up.length)return null;return(<><div style={{fontSize:10,color:"#9A6212",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8,fontWeight:700}}>🎂 {isAr?"مواليد قادمة":"Upcoming Birthdays"}</div>{up.map(cl=>(<div key={cl.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${G.border}`}}><span style={{fontSize:13,color:G.text,fontWeight:600}}>{cl.name}</span><span style={{fontSize:12,color:cl.days<=7?"#9A6212":G.muted,fontWeight:700}}>{cl.days===0?"🎉 Today!":cl.days===1?"Tomorrow 🎂":cl.days+" days"}</span></div>))}<div style={{height:1,background:G.border,margin:"12px 0"}}></div></>);})()}
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
              <Btn ch={t.addClient} v="gold" onClick={() => { setForm(blank); setShowAdd(true); }} sx={{ padding: "10px 18px", fontSize: 13, minHeight: 42 }} />
            </div>
            {clients.map(c => {
              const disabled = c.status === "Disabled";
              const ws = systemFor(c);
              return (
                <div key={c.id} className="card" style={{ padding: 13, marginBottom: 9, opacity: disabled ? 0.6 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
                    <Av name={c.name} sz={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: G.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</div>
                      {ws && <div style={{ fontSize: 10, color: ws.color, marginTop: 2 }}>{ws.emoji} {isAr ? ws.nameAr : ws.name}</div>}
                    </div>
                    <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: c.status === "Active" ? "#E6F2ED" : "#FBECEC", color: c.status === "Active" ? G.green : G.red, border: `1px solid ${c.status === "Active" ? "#C9E3D8" : "#F0D6D6"}` }}>{c.status === "Active" ? t.active : t.disabled}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 9 }}>
                    {[{ l: t.goal, v: c.goal }, { l: t.weight, v: `${c.weight}kg` }, { l: t.age, v: `${c.age}y` }].map(x => (<div key={x.l} style={{ background: G.surf2, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}><div style={{ fontSize: 9, color: G.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{x.l}</div><div style={{ fontSize: 11, fontWeight: 700 }}>{x.v}</div></div>))}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 9 }}>
                    <div style={{ flex: 1, background: G.surf2, borderRadius: 7, padding: "6px", textAlign: "center", border: `1px solid ${c.workoutPlan ? "#C9E3D8" : G.border}`, fontSize: 11, color: c.workoutPlan ? G.green : G.dim }}>⚡ {c.workoutPlan ? "✓" : "—"}</div>
                    <div style={{ flex: 1, background: G.surf2, borderRadius: 7, padding: "6px", textAlign: "center", border: `1px solid ${c.nutritionPlan ? "#C9E3D8" : G.border}`, fontSize: 11, color: c.nutritionPlan ? G.green : G.dim }}>🥗 {c.nutritionPlan ? "✓" : "—"}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 5, marginBottom: 9 }}>
                    {/* Assessment. Sits with the other per-client actions
                        because it belongs to the person, not to a programme —
                        what they can do decides what they are given, not the
                        other way round. */}
                    <Btn ch="📏" v={c.parq_answers ? "ghost" : "amber"} onClick={() => { setAssessTab("progress"); setAssessC(c); }} sx={{ padding: "10px 6px", fontSize: 13, minHeight: 42 }} />
                    <Btn ch="✏️" v="ghost" onClick={() => openEdit(c)} sx={{ padding: "10px 6px", fontSize: 13, minHeight: 42 }} />
                    <Btn ch="📋" v="ghost" onClick={() => { setSelC(c); setATab("plans"); }} sx={{ padding: "10px 6px", fontSize: 13, minHeight: 42 }} />
                    <Btn ch="📄" v="blue" onClick={() => generatePDF(c, lang)} sx={{ padding: "10px 6px", fontSize: 13, minHeight: 42 }} />
                    <Btn ch={disabled ? "▶" : "⏸"} v={disabled ? "green" : "amber"} onClick={() => toggleStatus(c.id)} sx={{ padding: "10px 6px", fontSize: 13, minHeight: 42 }} />
                    <Btn ch="🗑️" v="danger" onClick={() => { if (window.confirm(`${isAr ? "حذف" : "Delete"} ${c.name}?`)) deleteClient(c.id); }} sx={{ padding: "10px 6px", fontSize: 13, minHeight: 42 }} />
                  </div>
                    <div style={{ marginTop:10,padding:"10px 12px",background:"#F3F6FA",borderRadius:10,border:`1px solid ${G.border}` }}>
                      <div style={{ fontSize:11,color:G.muted,marginBottom:5,fontWeight:600 }}>📝 {isAr?"ملاحظات المدرب":"Trainer Notes"}</div>
                      <textarea value={notesDraft[c.id]??(c.trainer_notes||"")} onChange={e=>setNotesDraft(p=>({...p,[c.id]:e.target.value}))} onBlur={async()=>{if(notesDraft[c.id]!==undefined){const upd={...c,trainer_notes:notesDraft[c.id]};await dbUpdateClient(upd);setClients(p=>p.map(x=>x.id===c.id?upd:x));setNotesDraft(p=>{const n={...p};delete n[c.id];return n;});}}} placeholder={isAr?"ملاحظات خاصة...":"Private notes..."} style={{width:"100%",minHeight:55,background:"transparent",border:"none",color:G.text,fontSize:12,resize:"none",outline:"none",lineHeight:1.6,fontFamily:"Inter,sans-serif",padding:0}} />
                    </div>
                  {/* Passwords are stored as hashes, so an existing one cannot be
                      read back and re-sent. Issuing a new one is the only correct
                      option — and the only one that still works if the client has
                      forgotten theirs. */}
                  <button className="btn" disabled={resettingId === c.id}
                    onClick={async () => {
                      const ask = isAr
                        ? `سيتم إنشاء كلمة مرور جديدة لـ ${c.name}. كلمة المرور الحالية لن تعمل بعد ذلك. متابعة؟`
                        : `This creates a NEW password for ${c.name}. Their current password will stop working. Continue?`;
                      if (!window.confirm(ask)) return;
                      setResettingId(c.id);
                      try {
                        const d = await apiResetClientPassword(c.id);
                        setShareD({ name: c.name, email: c.email, password: d.password, phone: c.phone });
                        setShowShare(true);
                      } catch (e) {
                        window.alert(e.message || "Could not reset the password");
                      } finally {
                        setResettingId(null);
                      }
                    }}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", background: "#E8EEF8", border: "1px solid #D3E0F2", borderRadius: 7, color: G.gold, fontSize: 11, fontWeight: 700, opacity: resettingId === c.id ? 0.6 : 1 }}>
                    {resettingId === c.id
                      ? (isAr ? "جارٍ..." : "Working…")
                      : `🔑 ${isAr ? "كلمة مرور جديدة ومشاركة" : "New password & share"}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* PLANS */}
        {aTab === "plans" && <PlansTab clients={clients} selC={selC} setSelC={setSelC} setClients={setClients} lang={lang} onUpdate={dbUpdateClient} />}

        {/* HISTORY */}
        {aTab === "history" && (
          <div className="fd">
            <AdminWorkoutHistory clients={clients} />
          </div>
        )}

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
              ? <div className="card" style={{ padding: "36px 20px", textAlign: "center", color: G.muted }}><div style={{ fontSize: 26, marginBottom: 8 }}>📋</div><div>{t.noRequests}</div></div>
              : regs.map(reg => (
                <div key={reg.id} className="card" style={{ padding: 14, marginBottom: 10, border: "1px solid #EFE0C2" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 11 }}>
                    <Av name={reg.name} sz={38} />
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{reg.name}</div><div style={{ fontSize: 11, color: G.muted }}>{reg.email} · {reg.phone}</div><div style={{ fontSize: 10, color: G.muted }}>{new Date(reg.submittedAt).toLocaleString()}</div></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 11 }}>
                    {[{ l: t.goal, v: reg.goal }, { l: t.weight, v: `${reg.weight || "—"}kg` }, { l: t.activityLevel, v: PAL.find(p => p.id === reg.pal)?.[isAr ? "ar" : "en"] || "—" }].map(x => (<div key={x.l} style={{ background: G.surf2, borderRadius: 6, padding: 7, textAlign: "center" }}><div style={{ fontSize: 9, color: G.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{x.l}</div><div style={{ fontSize: 11, fontWeight: 700 }}>{x.v}</div></div>))}
                  </div>

                  {/* WHY this person is waiting for you. Nobody lands in this
                      list by accident: the app refused to start them, either
                      because of a PAR-Q answer or because they reported pain.
                      Showing the name and goal but not the reason is how a
                      chest-pain answer gets a one-click approval. */}
                  {reg.blocked_reason && (
                    <div style={{ background: "#FBECEC", border: `1px solid ${G.red}`, borderRadius: 8, padding: "9px 11px", marginBottom: 11 }}>
                      <div style={{ fontSize: 10, color: G.red, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 700, marginBottom: 5 }}>
                        ⚠ Not started automatically
                      </div>
                      <div style={{ fontSize: 12, color: G.text, marginBottom: parqFlags(reg).length ? 7 : 0 }}>{reg.blocked_reason}</div>
                      {parqFlags(reg).map(id => (
                        <div key={id} style={{ fontSize: 11, color: G.red, marginTop: 3 }}>• {PARQ_SHORT[id] || id}</div>
                      ))}
                      <div style={{ fontSize: 10, color: G.muted, marginTop: 7, lineHeight: 1.5 }}>
                        Speak to them first. Approving creates the account with no programme attached — you pick one yourself.
                      </div>
                    </div>
                  )}

                  {/* What they told the intake form. It is thrown away if you
                      do not look at it now. */}
                  {(reg.experience || reg.equipment || reg.limitation || reg.days_per_week) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 11 }}>
                      {[
                        reg.experience && `${reg.experience}`,
                        reg.days_per_week && `${reg.days_per_week} days/week`,
                        reg.equipment && `${String(reg.equipment).replace("_", " ")}`,
                        reg.limitation && reg.limitation !== "none" && `${reg.limitation} discomfort`,
                      ].filter(Boolean).map(x => (
                        <span key={x} style={{ background: G.surf2, border: `1px solid ${G.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 10, color: G.muted }}>{x}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <Btn ch={`✓ ${t.approve}`} v="green" onClick={() => approveReg(reg)} sx={{ padding: "10px", fontSize: 13, fontWeight: 700 }} />
                    <Btn ch={`✕ ${t.reject}`} v="danger" onClick={() => rejectReg(reg)} sx={{ padding: "10px", fontSize: 13, fontWeight: 700 }} />
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
      {/* Assessment. Wider than the other overlays because it is a screen, not
          a dialog — the trainer works through it with the client present. */}
      <Ovl show={!!assessC} close={() => setAssessC(null)} mw={560} ch={
        assessC ? (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              {[["progress", "↗ Progress"], ["new", "📏 New assessment"]].map(([id, label]) => {
                const on = assessTab === id;
                return (
                  <button key={id} type="button" className="btn" onClick={() => setAssessTab(id)}
                    style={{
                      flex: 1, padding: "9px", borderRadius: 9, fontSize: 12, fontWeight: 700,
                      background: on ? "#E8EEF8" : G.surf2,
                      color: on ? G.gold : G.muted,
                      border: `1px solid ${on ? G.borderHi : G.border}`,
                    }}>{label}</button>
                );
              })}
            </div>
            {assessTab === "progress" ? (
              <AssessmentProgress
                client={assessC}
                G={G}
                exercises={systemExerciseNames(assessC)}
                onTakeNew={() => setAssessTab("new")}
              />
            ) : (
              <AssessmentForm
                client={assessC}
                G={G}
                parq={PARQ}
                exercises={systemExerciseNames(assessC)}
                systemName={(id) => {
                  const w = WORKOUT_SYSTEMS.find((x) => x.id === id);
                  return w ? `${w.emoji} ${w.name}` : (id || "");
                }}
                onClose={() => setAssessC(null)}
                onSaved={reloadClients}
              />
            )}
          </div>
        ) : null
      } />

      <Ovl show={showEdit} close={() => { setShowEdit(false); setEditC(null); }} mw={480} ch={
        <div dir={isAr ? "rtl" : "ltr"}>
          <div className="sf gd" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>✏️ {t.edit}</div>
          {editC && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ gridColumn: "1/-1" }}><FF label={t.fullName} value={form.name} onChange={v => sf("name", v)} ph={editC.name} /></div>
            <FF label="🎂 Date of Birth" value={form.dob} onChange={v => sf("dob", v)} ph="YYYY-MM-DD" />
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
            const credText = `🏋️ *Physical Definition*\n\n${isAr ? "مرحباً" : "Hi"} ${shareD.name}!\n\n${isAr ? "بيانات دخولك" : "Your login details"}:\n\n📧 ${isAr ? "البريد" : "Email"}:\n${shareD.email}\n\n🔑 ${isAr ? "كلمة المرور" : "Password"}:\n${shareD.password}\n\n🌐 *App:* ${TRAINER.appUrl}\n\n${isAr ? "افتح الرابط وأضفه للشاشة الرئيسية 📱" : "Open link & Add to Home Screen 📱"}\n\n— ${TRAINER.name}\n${isAr ? "مدرب شخصي معتمد" : "Certified Personal Trainer"}`;
            return (
              <>
                <div style={{ background: G.surf2, border: `1px solid ${G.borderHi}`, borderRadius: 11, padding: 14, marginBottom: 12, fontFamily: "monospace", direction: "ltr" }}>
                  <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:16 }}>
  <div style={{ background:"#F3F6FA",borderRadius:10,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.08)" }}>
    <div style={{ fontSize:11,color:G.muted,marginBottom:6,fontWeight:600 }}>📧 {isAr?"البريد الإلكتروني":"Email"}</div>
    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
      <div style={{ flex:1,fontSize:13,color:G.text,fontWeight:600,wordBreak:"break-all" }}>{shareD.email}</div>
      <button onClick={()=>navigator.clipboard.writeText(shareD.email)} style={{ flexShrink:0,background:G.accentSoft,border:`1px solid ${G.accentLine}`,borderRadius:7,padding:"6px 12px",color:G.accent,fontSize:12,cursor:"pointer",fontWeight:600 }}>📋 {isAr?"نسخ":"Copy"}</button>
    </div>
  </div>
  <div style={{ background:"#F3F6FA",borderRadius:10,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.08)" }}>
    <div style={{ fontSize:11,color:G.muted,marginBottom:6,fontWeight:600 }}>🔑 {isAr?"كلمة المرور":"Password"}</div>
    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
      <div style={{ flex:1,fontSize:14,color:G.text,fontWeight:700,letterSpacing:2 }}>{shareD.password}</div>
      <button onClick={()=>navigator.clipboard.writeText(shareD.password)} style={{ flexShrink:0,background:G.accentSoft,border:`1px solid ${G.accentLine}`,borderRadius:7,padding:"6px 12px",color:G.accent,fontSize:12,cursor:"pointer",fontWeight:600 }}>📋 {isAr?"نسخ":"Copy"}</button>
    </div>
  </div>
</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {shareD?.phone && (
                    <a href={`https://wa.me/${shareD.phone.replace(/\D/g, "")}?text=${encodeURIComponent(credText)}`} target="_blank" rel="noreferrer"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", background: "#E6F2ED", border: "1px solid #C9E3D8", borderRadius: 11, color: G.green, textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
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





























