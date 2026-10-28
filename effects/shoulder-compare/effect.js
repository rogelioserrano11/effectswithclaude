// Before / After: the camera pushes over one shoulder to the "before" card, whips to the other for the "after".
//
// params
//   before, after     {label, value, unit}  value may be a number (counts up) or text
//   zoom              how far the camera pushes in (default 1.45)
FX.effect({
  defaults: {
    before: { label: "Before", value: 1204, unit: "views" },
    after: { label: "After", value: 412000, unit: "views" },
    zoom: 1.45, enter: 0.1,
  },
  build(fx, p) {
    const { W, tl, u } = fx;
    const f = fx.face(0.6);
    const cw = Math.max(u(300), Math.min(u(360), f.x - f.w * 0.5 - u(30)));
    const cy = f.y + f.h * 0.12;

    const card = (side, d, accent) => {
      const left = side < 0 ? u(34) : W - u(34) - cw;
      const el = fx.el("div", { css: { position: "absolute", left: left + "px", top: cy + "px", width: cw + "px",
        padding: `${u(26)}px ${u(30)}px`, borderRadius: u(30) + "px", color: "#fff",
        textAlign: side < 0 ? "left" : "right",
        background: accent ? "color-mix(in srgb,var(--accent) 72%,rgba(10,10,14,.5))" : "rgba(16,18,26,.5)",
        backdropFilter: `blur(${u(20)}px) saturate(1.4)`,
        border: `${u(1.5)}px solid rgba(255,255,255,.28)`,
        boxShadow: `0 ${u(20)}px ${u(60)}px rgba(0,0,0,.35)` } }, fx.behind);
      el.innerHTML = `<div style="display:inline-block;font-size:${u(24)}px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
        padding:${u(6)}px ${u(16)}px;border-radius:${u(30)}px;background:${accent ? "rgba(0,0,0,.25)" : "rgba(255,255,255,.14)"}">${d.label}</div>`;
      const num = fx.el("div", { css: { fontSize: u(96) + "px", fontWeight: 800, lineHeight: 1, letterSpacing: "-.03em",
        marginTop: u(14) + "px" } }, el);
      fx.el("div", { text: d.unit || "", css: { fontSize: u(30) + "px", fontWeight: 600, opacity: 0.8, marginTop: u(6) + "px" } }, el);
      return { el, num, x: left + cw / 2, y: cy + u(110) };
    };
    const A = card(-1, p.before, false);
    const B = card(1, p.after, true);
    const val = (c, d, at) => typeof d.value === "number" ? fx.counter(c.num, d.value, { at, dur: 0.7 }) : (c.num.textContent = d.value);

    // camera path: settle → push to before → whip to after → pull out
    const z = p.zoom, e = p.enter;
    const aimA = fx.aim(A.x + u(60), A.y, z), aimB = fx.aim(B.x - u(60), B.y, z);
    tl.from([A.el, B.el], { scale: 0.7, opacity: 0, duration: 0.45, ease: "back.out(1.6)", stagger: 0.1 }, e);
    tl.to(fx.cam, { ...aimA, duration: 0.7, ease: "power3.inOut" }, e + 0.25);
    val(A, p.before, e + 0.55);
    const whip = e + 1.35;
    tl.to(fx.cam, { ...aimB, duration: 0.45, ease: "expo.inOut" }, whip);
    tl.fromTo(fx.cam, { filter: "blur(0px)" }, { filter: `blur(${u(14)}px)`, duration: 0.2, ease: "power2.in", yoyo: true, repeat: 1 }, whip + 0.03);
    val(B, p.after, whip + 0.3);
    tl.fromTo(B.el, { scale: 1 }, { scale: 1.08, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" }, whip + 1.0);
    const out = Math.max(whip + 1.0, fx.dur - 0.55);
    tl.to(fx.cam, { x: 0, y: 0, scale: 1, duration: 0.5, ease: "power3.inOut" }, out);
    tl.to([A.el, B.el], { opacity: 0, scale: 0.85, duration: 0.3 }, fx.dur - 0.3);
  },
});
