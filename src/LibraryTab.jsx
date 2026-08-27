import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { G } from "./theme";
import { Icon } from "./Icons";

// The admin Library screen: which photo and which video every exercise shows,
// changed from the app instead of from a source file.
//
// What this replaced: three hardcoded substring ladders across three files.
// Adding one photo meant a commit, a push and a deploy — and substring
// matching cannot tell "close enough" from "wrong", so every squat variant in
// the library resolved to a loaded barbell back squat, the chair-assisted mini
// squats in the senior programme included, while "Dumbbell Curl" showed
// nothing at all with the right file already sitting in the bucket.
//
// Everything carried over from those ladders arrives here UNVERIFIED. That is
// the point of the screen: the wrong ones are only findable by a person who
// knows the movement, looking at the picture.

const KINDS = {
  photo: { label: "Photo", accept: "image/jpeg,image/png,image/webp", max: 8 },
  video: { label: "Video", accept: "video/mp4,video/webm,video/quicktime", max: 60 },
};

const mediaPost = async (payload, token) => {
  const r = await fetch("/api/admin-media", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
};

// The bytes go straight from the browser to Storage, never through the API
// function: a Vercel function body caps around 4.5 MB and the demo videos are
// larger than that.
async function putToSignedUrl(url, file) {
  // Storage accepts a signed upload either as a raw body or as multipart. The
  // raw body is simpler; the official client uses multipart in browsers, so
  // that is the fallback if a gateway anywhere in between dislikes the first.
  const direct = await fetch(url, {
    method: "PUT",
    headers: {
      "content-type": file.type || "application/octet-stream",
      "cache-control": "max-age=31536000",
    },
    body: file,
  });
  if (direct.ok) return;

  const form = new FormData();
  form.append("cacheControl", "31536000");
  form.append("", file);
  const multi = await fetch(url, { method: "PUT", body: form });
  if (!multi.ok) {
    const msg = await multi.text().catch(() => "");
    throw new Error(msg.slice(0, 140) || `Upload failed (${multi.status})`);
  }
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "nophoto", label: "No photo" },
  { id: "novideo", label: "No video" },
  { id: "unverified", label: "Not checked" },
];

export function LibraryTab({ token }) {
  const [rows, setRows] = useState(null);
  const [base, setBase] = useState({ photo: "", video: "" });
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("nophoto");
  const [busy, setBusy] = useState({});      // `${name}|${kind}` -> "uploading" | "saving"
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => {
    setErr("");
    try {
      const d = await mediaPost({ action: "list" }, token);
      setRows(d.media || []);
      const root = `${d.storageUrl}/object/public`;
      setBase({ photo: `${root}/${d.buckets.photo}`, video: `${root}/${d.buckets.video}` });
    } catch (e) {
      setErr(e.message);
      setRows([]);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const r = rows || [];
    return {
      total: r.length,
      nophoto: r.filter((x) => !x.photo).length,
      novideo: r.filter((x) => !x.video).length,
      unverified: r.filter((x) => (x.photo && !x.photoVerified) || (x.video && !x.videoVerified)).length,
    };
  }, [rows]);

  const shown = useMemo(() => {
    let r = rows || [];
    const needle = q.trim().toLowerCase();
    if (needle) r = r.filter((x) => x.name.toLowerCase().includes(needle));
    if (filter === "nophoto") r = r.filter((x) => !x.photo);
    if (filter === "novideo") r = r.filter((x) => !x.video);
    if (filter === "unverified") r = r.filter((x) => (x.photo && !x.photoVerified) || (x.video && !x.videoVerified));
    return r;
  }, [rows, q, filter]);

  const patch = (media) => setRows((prev) => (prev || []).map((x) => (x.name === media.name ? media : x)));
  const mark = (name, kind, v) => setBusy((b) => ({ ...b, [`${name}|${kind}`]: v }));

  const upload = async (name, kind, file) => {
    if (!file) return;
    const limit = KINDS[kind].max * 1024 * 1024;
    if (file.size > limit) {
      setErr(`${file.name} is ${(file.size / 1048576).toFixed(1)} MB — the limit for a ${kind} is ${KINDS[kind].max} MB.`);
      return;
    }
    setErr("");
    mark(name, kind, "uploading");
    try {
      const sign = await mediaPost(
        { action: "sign_upload", kind, exercise_name: name, filename: file.name, size: file.size }, token);
      await putToSignedUrl(sign.url, file);
      mark(name, kind, "saving");
      const d = await mediaPost({ action: "commit", kind, exercise_name: name, path: sign.path }, token);
      patch(d.media);
    } catch (e) {
      setErr(`${name}: ${e.message}`);
    } finally {
      mark(name, kind, null);
    }
  };

  const simple = async (name, kind, action) => {
    mark(name, kind, "saving");
    try {
      const d = await mediaPost({ action, kind, exercise_name: name }, token);
      patch(d.media);
    } catch (e) {
      setErr(`${name}: ${e.message}`);
    } finally {
      mark(name, kind, null);
    }
  };

  if (rows === null) return <div style={{ padding: 28, color: G.muted, fontSize: 13 }}>Loading the library…</div>;

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: G.text, fontFamily: "'Instrument Serif',Georgia,serif" }}>
          Library
        </div>
        <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>
          {counts.total} exercises · {counts.nophoto} without a photo · {counts.novideo} without a video
        </div>
      </div>

      {/* Everything the old ladders produced is unchecked until somebody who
          knows the movement has looked at the picture. */}
      {counts.unverified > 0 && filter !== "unverified" && (
        <div style={{ background: G.amberSoft, border: `1px solid ${G.amberLine}`, borderRadius: 12, padding: "11px 13px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12.5, color: G.amber, fontWeight: 600 }}>
            {counts.unverified} carried over from the old code and never checked.
          </div>
          <button className="btn" onClick={() => setFilter("unverified")}
            style={{ padding: "7px 13px", fontSize: 12, fontWeight: 600, borderRadius: 10, background: "#fff", color: G.amber, border: `1px solid ${G.amberLine}` }}>
            Check them
          </button>
        </div>
      )}

      {err && (
        <div style={{ background: G.redSoft, border: `1px solid ${G.redLine}`, borderRadius: 12, padding: "10px 13px", marginBottom: 12, fontSize: 12.5, color: G.red }}>
          {err}
        </div>
      )}

      <input className="inp" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Search the library…" style={{ marginBottom: 10 }} />

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {FILTERS.map((f) => {
          const on = filter === f.id;
          const n = f.id === "all" ? counts.total : counts[f.id];
          return (
            <button key={f.id} className="btn" onClick={() => setFilter(f.id)}
              style={{ padding: "7px 13px", fontSize: 12, fontWeight: 600, borderRadius: 20,
                background: on ? G.accent : "#fff", color: on ? "#fff" : G.muted,
                border: `1px solid ${on ? G.accent : G.border}` }}>
              {f.label} {n}
            </button>
          );
        })}
      </div>

      {shown.length === 0 && (
        <div style={{ textAlign: "center", padding: "38px 20px", color: G.muted, fontSize: 13 }}>
          <Icon n="dumbbell" s={26} c={G.dim} />
          <div style={{ marginTop: 8 }}>Nothing here — that filter is empty.</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {shown.map((r) => (
          <Row key={r.name} r={r} base={base} busy={busy}
            onUpload={upload} onSimple={simple} onPreview={setPreview} />
        ))}
      </div>

      {preview && (
        <div onClick={() => setPreview(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(14,32,53,0.62)", backdropFilter: "blur(6px)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card" onClick={(e) => e.stopPropagation()}
            style={{ padding: 16, maxWidth: 460, width: "100%" }}>
            <div style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: G.muted, fontWeight: 700, marginBottom: 8 }}>
              What the client sees
            </div>
            {preview.kind === "video"
              ? <video src={preview.src} controls autoPlay loop muted playsInline style={{ width: "100%", borderRadius: 10, display: "block", background: "#000" }} />
              : <img src={preview.src} alt={preview.name} style={{ width: "100%", borderRadius: 10, display: "block" }} />}
            <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginTop: 10 }}>{preview.name}</div>
            <button className="btn" onClick={() => setPreview(null)}
              style={{ marginTop: 12, width: "100%", minHeight: 46, borderRadius: 12, background: G.soft, color: G.text, fontWeight: 600, fontSize: 13, border: `1px solid ${G.border}` }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ r, base, busy, onUpload, onSimple, onPreview }) {
  const photoSrc = r.photo ? `${base.photo}/${r.photo}` : null;
  const videoSrc = r.video ? `${base.video}/${r.video}` : null;

  return (
    <div className="card" style={{ padding: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
      <button className="btn" onClick={() => photoSrc && onPreview({ kind: "photo", src: photoSrc, name: r.name })}
        style={{ width: 62, height: 62, flexShrink: 0, borderRadius: 10, overflow: "hidden",
          border: `1px solid ${G.border}`, background: G.soft, padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: photoSrc ? "zoom-in" : "default" }}>
        {photoSrc
          ? <img src={photoSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <Icon n="dumbbell" s={18} c={G.dim} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: G.text, lineHeight: 1.3 }}>{r.name}</div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5, marginBottom: 8 }}>
          <Tag ok={!!r.photo} verified={r.photoVerified} label="Photo" />
          <Tag ok={!!r.video} verified={r.videoVerified} label="Video" />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Controls kind="photo" r={r} busy={busy} src={photoSrc}
            onUpload={onUpload} onSimple={onSimple} onPreview={onPreview} />
          <Controls kind="video" r={r} busy={busy} src={videoSrc}
            onUpload={onUpload} onSimple={onSimple} onPreview={onPreview} />
        </div>
      </div>
    </div>
  );
}

function Tag({ ok, verified, label }) {
  const [bg, line, fg, text] = !ok
    ? [G.soft, G.border, G.muted, `No ${label.toLowerCase()}`]
    : verified
      ? [G.greenSoft, G.greenLine, G.green, `${label} ✓`]
      : [G.amberSoft, G.amberLine, G.amber, `${label} — not checked`];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".02em", padding: "3px 8px", borderRadius: 20, background: bg, color: fg, border: `1px solid ${line}` }}>
      {text}
    </span>
  );
}

function Controls({ kind, r, busy, src, onUpload, onSimple, onPreview }) {
  const ref = useRef(null);
  const state = busy[`${r.name}|${kind}`];
  const has = kind === "photo" ? !!r.photo : !!r.video;
  const verified = kind === "photo" ? r.photoVerified : r.videoVerified;
  const K = KINDS[kind];

  const btn = (label, onClick, tone) => (
    <button className="btn" onClick={onClick} disabled={!!state}
      style={{ padding: "6px 11px", fontSize: 11.5, fontWeight: 600, borderRadius: 9,
        opacity: state ? 0.5 : 1,
        background: tone === "solid" ? G.accent : "#fff",
        color: tone === "solid" ? "#fff" : tone === "danger" ? G.red : G.muted,
        border: `1px solid ${tone === "solid" ? G.accent : tone === "danger" ? G.redLine : G.border}` }}>
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      <input ref={ref} type="file" accept={K.accept} style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; onUpload(r.name, kind, f); }} />

      {state
        ? <span style={{ fontSize: 11.5, color: G.muted, fontWeight: 600, padding: "6px 4px" }}>
            {state === "uploading" ? `Uploading ${kind}…` : "Saving…"}
          </span>
        : (
          <>
            {btn(has ? `Replace ${kind}` : `Add ${kind}`, () => ref.current?.click(), has ? "quiet" : "solid")}
            {has && !verified && btn("Right", () => onSimple(r.name, kind, "confirm"))}
            {has && src && kind === "video" && btn("Play", () => onPreview({ kind, src, name: r.name }))}
            {has && btn("Remove", () => onSimple(r.name, kind, "clear"), "danger")}
          </>
        )}
    </div>
  );
}
