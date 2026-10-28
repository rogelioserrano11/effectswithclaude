/* effectswithclaude runtime.
 *
 * Builds the stage every effect draws on, frame by frame:
 *
 *   #stage
 *     #cam            camera: punch-ins, pushes and shakes move everything inside
 *       #fill         blurred copy of the frame, shown only when the shot is reframed (pulled back)
 *       #plate > #bg  the source frame
 *       #shade        black veil over the room (not over you): tween its opacity to dim the background
 *       #behind       layer BEHIND you
 *       #person-wrap > #person   you, cut out (same frame with a portrait alpha)
 *       #front        layer in FRONT of you
 *     #hud            screen-space layer the camera does not move (captions, tags, CTAs)
 *
 * Rendering is deterministic: the renderer calls window.__fxFrame(i), which loads frame i, seeks the single paused
 * GSAP timeline to i / fps and runs the onFrame hooks. No Math.random, no Date.now, no network.
 */
(function () {
  const S = window.__FX_SPEC;
  const W = S.w, H = S.h, fps = S.fps, N = S.n;
  const T = S.track;
  const brand = Object.assign({
    accent: "#ff6b1a", accent2: "#38bdf8", text: "#ffffff", text_soft: "#b5b6b9", bg: "#080c14",
    surface: "rgba(255,255,255,0.14)", danger: "#ff4444", good: "#22c55e", handle: "@yourhandle",
  }, S.brand || {});

  const css = document.createElement("style");
  const fontFace = (fam, url) => url ? `@font-face{font-family:"${fam}";src:url("${url}");font-display:block}` : "";
  css.textContent = [
    fontFace("fx-display", S.fonts.display), fontFace("fx-body", S.fonts.body), fontFace("fx-mono", S.fonts.mono),
    `:root{--accent:${brand.accent};--accent2:${brand.accent2};--text:${brand.text};--soft:${brand.text_soft};`,
    `--bg:${brand.bg};--surface:${brand.surface};--danger:${brand.danger};--good:${brand.good};`,
    `--display:"fx-display",Impact,sans-serif;--body:"fx-body",system-ui,sans-serif;--mono:"fx-mono",monospace;--u:${W / 1080}px}`,
    `html,body{margin:0;padding:0;background:${brand.bg};overflow:hidden}`,
    `#stage{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${brand.bg};font-family:var(--body);color:var(--text)}`,
    `#stage *{box-sizing:border-box}`,
    `.fx-layer{position:absolute;inset:0;width:${W}px;height:${H}px}`,
    `.fx-layer>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}`,
    `#fill{position:absolute;left:0;top:0;width:100%;height:0;background-repeat:no-repeat;background-position:50% 0;filter:blur(${6 * W / 1080}px) brightness(.92)}`,
    `.fx-abs{position:absolute}`,
  ].join("\n");
  document.head.appendChild(css);

  const root = document.getElementById("stage");
  const mk = (id, parent, tag = "div") => {
    const e = document.createElement(tag);
    if (id) e.id = id;
    e.className = "fx-layer";
    parent.appendChild(e);
    return e;
  };
  const cam = mk("cam", root);
  const fillWrap = mk(null, cam); const fill = document.createElement("div"); fill.id = "fill"; fillWrap.appendChild(fill);
  const plate = mk("plate", cam); const bg = document.createElement("img"); bg.id = "bg"; plate.appendChild(bg);
  const shade = mk("shade", cam); shade.style.background = "#000"; shade.style.opacity = 0;   // dims the room only
  const behind = mk("behind", cam);
  const personWrap = mk("person-wrap", cam); const person = document.createElement("img"); person.id = "person"; personWrap.appendChild(person);
  const front = mk("front", cam);
  const hud = mk("hud", root);
  [cam, plate, personWrap].forEach(e => { e.style.transformOrigin = "50% 100%"; });
  cam.style.transformOrigin = "50% 50%";

  // ---- face track in stage coordinates (after any reframe) ----
  const reframe = { s: 1, y: 0 };
  const lerp = (a, b, k) => a + (b - a) * k;
  function rawAt(i) {
    const k = Math.max(0, Math.min(N - 1, i));
    const i0 = Math.floor(k), i1 = Math.min(N - 1, i0 + 1), f = k - i0;
    const a = T.face[i0], b = T.face[i1];
    return { x: lerp(a[0], b[0], f), y: lerp(a[1], b[1], f), w: lerp(a[2], b[2], f), h: lerp(a[3], b[3], f),
             top: lerp(T.top[i0], T.top[i1], f) };
  }
  const toStage = (x, y) => [W / 2 + (x - W / 2) * reframe.s, H + (y - H) * reframe.s + reframe.y];
  function face(t) {
    const r = rawAt(t * fps);
    const [x, y] = toStage(r.x, r.y);
    const [, top] = toStage(r.x, r.top);
    return { x, y, w: r.w * reframe.s, h: r.h * reframe.s, top };
  }
  // the highest point your head reaches during [t0, t1] (stage px) — the safe line for text behind you
  function headTop(t0 = 0, t1 = N / fps) {
    let m = Infinity;
    for (let i = Math.floor(t0 * fps); i <= Math.min(N - 1, Math.ceil(t1 * fps)); i++) m = Math.min(m, rawAt(i).top);
    return toStage(0, m)[1];
  }

  const hooks = [];
  const FX = window.FX = {
    W, H, fps, n: N, dur: N / fps, brand, spec: S,
    p: {}, tl: gsap.timeline({ paused: true, defaults: { ease: "power3.out" } }),
    cam, fill, plate, bg, shade, behind, personWrap, person, front, hud,
    face, headTop, mapFrame: null,
    u: (v) => v * W / 1080,                 // design at 1080 wide, scale to the real canvas
    onFrame(fn) { hooks.push(fn); },
    // Make headroom: slide the shot down by dy px (optionally scale it, anchored at the bottom). The gap at the top
    // is filled by stretching the top strip of your own background, which reads as more wall, not as a blur box.
    reframe(s = 1, dy = 0) {
      reframe.s = s; reframe.y = dy;
      const tf = `translateY(${dy}px) scale(${s})`;
      plate.style.transform = tf; personWrap.style.transform = tf;
      const gap = H - (H - 0) * s + dy;           // stage px left empty above the plate
      if (gap > 0.5) {
        const band = H * 0.06;                    // source rows used for the extension
        fill.style.height = (gap + FX.u(60)) + "px";
        fill.style.backgroundSize = `${W}px ${H * (gap + FX.u(60)) / band}px`;
        plate.style.maskImage = `linear-gradient(180deg,transparent 0,#000 ${FX.u(50)}px)`;
      } else {
        fill.style.height = "0px";
        plate.style.maskImage = "";
      }
    },
    // How far to slide the shot down so your head stays `need` px below the top during [t0, t1].
    roomFor(need, t0, t1, maxShift = 0.3) {
      const prev = [reframe.s, reframe.y]; FX.reframe(1, 0);
      const top = headTop(t0, t1);
      FX.reframe(...prev);
      return Math.min(H * maxShift, Math.max(0, need - top));
    },
    // Camera values {x, y, scale} for gsap.to(FX.cam, …) that put stage point (px, py) at the centre at zoom s,
    // clamped so the frame edge never shows.
    aim(px, py, s) {
      const mx = (s - 1) * W / 2, my = (s - 1) * H / 2;
      const c = (v, m) => Math.max(-m, Math.min(m, v));
      return { x: c(s * (W / 2 - px), mx), y: c(s * (H / 2 - py), my), scale: s };
    },
    el(tag, opts = {}, parent) {
      const e = document.createElement(tag);
      if (opts.cls) e.className = opts.cls;
      if (opts.html != null) e.innerHTML = opts.html;
      if (opts.text != null) e.textContent = opts.text;
      if (opts.css) Object.assign(e.style, opts.css);
      (parent || front).appendChild(e);
      return e;
    },
    // Largest font size (px) that keeps `el` on one line within maxW.
    fit(el, maxW, maxPx = 2000) {
      el.style.whiteSpace = "nowrap"; el.style.fontSize = "100px";
      const keep = [el.style.display, el.style.width];
      el.style.display = "inline-block"; el.style.width = "auto";       // measure the text, not the block
      const w = el.getBoundingClientRect().width || 1;
      [el.style.display, el.style.width] = keep;
      const px = Math.min(maxPx, 100 * maxW / w);
      el.style.fontSize = px + "px";
      return px;
    },
    // Seeded PRNG so "random" layouts are identical on every frame and every render.
    rng(seed = 1) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); },
    // Count-up helper: writes a formatted number into `el` as the timeline plays.
    counter(el, to, { from = 0, at = 0, dur = 1.2, fmt = compact, ease = "power2.out" } = {}) {
      const o = { v: from };
      el.textContent = fmt(from);
      FX.tl.to(o, { v: to, duration: dur, ease }, at);
      hooks.push(() => { el.textContent = fmt(o.v); });
    },
    compact,
  };

  function compact(v) {
    const a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
    if (a >= 1e4) return Math.round(v / 1e3) + "K";
    if (a >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return Math.round(v).toLocaleString("en-US");
  }

  // ---- frame loading ----
  const pad = (i) => String(i + 1).padStart(5, "0");
  const decode = (img, src) => new Promise((res) => {
    if (img.dataset.src === src) return res();
    img.dataset.src = src;
    img.onload = () => (img.decode ? img.decode().then(res, res) : res());
    img.onerror = () => res();
    img.src = src;
  });
  window.__fxFrame = async (i) => {
    const k = Math.max(0, Math.min(N - 1, FX.mapFrame ? FX.mapFrame(i) : i));
    const jpg = `frames/${pad(k)}.jpg`;
    await Promise.all([decode(bg, jpg), decode(person, `person/${pad(k)}.png`)]);
    fill.style.backgroundImage = `url(${jpg})`;
    const t = i / fps;
    FX.tl.seek(t, true);
    for (const fn of hooks) fn(t, i);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return t;
  };

  // wait for the effect script (loaded after this one) and force-load the fonts before building
  const domReady = new Promise((r) => document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", r) : r());
  window.__fxReady = (async () => {
    await domReady;
    await Promise.all(["fx-display", "fx-body", "fx-mono"].map((f) => document.fonts.load(`100px "${f}"`).catch(() => null)));
    await document.fonts.ready;
    const def = window.__FX_EFFECT;
    if (!def) throw new Error("effect script did not call FX.effect()");
    FX.p = Object.assign({}, def.defaults || {}, S.params || {});
    def.build(FX, FX.p);
    FX.tl.seek(0, true);
    return true;
  })();

  FX.effect = (def) => { window.__FX_EFFECT = def; };
})();
