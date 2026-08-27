import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { G } from "./theme";
import { Icon } from "./Icons";
import { WORKOUT_SYSTEMS } from "./workouts";
import { resolveWarmup, resolveCooldown } from "./WorkoutPlayer";

// The admin Library screen: which photo and which video every exercise shows,
// changed from the app instead of from a source file.
//
// What this replaced: four hardcoded substring ladders across three files.
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

// ── Shrinking ──────────────────────────────────────────────
//
// A photo straight off a phone is 4–8 MB, and whatever is uploaded is what
// every client downloads, on mobile data, in a gym. Nothing on these screens
// is displayed wider than about 600 CSS pixels, so a 1400px long edge is
// already generous. Videos are left alone — re-encoding one in a browser tab
// is slow enough to look broken, and they were shot small to begin with.
const MAX_EDGE = 1400;

async function shrinkImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const longest = Math.max(bmp.width, bmp.height);
    const scale = Math.min(1, MAX_EDGE / longest);
    // Already small in both senses: leave it exactly as it is rather than
    // re-encoding a good file into a slightly worse one.
    if (scale === 1 && file.size < 400 * 1024) { bmp.close?.(); return file; }

    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bmp.close?.(); return file; }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();

    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.82));
    if (!blob || blob.size >= file.size) return file;   // no gain, keep the original
    const base = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;   // no createImageBitmap, a corrupt file — upload it as it came
  }
}

const mb = (n) => `${(n / 1048576).toFixed(n < 1048576 ? 2 : 1)} MB`;

// The bytes go straight from the browser to Storage, never through the API
// function: a Vercel function body caps around 4.5 MB and the demo videos are
// larger than that.
async function putToSignedUrl(url, file) {
  // Storage accepts a signed upload either as a raw body or as multipart. The
  // raw body is simpler; the official client uses multipart in browsers, so
  // that is the fallback if a gateway anywhere in between dislikes the first.
  const direct = await fetch(url, {
    method: "PUT",
    headers: { "content-type": file.type || "application/octet-stream", "cache-control": "max-age=31536000" },
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

// ── Matching a dropped file to an exercise ─────────────────
//
// Rafi has a folder of clips named after the movements. 171 exercises have no
// video; picking them one at a time through a file dialog is not a thing a
// person will finish. So: drop the folder, and match on the names.
//
// Note the doubled extensions — every video already in the bucket is called
// something.mp4.mp4 — which is why this strips extensions repeatedly.
const norm = (s) =>
  String(s || "")
    .replace(/(\.(mp4|mov|webm|m4v|jpe?g|png|webp))+$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

function matchFiles(files, rows) {
  const byExact = new Map();
  for (const r of rows) {
    const k = norm(r.name);
    if (!byExact.has(k)) byExact.set(k, r.name);
  }
  return files.map((file) => {
    const k = norm(file.name);
    const exact = byExact.get(k);
    if (exact) return { file, name: exact, how: "exact" };

    // One-sided containment, and only when it is unambiguous. "pushups"
    // matching both "Push-ups" and "Push-up Burpees" is not a match, it is a
    // guess, and a guess here silently puts the wrong clip on an exercise.
    const near = rows.filter((r) => {
      const rk = norm(r.name);
      return rk.length > 3 && k.length > 3 && (rk.startsWith(k) || k.startsWith(rk));
    });
    if (near.length === 1) return { file, name: near[0].name, how: "close" };
    return { file, name: "", how: near.length > 1 ? "ambiguous" : "none" };
  });
}

const FILTERS = [
  { id: "inuse", label: "In use now" },
  { id: "nophoto", label: "No photo" },
  { id: "novideo", label: "No video" },
  { id: "unverified", label: "Not checked" },
  { id: "all", label: "All" },
];

// Every exercise name a system can put in front of somebody, including the
// warm-up and cool-down it resolves to and any alternate-day-count variant.
function namesInSystem(sys) {
  const out = new Set();
  const eat = (days) => (days || []).forEach((d) => (d.exercises || []).forEach((e) => out.add(e.name)));
  eat(sys.days);
  for (const v of Object.values(sys.schedules || {})) eat(v);
  for (const e of resolveWarmup(sys)) out.add(e.name);
  for (const e of resolveCooldown(sys)) out.add(e.name);
  return out;
}

export function LibraryTab({ token, clients }) {
  const [rows, setRows] = useState(null);
  const [base, setBase] = useState({ photo: "", video: "" });
  const [bucket, setBucket] = useState({ photo: null, video: null });
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("inuse");
  const [busy, setBusy] = useState({});      // `${name}|${kind}` -> "uploading" | "saving"
  const [preview, setPreview] = useState(null);
  const [picker, setPicker] = useState(null); // { name, kind }
  const [bulk, setBulk] = useState(null);     // { kind, items, running, done }
  const [dragging, setDragging] = useState(false);

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

  // What his clients are actually on. A photo for an exercise nobody is
  // scheduled to see is real work spent on nothing, so this is the default
  // filter rather than a nicety.
  const inUse = useMemo(() => {
    const ids = new Set((clients || [])
      .filter((c) => (c.status || "").toLowerCase() !== "disabled")
      .map((c) => c.workoutSystemId || c.workout_system_id)
      .filter(Boolean));
    const out = new Set();
    for (const sys of WORKOUT_SYSTEMS) {
      if (!ids.has(sys.id)) continue;
      for (const n of namesInSystem(sys)) out.add(n);
    }
    return out;
  }, [clients]);

  const counts = useMemo(() => {
    const r = rows || [];
    const u = (x) => (x.photo && !x.photoVerified) || (x.video && !x.videoVerified);
    return {
      all: r.length,
      inuse: r.filter((x) => inUse.has(x.name)).length,
      nophoto: r.filter((x) => !x.photo).length,
      novideo: r.filter((x) => !x.video).length,
      unverified: r.filter(u).length,
      inuseGap: r.filter((x) => inUse.has(x.name) && (!x.photo || !x.video)).length,
    };
  }, [rows, inUse]);

  const shown = useMemo(() => {
    let r = rows || [];
    const needle = q.trim().toLowerCase();
    if (needle) r = r.filter((x) => x.name.toLowerCase().includes(needle));
    if (filter === "inuse") r = r.filter((x) => inUse.has(x.name));
    if (filter === "nophoto") r = r.filter((x) => !x.photo);
    if (filter === "novideo") r = r.filter((x) => !x.video);
    if (filter === "unverified") r = r.filter((x) => (x.photo && !x.photoVerified) || (x.video && !x.videoVerified));
    // What his clients will see first, first.
    return [...r].sort((a, b) => (inUse.has(b.name) ? 1 : 0) - (inUse.has(a.name) ? 1 : 0) || a.name.localeCompare(b.name));
  }, [rows, q, filter, inUse]);

  const patch = (media) => setRows((prev) => (prev || []).map((x) => (x.name === media.name ? media : x)));
  const mark = (name, kind, v) => setBusy((b) => ({ ...b, [`${name}|${kind}`]: v }));

  const loadBucket = useCallback(async (kind) => {
    if (bucket[kind]) return bucket[kind];
    const d = await mediaPost({ action: "files", kind }, token);
    setBucket((b) => ({ ...b, [kind]: d.files || [] }));
    return d.files || [];
  }, [bucket, token]);

  // One file onto one exercise.
  const upload = async (name, kind, raw) => {
    if (!raw) return;
    setErr(""); setNote("");
    mark(name, kind, "uploading");
    try {
      const file = kind === "photo" ? await shrinkImage(raw) : raw;
      if (file !== raw) setNote(`${raw.name}: ${mb(raw.size)} → ${mb(file.size)}`);

      const limit = KINDS[kind].max * 1024 * 1024;
      if (file.size > limit) throw new Error(`${mb(file.size)} — the limit for a ${kind} is ${KINDS[kind].max} MB.`);

      const sign = await mediaPost(
        { action: "sign_upload", kind, exercise_name: name, filename: file.name, size: file.size }, token);
      await putToSignedUrl(sign.url, file);
      mark(name, kind, "saving");
      const d = await mediaPost({ action: "commit", kind, exercise_name: name, path: sign.path }, token);
      patch(d.media);
      setBucket((b) => ({ ...b, [kind]: null }));   // the bucket listing is stale now
    } catch (e) {
      setErr(`${name}: ${e.message}`);
    } finally {
      mark(name, kind, null);
    }
  };

  const simple = async (name, kind, action, extra = {}) => {
    mark(name, kind, "saving");
    try {
      const d = await mediaPost({ action, kind, exercise_name: name, ...extra }, token);
      patch(d.media);
    } catch (e) {
      setErr(`${name}: ${e.message}`);
    } finally {
      mark(name, kind, null);
      setPicker(null);
    }
  };

  // ── Many files at once ───────────────────────────────────
  const startBulk = async (fileList) => {
    const files = [...fileList];
    if (!files.length) return;
    const kind = files.every((f) => f.type.startsWith("video/")) ? "video"
      : files.every((f) => f.type.startsWith("image/")) ? "photo" : null;
    if (!kind) {
      setErr("Drop photos or videos, not both at once — they go to different places.");
      return;
    }
    setErr("");
    setBulk({ kind, items: matchFiles(files, rows || []), running: false, done: 0 });
  };

  const runBulk = async () => {
    const kind = bulk.kind;
    const queue = bulk.items.filter((i) => i.name);
    setBulk((b) => ({ ...b, running: true, done: 0 }));
    let done = 0, failed = [];
    for (const item of queue) {
      try {
        const file = kind === "photo" ? await shrinkImage(item.file) : item.file;
        const sign = await mediaPost(
          { action: "sign_upload", kind, exercise_name: item.name, filename: file.name, size: file.size }, token);
        await putToSignedUrl(sign.url, file);
        const d = await mediaPost({ action: "commit", kind, exercise_name: item.name, path: sign.path }, token);
        patch(d.media);
      } catch (e) {
        failed.push(`${item.file.name}: ${e.message}`);
      }
      done += 1;
      setBulk((b) => (b ? { ...b, done } : b));
    }
    setBucket((b) => ({ ...b, [kind]: null }));
    setBulk(null);
    setNote(`${queue.length - failed.length} of ${queue.length} uploaded.`);
    if (failed.length) setErr(failed.slice(0, 4).join(" · "));
  };

  if (rows === null) return <div style={{ padding: 28, color: G.muted, fontSize: 13 }}>Loading the library…</div>;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setDragging(false); startBulk(e.dataTransfer.files); }}
      style={{ position: "relative", minHeight: 400 }}
    >
      {dragging && (
        <div style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(33,80,155,0.10)", border: `2px dashed ${G.accent}`, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div className="card" style={{ padding: "18px 26px", fontSize: 14, fontWeight: 600, color: G.accent }}>
            Drop them here — I'll match each file to its exercise
          </div>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: G.text, fontFamily: "'Instrument Serif',Georgia,serif" }}>
          Library
        </div>
        <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>
          {counts.all} exercises · {counts.nophoto} without a photo · {counts.novideo} without a video
          {counts.inuseGap > 0 && <> · <strong style={{ color: G.amber }}>{counts.inuseGap} of those are in a programme somebody is on</strong></>}
        </div>
        <div style={{ fontSize: 12, color: G.muted, marginTop: 6 }}>
          Drop a whole folder anywhere on this screen to do many at once.
        </div>
      </div>

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

      {err && <Banner tone="red" text={err} onClose={() => setErr("")} />}
      {note && <Banner tone="green" text={note} onClose={() => setNote("")} />}

      <input className="inp" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Search the library…" style={{ marginBottom: 10 }} />

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <button key={f.id} className="btn" onClick={() => setFilter(f.id)}
              style={{ padding: "7px 13px", fontSize: 12, fontWeight: 600, borderRadius: 20,
                background: on ? G.accent : "#fff", color: on ? "#fff" : G.muted,
                border: `1px solid ${on ? G.accent : G.border}` }}>
              {f.label} {counts[f.id]}
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
          <Row key={r.name} r={r} base={base} busy={busy} used={inUse.has(r.name)}
            onUpload={upload} onSimple={simple} onPreview={setPreview} onPick={setPicker} />
        ))}
      </div>

      {picker && (
        <BucketPicker picker={picker} base={base} loadBucket={loadBucket}
          onClose={() => setPicker(null)}
          onChoose={(path) => simple(picker.name, picker.kind, "reuse", { path })} />
      )}

      {bulk && (
        <BulkReview bulk={bulk} rows={rows} setBulk={setBulk} onRun={runBulk} onCancel={() => setBulk(null)} />
      )}

      {preview && (
        <Sheet onClose={() => setPreview(null)} mw={460}>
          <div style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: G.muted, fontWeight: 700, marginBottom: 8 }}>
            What the client sees
          </div>
          {preview.kind === "video"
            ? <video src={preview.src} controls autoPlay loop muted playsInline style={{ width: "100%", borderRadius: 10, display: "block", background: "#000" }} />
            : <img src={preview.src} alt={preview.name} style={{ width: "100%", borderRadius: 10, display: "block" }} />}
          <div style={{ fontSize: 14, fontWeight: 600, color: G.text, marginTop: 10 }}>{preview.name}</div>
        </Sheet>
      )}
    </div>
  );
}

// ── Pieces ─────────────────────────────────────────────────

function Banner({ tone, text, onClose }) {
  const [bg, line, fg] = tone === "red"
    ? [G.redSoft, G.redLine, G.red] : [G.greenSoft, G.greenLine, G.green];
  return (
    <div style={{ background: bg, border: `1px solid ${line}`, borderRadius: 12, padding: "10px 13px", marginBottom: 12, fontSize: 12.5, color: fg, display: "flex", justifyContent: "space-between", gap: 10 }}>
      <span>{text}</span>
      <button className="btn" onClick={onClose} aria-label="Dismiss"
        style={{ background: "none", color: fg, fontWeight: 700, padding: 0, lineHeight: 1 }}>✕</button>
    </div>
  );
}

function Sheet({ children, onClose, mw = 560 }) {
  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(14,32,53,0.62)", backdropFilter: "blur(6px)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card" onClick={(e) => e.stopPropagation()}
        style={{ padding: 18, maxWidth: mw, width: "100%", maxHeight: "86vh", overflowY: "auto", position: "relative" }}>
        <button className="btn" onClick={onClose} aria-label="Close"
          style={{ position: "absolute", top: 12, insetInlineEnd: 12, width: 36, height: 36, borderRadius: 10, background: G.soft, color: G.muted, border: `1px solid ${G.border}`, fontWeight: 700 }}>✕</button>
        <div style={{ paddingInlineEnd: 40 }}>{children}</div>
      </div>
    </div>
  );
}

// Point an exercise at a file that is already in the bucket. This is how the
// 74 empty ones mostly get filled: the right picture usually exists already
// under another exercise's name — Dumbbell Curl wants the file Barbell Curl is
// using, and shooting it again would be silly.
function BucketPicker({ picker, base, loadBucket, onClose, onChoose }) {
  const [files, setFiles] = useState(null);
  const [q, setQ] = useState("");
  useEffect(() => { loadBucket(picker.kind).then(setFiles).catch(() => setFiles([])); }, [picker.kind, loadBucket]);

  const shown = (files || []).filter((f) => f.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Sheet onClose={onClose} mw={620}>
      <div style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: G.muted, fontWeight: 700 }}>
        Already uploaded
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: G.text, margin: "4px 0 12px" }}>{picker.name}</div>
      <input className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files…" style={{ marginBottom: 12 }} />

      {files === null && <div style={{ fontSize: 13, color: G.muted }}>Reading the bucket…</div>}
      {files && shown.length === 0 && <div style={{ fontSize: 13, color: G.muted }}>Nothing matches.</div>}

      {picker.kind === "photo" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(96px,1fr))", gap: 8 }}>
          {shown.map((f) => (
            <button key={f.name} className="btn" onClick={() => onChoose(f.name)} title={f.name}
              style={{ padding: 0, borderRadius: 10, overflow: "hidden", border: `1px solid ${G.border}`, background: G.soft, aspectRatio: "1", cursor: "pointer" }}>
              <img src={`${base.photo}/${f.name}`} alt={f.name} loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {shown.map((f) => (
            <button key={f.name} className="btn" onClick={() => onChoose(f.name)}
              style={{ textAlign: "start", padding: "10px 12px", borderRadius: 10, border: `1px solid ${G.border}`, background: "#fff", fontSize: 12.5, color: G.text, display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span>{f.name}</span>
              <span style={{ color: G.muted }}>{f.size ? mb(f.size) : ""}</span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}

// Nothing is uploaded until he has seen what matched what. A wrong clip put
// silently on an exercise is worse than no clip.
function BulkReview({ bulk, rows, setBulk, onRun, onCancel }) {
  const matched = bulk.items.filter((i) => i.name).length;
  const set = (idx, name) =>
    setBulk((b) => ({ ...b, items: b.items.map((it, i) => (i === idx ? { ...it, name, how: name ? "chosen" : "none" } : it)) }));

  return (
    <Sheet onClose={bulk.running ? () => {} : onCancel} mw={680}>
      <div style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: G.muted, fontWeight: 700 }}>
        {bulk.items.length} {bulk.kind}s
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: G.text, margin: "4px 0 4px", fontFamily: "'Instrument Serif',Georgia,serif" }}>
        {matched} matched, {bulk.items.length - matched} need a name
      </div>
      <div style={{ fontSize: 12, color: G.muted, marginBottom: 14 }}>
        Matched on the filename. Anything left blank is skipped.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {bulk.items.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "8px 10px", borderRadius: 10, border: `1px solid ${it.name ? G.border : G.amberLine}`, background: it.name ? "#fff" : G.amberSoft }}>
            <div style={{ flex: "1 1 200px", minWidth: 0, fontSize: 12, color: G.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {it.file.name}
            </div>
            <select className="inp" value={it.name} onChange={(e) => set(i, e.target.value)} disabled={bulk.running}
              style={{ flex: "1 1 240px", minHeight: 40, padding: "8px 32px 8px 10px", fontSize: 12.5 }}>
              <option value="">— skip —</option>
              {rows.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
            </select>
            {it.how === "close" && <span style={{ fontSize: 10, fontWeight: 700, color: G.amber }}>CLOSE — check</span>}
            {it.how === "ambiguous" && <span style={{ fontSize: 10, fontWeight: 700, color: G.amber }}>SEVERAL FIT</span>}
          </div>
        ))}
      </div>

      {bulk.running ? (
        <div style={{ fontSize: 13, color: G.muted, fontWeight: 600 }}>
          Uploading… {bulk.done} of {matched}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={onRun} disabled={!matched}
            style={{ flex: 1, minHeight: 48, borderRadius: 12, background: matched ? G.accent : G.soft, color: matched ? "#fff" : G.muted, fontWeight: 600, fontSize: 13, border: "none" }}>
            Upload {matched}
          </button>
          <button className="btn" onClick={onCancel}
            style={{ minHeight: 48, padding: "0 18px", borderRadius: 12, background: "#fff", color: G.muted, fontWeight: 600, fontSize: 13, border: `1px solid ${G.border}` }}>
            Cancel
          </button>
        </div>
      )}
    </Sheet>
  );
}

function Row({ r, base, busy, used, onUpload, onSimple, onPreview, onPick }) {
  const photoSrc = r.photo ? `${base.photo}/${r.photo}` : null;
  const videoSrc = r.video ? `${base.video}/${r.video}` : null;
  const [over, setOver] = useState(false);

  const drop = (e) => {
    e.preventDefault(); e.stopPropagation(); setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    onUpload(r.name, f.type.startsWith("video/") ? "video" : "photo", f);
  };

  return (
    <div className="card"
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
      style={{ padding: 12, display: "flex", gap: 12, alignItems: "flex-start", outline: over ? `2px solid ${G.accent}` : "none" }}>
      <button className="btn" onClick={() => photoSrc && onPreview({ kind: "photo", src: photoSrc, name: r.name })}
        style={{ width: 62, height: 62, flexShrink: 0, borderRadius: 10, overflow: "hidden",
          border: `1px solid ${G.border}`, background: G.soft, padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: photoSrc ? "zoom-in" : "default" }}>
        {photoSrc
          ? <img src={photoSrc} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <Icon n="dumbbell" s={18} c={G.dim} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: G.text, lineHeight: 1.3 }}>
          {r.name}
          {used && <span style={{ marginInlineStart: 7, fontSize: 9.5, fontWeight: 700, letterSpacing: ".04em", padding: "2px 6px", borderRadius: 20, background: G.accentSoft, color: G.accent, border: `1px solid ${G.accentLine}`, verticalAlign: "middle" }}>IN USE</span>}
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5, marginBottom: 8 }}>
          <Tag ok={!!r.photo} verified={r.photoVerified} label="Photo" />
          <Tag ok={!!r.video} verified={r.videoVerified} label="Video" />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Controls kind="photo" r={r} busy={busy} src={photoSrc}
            onUpload={onUpload} onSimple={onSimple} onPreview={onPreview} onPick={onPick} />
          <Controls kind="video" r={r} busy={busy} src={videoSrc}
            onUpload={onUpload} onSimple={onSimple} onPreview={onPreview} onPick={onPick} />
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

function Controls({ kind, r, busy, src, onUpload, onSimple, onPreview, onPick }) {
  const ref = useRef(null);
  const state = busy[`${r.name}|${kind}`];
  const has = kind === "photo" ? !!r.photo : !!r.video;
  const verified = kind === "photo" ? r.photoVerified : r.videoVerified;
  const K = KINDS[kind];

  const btn = (label, onClick, tone) => (
    <button key={label} className="btn" onClick={onClick} disabled={!!state}
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
            {btn("Use existing", () => onPick({ name: r.name, kind }))}
            {has && !verified && btn("Right", () => onSimple(r.name, kind, "confirm"))}
            {has && src && kind === "video" && btn("Play", () => onPreview({ kind, src, name: r.name }))}
            {has && btn("Remove", () => onSimple(r.name, kind, "clear"), "danger")}
          </>
        )}
    </div>
  );
}
