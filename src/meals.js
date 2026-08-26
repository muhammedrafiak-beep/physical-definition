// The meal plans, their prep notes and photos, and the two functions that
// scale a plan to a client's calorie target.

// ── MEAL PLANS ─────────────────────────────────────────────
export const MEALS = [
  { id: "kerala", name: "Kerala Balanced", nameAr: "نظام كيرالا", emoji: "🍚", color: "#9A6212", image: "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Nutrition/Meal_Kerala.jpeg", baseCal: 1800, meals: [{ mealImg: "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/KB_Breakfast.jpeg", time: "7:00", name: "Breakfast", nameAr: "إفطار", items: "Puttu 150g + Kadala curry 120g + Banana × 1", cal: 380, p: 14, c: 62, f: 8 }, { mealImg: "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/KB_Snack1.jpeg", time: "10:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Coconut water 200ml + Nuts 20g", cal: 180, p: 4, c: 22, f: 9 }, { mealImg: "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/KB_Lunch.jpeg", time: "13:00", name: "Lunch", nameAr: "غداء", items: "Brown rice 150g + Dal 100g + Fish curry 120g + Veg 80g", cal: 520, p: 32, c: 68, f: 12 }, { mealImg: "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/KB_Snack2.jpeg", time: "16:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Banana × 1 + Green tea 200ml", cal: 120, p: 2, c: 28, f: 0 }, { mealImg: "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/KB_Dinner.jpeg", time: "19:00", name: "Dinner", nameAr: "عشاء", items: "Chapati × 3 + Chicken curry 150g + Salad 80g", cal: 480, p: 38, c: 52, f: 10 }] },
  { id: "protein", name: "High Protein", nameAr: "بروتين عالي", emoji: "💪", color: "#A63A3A", image: "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Nutrition/Meal_Protein.jpeg", baseCal: 2200, meals: [{ time: "7:00", name: "Breakfast", nameAr: "إفطار", items: "Egg whites × 6 + Oats 60g + Milk 200ml", cal: 450, p: 42, c: 38, f: 12 }, { time: "10:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Protein shake 30g + Apple × 1", cal: 250, p: 25, c: 30, f: 4 }, { time: "13:00", name: "Lunch", nameAr: "غداء", items: "Grilled chicken 200g + Brown rice 120g + Veg 80g", cal: 550, p: 48, c: 55, f: 10 }, { time: "16:30", name: "Pre-workout", nameAr: "قبل التمرين", items: "Banana × 1 + Peanut butter toast 40g", cal: 320, p: 10, c: 48, f: 10 }, { time: "19:30", name: "Dinner", nameAr: "عشاء", items: "Grilled fish 180g + Sweet potato 150g + Salad 80g", cal: 420, p: 40, c: 42, f: 8 }] },
  { id: "fatburn", name: "Fat Burn", nameAr: "حرق الدهون", emoji: "🔥", color: "#12795A", image: "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Nutrition/Meal_FatBurn.jpeg", baseCal: 1500, meals: [{ time: "7:00", name: "Breakfast", nameAr: "إفطار", items: "Greek yogurt 150g + Berries 60g + Chia 10g", cal: 220, p: 18, c: 22, f: 6 }, { time: "10:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Cucumber 100g + Hummus 40g", cal: 120, p: 5, c: 14, f: 5 }, { time: "13:00", name: "Lunch", nameAr: "غداء", items: "Grilled chicken salad 200g + Olive oil 10ml", cal: 380, p: 35, c: 20, f: 14 }, { time: "16:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Almonds 20g + Black coffee 150ml", cal: 170, p: 6, c: 6, f: 14 }, { time: "19:00", name: "Dinner", nameAr: "عشاء", items: "Steamed fish 150g + Vegetables 100g + Dal soup 100g", cal: 380, p: 38, c: 28, f: 8 }] },
  { id: "veg", name: "Vegetarian", nameAr: "نباتي", emoji: "🥗", color: "#21509B", image: "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Nutrition/Meal_Vegetarian.jpeg", baseCal: 1900, meals: [{ time: "7:00", name: "Breakfast", nameAr: "إفطار", items: "Idli × 4 + Sambar 100g + Chutney 30g", cal: 360, p: 12, c: 68, f: 6 }, { time: "10:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Fruit bowl 150g + Buttermilk 200ml", cal: 200, p: 6, c: 38, f: 2 }, { mealImg: "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/KB_Lunch.jpeg", time: "13:00", name: "Lunch", nameAr: "غداء", items: "Brown rice 150g + Rajma 100g + Paneer 80g + Salad 60g", cal: 560, p: 28, c: 72, f: 14 }, { time: "16:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Roasted chana 40g + Green tea 200ml", cal: 180, p: 10, c: 28, f: 4 }, { time: "19:00", name: "Dinner", nameAr: "عشاء", items: "Roti × 3 + Dal makhani 120g + Veg curry 100g", cal: 480, p: 22, c: 72, f: 10 }] },
  { id: "bulk", name: "Muscle Builder", nameAr: "بناء العضلات", emoji: "🏋️", color: "#6B4FA8", image: "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Nutrition/Meal_Muscle.jpeg", baseCal: 2800, meals: [{ time: "7:00", name: "Breakfast", nameAr: "إفطار", items: "Eggs × 4 + Oats 80g + Banana × 1 + Full fat milk 250ml", cal: 620, p: 38, c: 78, f: 16 }, { time: "10:00", name: "Snack", nameAr: "وجبة خفيفة", items: "Mass gainer 60g + Dates 40g", cal: 480, p: 32, c: 72, f: 8 }, { time: "13:00", name: "Lunch", nameAr: "غداء", items: "White rice 180g + Chicken 250g + Dal 100g + Ghee 10g", cal: 680, p: 52, c: 80, f: 18 }, { time: "16:30", name: "Pre-workout", nameAr: "قبل التمرين", items: "Banana × 2 + Peanut butter 30g + Toast × 2", cal: 420, p: 14, c: 68, f: 12 }, { time: "20:00", name: "Dinner", nameAr: "عشاء", items: "Chapati × 4 + Mutton curry 200g + Milk 200ml", cal: 680, p: 48, c: 78, f: 20 }] },
];

export const MEAL_PREP = {
  kerala: {
    "Breakfast": ["Soak rice flour lightly with water and salt", "Layer flour and grated coconut in puttu maker, steam 7-10 min", "Heat kadala curry (pre-soaked chickpeas pressure cooked with onion, coconut & spices)", "Serve hot with 1 banana"],
    "Snack": ["Open one fresh coconut and pour water into glass", "Portion 20g mixed nuts (almonds, cashews) into a bowl"],
    "Lunch": ["Cook brown rice (1:2 rice-water) for 25 min", "Simmer dal with turmeric & salt until soft", "Cook fish curry with kudampuli, chilli & coconut milk 15 min", "Stir-fry vegetables 5 min with minimal oil"],
    "Dinner": ["Knead wheat flour with water, rest 15 min, roll & cook chapatis on hot tawa", "Cook chicken curry with onion, tomato, ginger-garlic & spices 20 min", "Chop fresh salad — cucumber, carrot, onion with lemon"],
  },
  protein: {
    "Breakfast": ["Whisk 6 egg whites, cook as omelette with minimal oil", "Cook 60g oats with 200ml milk for 5 min", "Serve together while warm"],
    "Snack": ["Blend 30g whey protein with cold water or milk", "Eat 1 apple alongside"],
    "Lunch": ["Season chicken breast with pepper, paprika & salt", "Grill 6-7 min per side until cooked through", "Serve with cooked brown rice and steamed vegetables"],
    "Pre-workout": ["Toast whole wheat bread, spread peanut butter 40g", "Eat with 1 banana 45-60 min before workout"],
    "Dinner": ["Marinate fish with lemon, garlic & herbs 15 min", "Grill 5-6 min per side", "Bake or boil sweet potato until fork-tender", "Serve with fresh salad"],
  },
  fatburn: {
    "Breakfast": ["Add 150g Greek yogurt to bowl", "Top with 60g fresh berries and 10g chia seeds", "Let chia soak 5 min before eating"],
    "Snack": ["Slice cucumber into sticks", "Serve with 40g hummus for dipping"],
    "Lunch": ["Grill seasoned chicken breast, slice thin", "Toss mixed greens, tomato, cucumber with 10ml olive oil & lemon", "Top salad with warm chicken"],
    "Dinner": ["Steam fish 12-15 min with ginger & garlic", "Steam mixed vegetables 8 min", "Heat light dal soup — serve everything together"],
  },
  veg: {
    "Breakfast": ["Steam idli batter in moulds 10-12 min", "Heat sambar with vegetables", "Serve 4 idlis with sambar and coconut chutney"],
    "Snack": ["Chop seasonal fruits into a bowl 150g", "Serve with 200ml chilled buttermilk"],
    "Lunch": ["Cook brown rice 25 min", "Heat rajma curry (pre-soaked, pressure cooked with spices)", "Lightly pan-fry paneer cubes 80g", "Serve with fresh salad"],
    "Dinner": ["Cook rotis on hot tawa", "Heat dal makhani (slow-cooked black dal with butter)", "Prepare mixed vegetable curry with minimal oil"],
  },
  bulk: {
    "Breakfast": ["Scramble 4 whole eggs with minimal butter", "Cook 80g oats with 250ml full-fat milk", "Serve with 1 banana"],
    "Snack": ["Blend 60g mass gainer with milk or water", "Eat 40g dates alongside"],
    "Lunch": ["Cook white rice 180g", "Grill or curry 250g chicken", "Heat dal, add 10g ghee on rice", "Eat together as a full meal"],
    "Pre-workout": ["Toast 2 slices bread with 30g peanut butter", "Eat with 2 bananas 45-60 min before workout"],
    "Dinner": ["Cook 4 chapatis fresh", "Prepare mutton curry with onion-tomato gravy 30-40 min", "Serve with 200ml warm milk before bed"],
  },
};

export const MEAL_IMAGES = {
  kerala: {
    "Breakfast": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/KB_Breakfast.jpeg",
    "Snack": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/KB_Snack1.jpeg",
    "Snack@16:00": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/KB_Snack2.jpeg",
    "Lunch": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/KB_Lunch.jpeg",
    "Dinner": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/KB_Dinner.jpeg",
  },
  protein: {
    "Breakfast": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/HP_Breakfast.jpeg",
    "Snack": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/HP_Snack1.jpeg",
    "Lunch": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/HP_Lunch.jpeg",
    "Pre-workout": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/HP_PreWorkout.jpeg",
    "Dinner": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/HP_Dinner.jpeg",
  },
  fatburn: {
    "Breakfast": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/FB_Breakfast.jpeg",
    "Snack": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/FB_Snack1.jpeg",
    "Snack@16:00": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/FB_Snack2.jpeg",
    "Lunch": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/FB_Lunch.jpeg",
    "Dinner": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/FB_Dinner.jpeg",
  },
  veg: {
    "Breakfast": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/VG_Breakfast.jpeg",
    "Snack": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/VG_Snack1.jpeg",
    "Snack@16:00": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/VG_Snack2.jpeg",
    "Lunch": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/VG_Lunch.jpeg",
    "Dinner": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/VG_Dinner.jpeg",
  },
  bulk: {
    "Breakfast": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/MB_Breakfast.jpeg",
    "Snack": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/MB_Snack1.jpeg",
    "Lunch": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/MB_Lunch.jpeg",
    "Pre-workout": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/MB_PreWorkout.jpeg",
    "Dinner": "https://lycpyoefqwgrkqgtrmrp.supabase.co/storage/v1/object/public/exercise-photos/Meals/MB_Dinner.jpeg",
  },
};

// Scale a meal plan's quantities + macros to match a target calorie goal
export function scaleMealPlan(plan, targetCal) {
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
