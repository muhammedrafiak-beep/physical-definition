// Daily targets, and the shape a food item takes once it is in our hands.
//
// The calorie and macro numbers here are the SAME ones the app already shows
// on the client's home screen, deliberately: a person who is told 2,167 kcal
// in one place and something else in another stops believing either. The
// micronutrient lines are public-health guidance, all of them ceilings except
// fibre:
//
//   sugar        WHO: free sugars under 10% of energy
//   saturated    WHO: under 10% of energy
//   fibre        ~14 g per 1,000 kcal (US DGA), a floor, not a ceiling
//   sodium       WHO: under 2,000 mg a day
//   cholesterol  300 mg, the long-standing clinical ceiling
//
// They are defaults, not rules. Every one is editable, and once anybody edits
// a target the row is marked 'custom' and nothing recomputes it again.

const PAL_FACTOR = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};

export function defaultTargets(client) {
  const w = Number(client?.weight) || 75;
  const h = Number(client?.height) || 170;
  const age = Number(client?.age) || 35;
  const male = (client?.gender || "male") !== "female";
  const pal = PAL_FACTOR[client?.pal] || 1.55;

  const bmr = male ? 10 * w + 6.25 * h - 5 * age + 5 : 10 * w + 6.25 * h - 5 * age - 161;
  const tdee = Math.round(bmr * pal);

  const goal = client?.goal || "";
  const kcal = goal === "Weight Loss" || goal === "خسارة الوزن" ? Math.round(tdee * 0.8)
    : goal === "Muscle Gain" || goal === "بناء العضلات" ? Math.round(tdee * 1.15)
    : tdee;

  const protein_g = Math.round(w * 2.0);
  const fat_g = Math.round((kcal * 0.25) / 9);
  const carbs_g = Math.max(0, Math.round((kcal - protein_g * 4 - fat_g * 9) / 4));

  return {
    kcal,
    protein_g,
    carbs_g,
    fat_g,
    sugar_g: Math.round((kcal * 0.10) / 4),
    fibre_g: Math.round((kcal / 1000) * 14),
    sodium_mg: 2000,
    sat_fat_g: Math.round((kcal * 0.10) / 9),
    cholesterol_mg: 300,
    source: "auto",
  };
}

// The nine numbers, in one order, used by the table, the API and the screens.
export const NUTRIENTS = [
  "kcal", "protein_g", "carbs_g", "fat_g",
  "sugar_g", "fibre_g", "sodium_mg", "sat_fat_g", "cholesterol_mg",
];

// Everything above zero and inside a sane ceiling. A target of 40,000 kcal is
// a typo, not a plan.
const CEILING = {
  kcal: 12000, protein_g: 800, carbs_g: 2000, fat_g: 800,
  sugar_g: 1000, fibre_g: 300, sodium_mg: 20000, sat_fat_g: 400, cholesterol_mg: 5000,
};

export function cleanTargets(input) {
  const out = {};
  for (const k of NUTRIENTS) {
    const v = input?.[k];
    if (v === undefined || v === null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0 && n <= CEILING[k]) out[k] = Math.round(n);
  }
  return out;
}

// ── Open Food Facts ────────────────────────────────────────
//
// Free, no key, and the only database with real coverage of what is on a shelf
// in Doha. Their v2 endpoint lets us name the fields we want, which keeps a
// 200 KB product document down to the dozen numbers we actually store.
//
// Two things about their data that this function exists to absorb:
//  - a nutrient that is simply absent is normal, and must stay null rather
//    than becoming a zero the client would then be told they ate;
//  - salt and sodium are both published, in grams, and which one is present
//    depends on the country the product was entered in.
const OFF_FIELDS = [
  "code", "product_name", "product_name_en", "brands", "serving_quantity",
  "nutriments", "quantity", "image_front_small_url",
].join(",");

const OFF_HEADERS = {
  // Their API asks every caller to identify itself. An anonymous flood is what
  // gets an app blocked from a free service.
  "User-Agent": "PhysicalDefinition/1.0 (https://www.physicaldefinition.com)",
  Accept: "application/json",
};

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) && x >= 0 ? x : null;
};

export function fromOFF(p) {
  if (!p) return null;
  const nut = p.nutriments || {};

  // Sodium first, salt as the fallback: salt is sodium x 2.5 by mass.
  const sodium_g = n(nut.sodium_100g) ?? (n(nut.salt_100g) !== null ? n(nut.salt_100g) / 2.5 : null);

  const name = (p.product_name_en || p.product_name || "").trim();
  if (!name) return null;

  return {
    barcode: String(p.code || ""),
    name: name.slice(0, 120),
    brand: (p.brands || "").split(",")[0].trim().slice(0, 60) || null,
    serving_g: n(p.serving_quantity),
    image: p.image_front_small_url || null,
    kcal_100g: n(nut["energy-kcal_100g"]) ?? (n(nut.energy_100g) !== null ? Math.round(n(nut.energy_100g) / 4.184) : null),
    protein_100g: n(nut.proteins_100g),
    carbs_100g: n(nut.carbohydrates_100g),
    fat_100g: n(nut.fat_100g),
    sugar_100g: n(nut.sugars_100g),
    fibre_100g: n(nut.fiber_100g),
    sodium_100mg: sodium_g === null ? null : Math.round(sodium_g * 1000),
    sat_fat_100g: n(nut["saturated-fat_100g"]),
    cholesterol_100mg: n(nut.cholesterol_100g) === null ? null : Math.round(n(nut.cholesterol_100g) * 1000),
  };
}

export async function offByBarcode(barcode) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${OFF_FIELDS}`;
  const r = await fetch(url, { headers: OFF_HEADERS });
  if (!r.ok) return null;
  const j = await r.json();
  return j && j.status === 1 ? fromOFF(j.product) : null;
}

export async function offSearch(q) {
  const url = "https://world.openfoodfacts.org/api/v2/search"
    + `?search_terms=${encodeURIComponent(q)}`
    + `&fields=${OFF_FIELDS}&page_size=12&sort_by=popularity_key`;
  const r = await fetch(url, { headers: OFF_HEADERS });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.products || []).map(fromOFF).filter((p) => p && p.kcal_100g !== null);
}

// Scale a per-100g product down to the portion actually eaten.
export function portion(food, grams) {
  const g = Number(grams);
  if (!Number.isFinite(g) || g <= 0) return null;
  const f = g / 100;
  const at = (v) => (v === null || v === undefined ? null : Math.round(v * f * 10) / 10);
  return {
    grams: g,
    kcal: at(food.kcal_100g),
    protein_g: at(food.protein_100g),
    carbs_g: at(food.carbs_100g),
    fat_g: at(food.fat_100g),
    sugar_g: at(food.sugar_100g),
    fibre_g: at(food.fibre_100g),
    sodium_mg: at(food.sodium_100mg),
    sat_fat_g: at(food.sat_fat_100g),
    cholesterol_mg: at(food.cholesterol_100mg),
  };
}
