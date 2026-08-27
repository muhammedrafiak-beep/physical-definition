import { Icon } from "./Icons";
import { useMedia, photoUrl } from "./media";

// The photo for one exercise.
//
// This used to hold a 60-line ladder of `if (name.includes("squat")) return
// barbell_squat.jpeg` — which is why every squat variant in the library, the
// chair-assisted mini squats an 80-year-old is shown included, illustrated
// itself with a loaded barbell back squat. The mapping is a table now, edited
// from the admin Library screen, and the lookup below is on the exact name.

export function ExerciseIllustration({ exerciseId, size = 120 }) {
  const media = useMedia();
  const img = photoUrl(media, exerciseId);

  // The placeholder has to work on the light screens AND inside the dark
  // player, so it paints nothing of its own: a dashed rule and a mark, both
  // in the inherited colour at low opacity.
  if (!img) return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: size * 2.2, minHeight: 108, border: "1px dashed currentColor", opacity: 0.35, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Icon n="dumbbell" s={24} />
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".03em" }}>
          {media.loaded ? "No photo yet" : "\u00a0"}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <img
        src={img}
        alt={exerciseId}
        style={{ width: "100%", maxWidth: size * 2.2, height: "auto", borderRadius: 8, display: "block", background: "#fff" }}
        onError={e => { e.target.style.display = "none"; }}
      />
    </div>
  );
}
