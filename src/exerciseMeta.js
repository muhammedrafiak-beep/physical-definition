// Explicit muscle and equipment tags, one entry per exercise name.
//
// Lives in its own module because two screens need it and neither should own
// it: App.jsx reads the muscle targets, and the workout player reads `eq` to
// decide whether an exercise is even loaded with weight. Duplicating that
// knowledge in the player would guarantee the two drift apart.
//
// The keyword guesser this replaced got things wrong that matter — it missed
// several leg exercises entirely (Leg Raises, Clamshells, Wall Sit), and
// because of rule ordering it tagged "Leg Curl" as Biceps and "Leg Extension"
// as Triceps. It survives only as a fallback for names not listed here.
//
// These move onto the exercise objects when the schema is widened; one table
// for now avoids touching all 215 entries at once.

export const EXERCISE_META = {
  "10 Push-ups":                                 { p: ["Chest"], s: ["Triceps","Core"], eq: ["bodyweight"] },
  "15 Air Squats":                               { p: ["Quads"], s: ["Glutes"], eq: ["bodyweight"] },
  "5 Pull-ups":                                  { p: ["Lats"], s: ["Biceps","Core"], eq: ["pull-up bar"] },
  "Ab Wheel Rollout":                            { p: ["Core"], s: ["Lats","Stabilizers"], eq: ["ab wheel"] },
  "Ankle Pumps":                                 { p: ["Ankles"], s: ["Calves"], eq: ["bodyweight"] },
  "Ankle Pumps (seated)":                        { p: ["Ankles"], s: ["Calves"], eq: ["chair","bodyweight"] },
  "Ankle Rotations":                             { p: ["Mobility"], s: ["Ankles"], eq: ["bodyweight"] },
  "Arm Swings":                                  { p: ["Mobility"], s: ["Delts"], eq: ["bodyweight"] },
  "Arnold Press":                                { p: ["Delts"], s: ["Triceps","Core"], eq: ["dumbbell"] },
  "Back Squat":                                  { p: ["Quads"], s: ["Glutes","Core"], eq: ["barbell"] },
  "Band External Rotation":                      { p: ["Rotator Cuff"], s: ["Rear Delts"], eq: ["band"] },
  "Band Front Raise (light)":                    { p: ["Front Delts"], s: ["Rotator Cuff"], eq: ["band"] },
  "Band Internal Rotation":                      { p: ["Rotator Cuff"], s: [], eq: ["band"] },
  "Band Lateral Raise (light)":                  { p: ["Side Delts"], s: ["Rotator Cuff"], eq: ["band"] },
  "Band Lateral Walk":                           { p: ["Hip Abductors"], s: ["Glutes","Balance"], eq: ["band"] },
  "Band Seated Leg Extension":                   { p: ["Quads"], s: [], eq: ["band"] },
  "Band Seated Row":                             { p: ["Mid Back"], s: ["Lats","Biceps"], eq: ["band"] },
  "Barbell Curl":                                { p: ["Biceps"], s: ["Forearms"], eq: ["barbell"] },
  "Barbell Row":                                 { p: ["Mid Back"], s: ["Lats","Biceps","Rear Delts"], eq: ["barbell"] },
  "Barbell Squat":                               { p: ["Quads"], s: ["Glutes","Core"], eq: ["barbell"] },
  "Battle Ropes":                                { p: ["Delts"], s: ["Core","Cardio"], eq: ["rope"] },
  "Bench Press":                                 { p: ["Chest"], s: ["Triceps","Front Delts"], eq: ["barbell","bench"] },
  "Bicycle Crunches":                            { p: ["Obliques"], s: ["Core"], eq: ["bodyweight"] },
  "Bird Dog":                                    { p: ["Core"], s: ["Lower Back","Glutes","Stabilizers"], eq: ["bodyweight"] },
  "Bodyweight Squat":                            { p: ["Quads"], s: ["Glutes"], eq: ["bodyweight"] },
  "Bodyweight Squats":                           { p: ["Quads"], s: ["Glutes"], eq: ["bodyweight"] },
  "Box Jumps":                                   { p: ["Quads"], s: ["Glutes","Calves"], eq: ["box"] },
  "Box Step-ups":                                { p: ["Quads"], s: ["Glutes","Balance"], eq: ["box"] },
  "Burpees":                                     { p: ["Full Body"], s: ["Cardio","Chest","Quads"], eq: ["bodyweight"] },
  "Burpees (or step-back version)":              { p: ["Full Body"], s: ["Cardio","Chest","Quads"], eq: ["bodyweight"] },
  "Cable Curl":                                  { p: ["Biceps"], s: ["Forearms"], eq: ["cable"] },
  "Cable Curl + Pushdown":                       { p: ["Biceps","Triceps"], s: ["Forearms"], eq: ["cable"] },
  "Cable Fly":                                   { p: ["Chest"], s: ["Front Delts"], eq: ["cable"] },
  "Cable Lateral Raise":                         { p: ["Side Delts"], s: ["Traps"], eq: ["cable"] },
  "Cable Pushdown":                              { p: ["Triceps"], s: [], eq: ["cable"] },
  "Cable Row":                                   { p: ["Mid Back"], s: ["Lats","Biceps"], eq: ["cable"] },
  "Calf Raise":                                  { p: ["Calves"], s: [], eq: ["bodyweight","machine"] },
  "Calf Raises":                                 { p: ["Calves"], s: [], eq: ["bodyweight"] },
  "Calf Stretch (wall)":                         { p: ["Mobility"], s: ["Calves"], eq: ["wall"] },
  "Cat-Cow (slow)":                              { p: ["Mobility"], s: ["Lower Back","Core"], eq: ["bodyweight"] },
  "Cat-Cow Stretch":                             { p: ["Mobility"], s: ["Lower Back","Core"], eq: ["bodyweight"] },
  "Chair-Assisted Mini Squats":                  { p: ["Quads"], s: ["Glutes","Balance"], eq: ["chair","bodyweight"] },
  "Chest Stretch":                               { p: ["Mobility"], s: ["Chest"], eq: ["bodyweight"] },
  "Child's Pose":                                { p: ["Mobility"], s: ["Lower Back","Lats"], eq: ["bodyweight"] },
  "Childs Pose":                                 { p: ["Mobility"], s: ["Lower Back","Lats"], eq: ["bodyweight"] },
  "Clamshells (band optional)":                  { p: ["Hip Abductors"], s: ["Glutes"], eq: ["band","bodyweight"] },
  "Close Grip Bench":                            { p: ["Triceps"], s: ["Chest","Front Delts"], eq: ["barbell","bench"] },
  "Close Grip Bench Press":                      { p: ["Triceps"], s: ["Chest","Front Delts"], eq: ["barbell","bench"] },
  "Concentration Curl":                          { p: ["Biceps"], s: ["Forearms"], eq: ["dumbbell"] },
  "Cool Down Walk":                              { p: ["Recovery"], s: ["Cardio"], eq: ["none"] },
  "Cross-body Shoulder Stretch":                 { p: ["Mobility"], s: ["Rear Delts"], eq: ["bodyweight"] },
  "Dead Bug":                                    { p: ["Core"], s: ["Stabilizers"], eq: ["bodyweight"] },
  "Deadlift":                                    { p: ["Lower Back","Glutes"], s: ["Hamstrings","Traps","Core"], eq: ["barbell"] },
  "Deep Breathing":                              { p: ["Recovery"], s: [], eq: ["none"] },
  "Deep Breathing + Gentle Neck Stretch":        { p: ["Recovery"], s: ["Mobility"], eq: ["none"] },
  "Diaphragmatic Breathing (lying)":             { p: ["Recovery"], s: ["Core"], eq: ["none"] },
  "Doorway Chest Stretch":                       { p: ["Mobility"], s: ["Chest","Front Delts"], eq: ["doorway"] },
  "Double Unders / Jump Rope":                   { p: ["Calves"], s: ["Cardio"], eq: ["jump rope"] },
  "Dumbbell Curl":                               { p: ["Biceps"], s: ["Forearms"], eq: ["dumbbell"] },
  "Dumbbell Press":                              { p: ["Chest"], s: ["Triceps","Front Delts"], eq: ["dumbbell","bench"] },
  "Dumbbell Row":                                { p: ["Mid Back"], s: ["Lats","Biceps"], eq: ["dumbbell"] },
  "Dumbbell Shoulder Press":                     { p: ["Delts"], s: ["Triceps"], eq: ["dumbbell"] },
  "Elbow Circles":                               { p: ["Mobility"], s: [], eq: ["bodyweight"] },
  "Face Pulls":                                  { p: ["Rear Delts"], s: ["Rotator Cuff","Traps"], eq: ["cable"] },
  "Flat Dumbbell Press":                         { p: ["Chest"], s: ["Triceps","Front Delts"], eq: ["dumbbell","bench"] },
  "Foam Roller Calf Release":                    { p: ["Recovery"], s: ["Calves"], eq: ["foam roller"] },
  "Foam Roller Quad & IT Band Release":          { p: ["Recovery"], s: ["Quads"], eq: ["foam roller"] },
  "Foam Roller Quad (above knee only)":          { p: ["Recovery"], s: ["Quads"], eq: ["foam roller"] },
  "Foam Roller Thoracic Release":                { p: ["Recovery"], s: ["Mobility","Mid Back"], eq: ["foam roller"] },
  "Foam Roller Upper Back Release":              { p: ["Recovery"], s: ["Mobility","Mid Back"], eq: ["foam roller"] },
  "GHD Sit-ups":                                 { p: ["Core"], s: ["Hip Flexors"], eq: ["machine"] },
  "Gentle Walking":                              { p: ["Cardio"], s: ["Recovery"], eq: ["none"] },
  "Glute Bridge":                                { p: ["Glutes"], s: ["Hamstrings","Core"], eq: ["bodyweight"] },
  "Glute Bridge (warm-up reps)":                 { p: ["Glutes"], s: ["Hamstrings"], eq: ["bodyweight"] },
  "Glute Bridges":                               { p: ["Glutes"], s: ["Hamstrings","Core"], eq: ["bodyweight"] },
  "Goblet Squat":                                { p: ["Quads"], s: ["Glutes","Core"], eq: ["dumbbell","kettlebell"] },
  "Hack Squat / Leg Press":                      { p: ["Quads"], s: ["Glutes"], eq: ["machine"] },
  "Hammer Curl":                                 { p: ["Biceps"], s: ["Forearms"], eq: ["dumbbell"] },
  "Hamstring Stretch":                           { p: ["Mobility"], s: ["Hamstrings"], eq: ["bodyweight"] },
  "Hand Massage / Self Massage (forearms, hands)": { p: ["Recovery"], s: ["Forearms"], eq: ["none"] },
  "Hand Massager — Around Knee (not on joint)":  { p: ["Recovery"], s: ["Quads","Calves"], eq: ["massager"] },
  "Hand-held Massager — Lower Back & Legs":      { p: ["Recovery"], s: ["Lower Back"], eq: ["massager"] },
  "High Knees":                                  { p: ["Hip Flexors"], s: ["Cardio","Calves"], eq: ["bodyweight"] },
  "Hip Circles":                                 { p: ["Mobility"], s: ["Hip Flexors"], eq: ["bodyweight"] },
  "Hip Flexor Stretch":                          { p: ["Mobility"], s: ["Hip Flexors"], eq: ["bodyweight"] },
  "Hip Thrust":                                  { p: ["Glutes"], s: ["Hamstrings"], eq: ["barbell","bench"] },
  "Hyperextensions":                             { p: ["Lower Back"], s: ["Glutes","Hamstrings"], eq: ["machine"] },
  "Incline Barbell Press":                       { p: ["Upper Chest"], s: ["Front Delts","Triceps"], eq: ["barbell","bench"] },
  "Incline DB Press":                            { p: ["Upper Chest"], s: ["Front Delts","Triceps"], eq: ["dumbbell","bench"] },
  "Incline Dumbbell Press":                      { p: ["Upper Chest"], s: ["Front Delts","Triceps"], eq: ["dumbbell","bench"] },
  "Incline Push-ups (on table/wall)":            { p: ["Chest"], s: ["Triceps","Core"], eq: ["bodyweight"] },
  "Jump Rope":                                   { p: ["Calves"], s: ["Cardio"], eq: ["jump rope"] },
  "Jump Squats":                                 { p: ["Quads"], s: ["Glutes","Calves"], eq: ["bodyweight"] },
  "Jumping Jacks":                               { p: ["Cardio"], s: ["Calves","Delts"], eq: ["bodyweight"] },
  "Kettlebell Swing":                            { p: ["Glutes","Hamstrings"], s: ["Core","Cardio"], eq: ["kettlebell"] },
  "Knee Circles":                                { p: ["Mobility"], s: [], eq: ["bodyweight"] },
  "Knee Rocks (lying)":                          { p: ["Mobility"], s: ["Lower Back"], eq: ["bodyweight"] },
  "Knee-to-Chest Stretch":                       { p: ["Mobility"], s: ["Lower Back","Glutes"], eq: ["bodyweight"] },
  "Lateral Raises":                              { p: ["Side Delts"], s: ["Traps"], eq: ["dumbbell"] },
  "Leg Curl":                                    { p: ["Hamstrings"], s: [], eq: ["machine"] },
  "Leg Extension":                               { p: ["Quads"], s: [], eq: ["machine"] },
  "Leg Press":                                   { p: ["Quads"], s: ["Glutes"], eq: ["machine"] },
  "Leg Raises":                                  { p: ["Core"], s: ["Hip Flexors"], eq: ["bodyweight"] },
  "Leg Swings":                                  { p: ["Mobility"], s: ["Hamstrings","Hip Flexors"], eq: ["bodyweight"] },
  "Light Jog in Place":                          { p: ["Cardio"], s: ["Mobility"], eq: ["bodyweight"] },
  "Light Walk in Place":                         { p: ["Cardio"], s: ["Mobility"], eq: ["bodyweight"] },
  "Massager — Upper Trap & Shoulder":            { p: ["Recovery"], s: ["Traps"], eq: ["massager"] },
  "Modified Side Plank (knees down)":            { p: ["Obliques"], s: ["Core","Stabilizers"], eq: ["bodyweight"] },
  "Mountain Climbers":                           { p: ["Core"], s: ["Cardio","Front Delts"], eq: ["bodyweight"] },
  "Neck Rotations":                              { p: ["Mobility"], s: [], eq: ["bodyweight"] },
  "Neck Rotations (small range)":                { p: ["Mobility"], s: [], eq: ["bodyweight"] },
  "Neck Side Stretch":                           { p: ["Mobility"], s: ["Traps"], eq: ["bodyweight"] },
  "Overhead Press":                              { p: ["Delts"], s: ["Triceps","Core"], eq: ["barbell"] },
  "Overhead Tricep Ext":                         { p: ["Triceps"], s: [], eq: ["dumbbell","cable"] },
  "Overhead Tricep Extension":                   { p: ["Triceps"], s: [], eq: ["dumbbell","cable"] },
  "Pec Dec / Cable Fly":                         { p: ["Chest"], s: ["Front Delts"], eq: ["machine","cable"] },
  "Pelvic Tilts (lying)":                        { p: ["Core"], s: ["Lower Back","Mobility"], eq: ["bodyweight"] },
  "Pendulum Swing":                              { p: ["Mobility"], s: ["Rotator Cuff"], eq: ["bodyweight"] },
  "Pilates Ring Ankle Press":                    { p: ["Ankles"], s: ["Calves"], eq: ["pilates ring"] },
  "Pilates Ring Chest Press (seated)":           { p: ["Chest"], s: ["Front Delts"], eq: ["pilates ring"] },
  "Pilates Ring Inner Thigh Squeeze":            { p: ["Adductors"], s: ["Core"], eq: ["pilates ring"] },
  "Pilates Ring Knee Squeeze (seated)":          { p: ["Adductors"], s: ["Core"], eq: ["pilates ring"] },
  "Plank":                                       { p: ["Core"], s: ["Stabilizers"], eq: ["bodyweight"] },
  "Plank Shoulder Taps":                         { p: ["Core"], s: ["Front Delts","Stabilizers"], eq: ["bodyweight"] },
  "Power Clean":                                 { p: ["Full Body"], s: ["Glutes","Traps","Quads"], eq: ["barbell"] },
  "Preacher Curl":                               { p: ["Biceps"], s: ["Forearms"], eq: ["barbell","bench"] },
  "Prone Y-T-W Raises (no weight)":              { p: ["Rotator Cuff"], s: ["Rear Delts","Traps"], eq: ["bodyweight"] },
  "Pull-ups":                                    { p: ["Lats"], s: ["Biceps","Core"], eq: ["pull-up bar"] },
  "Pull-ups / Assisted Pull-ups":                { p: ["Lats"], s: ["Biceps","Core"], eq: ["pull-up bar","machine"] },
  "Pull-ups / Lat Pulldown":                     { p: ["Lats"], s: ["Biceps","Core"], eq: ["pull-up bar","cable"] },
  "Push-up Burpees":                             { p: ["Chest"], s: ["Quads","Core","Cardio"], eq: ["bodyweight"] },
  "Push-ups":                                    { p: ["Chest"], s: ["Triceps","Core"], eq: ["bodyweight"] },
  "Reverse Lunges":                              { p: ["Quads"], s: ["Glutes","Balance"], eq: ["bodyweight"] },
  "Romanian Deadlift":                           { p: ["Hamstrings"], s: ["Glutes","Lower Back"], eq: ["barbell"] },
  "Rowing Machine":                              { p: ["Cardio"], s: ["Mid Back","Quads"], eq: ["machine"] },
  "Russian Twists":                              { p: ["Obliques"], s: ["Core"], eq: ["bodyweight"] },
  "SS1A: Bench Press":                           { p: ["Chest"], s: ["Triceps","Front Delts"], eq: ["barbell","bench"] },
  "SS1A: OHP":                                   { p: ["Delts"], s: ["Triceps","Core"], eq: ["barbell"] },
  "SS1A: Squat":                                 { p: ["Quads"], s: ["Glutes","Core"], eq: ["barbell"] },
  "SS1B: Barbell Row":                           { p: ["Mid Back"], s: ["Lats","Biceps","Rear Delts"], eq: ["barbell"] },
  "SS1B: Leg Curl":                              { p: ["Hamstrings"], s: [], eq: ["machine"] },
  "SS1B: Pull-ups":                              { p: ["Lats"], s: ["Biceps","Core"], eq: ["pull-up bar"] },
  "SS2A: Barbell Curl":                          { p: ["Biceps"], s: ["Forearms"], eq: ["barbell"] },
  "SS2A: Incline DB Press":                      { p: ["Upper Chest"], s: ["Front Delts","Triceps"], eq: ["dumbbell","bench"] },
  "SS2A: Leg Press":                             { p: ["Quads"], s: ["Glutes"], eq: ["machine"] },
  "SS2B: Lat Pulldown":                          { p: ["Lats"], s: ["Biceps"], eq: ["cable"] },
  "SS2B: Romanian Deadlift":                     { p: ["Hamstrings"], s: ["Glutes","Lower Back"], eq: ["barbell"] },
  "SS2B: Skull Crusher":                         { p: ["Triceps"], s: [], eq: ["barbell","bench"] },
  "SS3A: Cable Fly":                             { p: ["Chest"], s: ["Front Delts"], eq: ["cable"] },
  "SS3A: Lateral Raise":                         { p: ["Side Delts"], s: ["Traps"], eq: ["dumbbell"] },
  "SS3A: Leg Extension":                         { p: ["Quads"], s: [], eq: ["machine"] },
  "SS3B: Calf Raise":                            { p: ["Calves"], s: [], eq: ["bodyweight","machine"] },
  "SS3B: Face Pull":                             { p: ["Rear Delts"], s: ["Rotator Cuff","Traps"], eq: ["cable"] },
  "SS3B: Tricep Pushdown":                       { p: ["Triceps"], s: [], eq: ["cable"] },
  "Scapular Squeeze":                            { p: ["Traps"], s: ["Rear Delts"], eq: ["bodyweight"] },
  "Seated Band Shoulder Pull-Apart":             { p: ["Rear Delts"], s: ["Traps","Rotator Cuff"], eq: ["band"] },
  "Seated Calf & Ankle Stretch":                 { p: ["Mobility"], s: ["Calves","Ankles"], eq: ["chair"] },
  "Seated Calf Raise":                           { p: ["Calves"], s: [], eq: ["machine"] },
  "Seated Chest Opener":                         { p: ["Mobility"], s: ["Chest","Front Delts"], eq: ["chair"] },
  "Seated DB Overhead Press":                    { p: ["Delts"], s: ["Triceps"], eq: ["dumbbell","bench"] },
  "Seated Deep Breathing":                       { p: ["Recovery"], s: [], eq: ["chair"] },
  "Seated Hamstring Stretch":                    { p: ["Mobility"], s: ["Hamstrings"], eq: ["chair","bodyweight"] },
  "Seated Knee Extensions (bodyweight)":         { p: ["Quads"], s: [], eq: ["bodyweight"] },
  "Seated Marching":                             { p: ["Hip Flexors"], s: ["Core","Cardio"], eq: ["chair","bodyweight"] },
  "Seated Resistance Band Row":                  { p: ["Mid Back"], s: ["Rear Delts","Biceps"], eq: ["band"] },
  "Seated Shoulder Rolls":                       { p: ["Mobility"], s: ["Traps"], eq: ["bodyweight"] },
  "Seated Torso Turns":                          { p: ["Mobility"], s: ["Obliques"], eq: ["chair","bodyweight"] },
  "Shoulder Rolls":                              { p: ["Mobility"], s: ["Traps"], eq: ["bodyweight"] },
  "Shoulder Rotations":                          { p: ["Mobility"], s: ["Traps"], eq: ["bodyweight"] },
  "Shoulder Stretch":                            { p: ["Mobility"], s: ["Rear Delts"], eq: ["bodyweight"] },
  "Single Leg Stand (hold support)":             { p: ["Balance"], s: ["Ankles","Glutes"], eq: ["bodyweight"] },
  "Sit-to-Stand (stand up quickly)":              { p: ["Quads"], s: ["Glutes","Balance"], eq: ["chair","bodyweight"] },
  "Table Inverted Row":                           { p: ["Mid Back"], s: ["Lats","Biceps"], eq: ["bodyweight"] },
  "Tandem Walk (heel-to-toe)":                    { p: ["Balance"], s: ["Ankles","Glutes"], eq: ["bodyweight"] },
  "Towel Door Row":                               { p: ["Mid Back"], s: ["Lats","Biceps"], eq: ["bodyweight"] },
  "Walk":                                         { p: ["Cardio"], s: ["Recovery"], eq: ["none"] },
  "Sit-to-Stand":                                { p: ["Quads"], s: ["Glutes","Balance"], eq: ["chair","bodyweight"] },
  "Skull Crushers":                              { p: ["Triceps"], s: [], eq: ["barbell","bench"] },
  "Slam Ball":                                   { p: ["Full Body"], s: ["Core","Cardio"], eq: ["slam ball"] },
  "Sprint":                                      { p: ["Cardio"], s: ["Hamstrings","Glutes","Quads"], eq: ["none"] },
  "Squat":                                       { p: ["Quads"], s: ["Glutes","Core"], eq: ["barbell"] },
  "Standing Calf Raise":                         { p: ["Calves"], s: [], eq: ["machine","bodyweight"] },
  "Standing Hip Circles (small)":                { p: ["Mobility"], s: ["Hip Flexors","Balance"], eq: ["bodyweight"] },
  "Standing Quad Stretch":                       { p: ["Mobility"], s: ["Quads"], eq: ["bodyweight"] },
  "Standing Quad Stretch (with support)":        { p: ["Mobility"], s: ["Quads"], eq: ["bodyweight"] },
  "Standing Wall Push-ups":                      { p: ["Chest"], s: ["Triceps","Front Delts"], eq: ["wall","bodyweight"] },
  "Stationary Bike or Light Walk":               { p: ["Cardio"], s: ["Quads"], eq: ["bike"] },
  "Stationary Bike or Pool Walking":             { p: ["Cardio"], s: ["Quads"], eq: ["bike","pool"] },
  "Step-ups":                                    { p: ["Quads"], s: ["Glutes","Balance"], eq: ["box","bodyweight"] },
  "Step-ups (low step, controlled)":             { p: ["Quads"], s: ["Glutes","Balance"], eq: ["box","bodyweight"] },
  "Stiff Leg Deadlift":                          { p: ["Hamstrings"], s: ["Glutes","Lower Back"], eq: ["barbell"] },
  "Straight Arm Pulldown":                       { p: ["Lats"], s: ["Core"], eq: ["cable"] },
  "Straight Leg Raises":                         { p: ["Quads"], s: ["Hip Flexors","Core"], eq: ["bodyweight"] },
  "Straight Leg Raises (lying)":                 { p: ["Quads"], s: ["Hip Flexors","Core"], eq: ["bodyweight"] },
  "Sumo Deadlift":                               { p: ["Glutes","Quads"], s: ["Lower Back","Adductors"], eq: ["barbell"] },
  "Superman Hold":                               { p: ["Lower Back"], s: ["Glutes"], eq: ["bodyweight"] },
  "Supine Figure-4 Glute Stretch":               { p: ["Mobility"], s: ["Glutes","Hip Abductors"], eq: ["bodyweight"] },
  "T-Bar Row":                                   { p: ["Mid Back"], s: ["Lats","Biceps"], eq: ["barbell","machine"] },
  "Thrusters (Barbell 42.5kg)":                  { p: ["Quads","Delts"], s: ["Glutes","Cardio"], eq: ["barbell"] },
  "Thrusters (DB)":                              { p: ["Quads","Delts"], s: ["Glutes","Cardio"], eq: ["dumbbell"] },
  "Torso Rotations":                             { p: ["Mobility"], s: ["Obliques"], eq: ["bodyweight"] },
  "Tricep Dips":                                 { p: ["Triceps"], s: ["Chest","Front Delts"], eq: ["bodyweight"] },
  "Tricep Dips (chair)":                         { p: ["Triceps"], s: ["Chest","Front Delts"], eq: ["chair","bodyweight"] },
  "Tricep Pushdown":                             { p: ["Triceps"], s: [], eq: ["cable"] },
  "Upper Trap Stretch":                          { p: ["Mobility"], s: ["Traps"], eq: ["bodyweight"] },
  "Walking Lunges":                              { p: ["Quads"], s: ["Glutes","Balance"], eq: ["dumbbell","bodyweight"] },
  "Wall Sit":                                    { p: ["Quads"], s: ["Glutes"], eq: ["wall","bodyweight"] },
  "Wall Sit (shallow angle only)":               { p: ["Quads"], s: ["Glutes"], eq: ["wall","bodyweight"] },
  "Wall Slides":                                 { p: ["Traps"], s: ["Rotator Cuff","Delts"], eq: ["wall"] },
  "Wall Slides (small range)":                   { p: ["Traps"], s: ["Rotator Cuff","Delts"], eq: ["wall"] },
  "Warm-up Jog":                                 { p: ["Cardio"], s: ["Mobility"], eq: ["none"] },
  "Weighted Pull-ups":                           { p: ["Lats"], s: ["Biceps","Core"], eq: ["pull-up bar"] },
  "Wrist Circles":                               { p: ["Mobility"], s: ["Forearms"], eq: ["bodyweight"] }
};

export function getExerciseEquipment(name) {
  const m = EXERCISE_META[name];
  return m ? m.eq : [];
}

// Does this movement take external load at all?
//
// A weight box in front of a Glute Bridge or a Plank is noise, and noise is
// what makes people stop logging. But bodyweight movements ARE sometimes
// loaded — a dumbbell across the hips, ankle weights, a vest — so the player
// hides the box rather than removing the option.
//
// An unknown name counts as loaded, on purpose: an extra box on a bodyweight
// move is a small annoyance, a missing box on a barbell lift loses the number
// that matters.
// Things you hold on to or lie on, rather than things you load. A pull-up bar
// belongs here: a pull-up is bodyweight. Bands too — nobody records a band in
// kilos. If an exercise needs BOTH a bench and a barbell it still counts as
// loaded, because only the barbell has to be unloaded for that to be true.
const UNLOADED_EQ = new Set([
  "bodyweight", "mat", "chair", "wall", "towel", "table", "box", "step",
  "pull-up bar", "dip bars", "parallel bars", "band", "bench", "foam roller",
]);

export function usesExternalLoad(name) {
  // The name wins when it says so outright. "Weighted Pull-ups" is tagged with
  // a pull-up bar like any other pull-up; the word is the only thing that
  // distinguishes it.
  if (/\b(weighted|loaded)\b/i.test(String(name || ""))) return true;

  const eq = getExerciseEquipment(name);
  if (!eq || !eq.length) return guessLoadFromName(name);
  return !eq.every((e) => UNLOADED_EQ.has(String(e).toLowerCase()));
}

function guessLoadFromName(name) {
  const l = String(name || "").toLowerCase();
  if (/(barbell|dumbbell|db |cable|machine|smith|kettlebell|plate|weighted|ez[- ]bar|landmine)/.test(l)) return true;
  if (/(stretch|plank|hold|walk|jog|breathing|rotation|circle|swing|pose|mobility|march|balance|bird dog|dead bug|superman|clamshell|wall sit|crunch|sit-up|situp|push-up|pushup|pull-up|pullup|dip|burpee|jumping jack|mountain climber|bridge|leg raise|air squat|bodyweight)/.test(l)) return false;
  return true;
}
