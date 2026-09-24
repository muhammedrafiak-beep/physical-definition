/* global __PD_ENV__ */
// P0: on a Vercel Preview every write is refused by the API (the Preview uses
// the production database). This strip says so up front. __PD_ENV__ is
// VERCEL_ENV at build time (vite.config.js); it is "production" on the live
// site, where nothing renders.
const ENV = typeof __PD_ENV__ !== "undefined" ? __PD_ENV__ : "";

export function PreviewBanner() {
  if (ENV !== "preview") return null;
  return (
    <div role="status" style={{
      background: "#7A4E14", color: "#FFFFFF", fontSize: 13, fontWeight: 600, textAlign: "center",
      padding: "calc(env(safe-area-inset-top, 0px) + 6px) 12px 6px", lineHeight: 1.35,
    }}>
      Preview: changes are not saved.
    </div>
  );
}
