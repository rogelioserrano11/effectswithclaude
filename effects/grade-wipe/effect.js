// A flat LOG look gets wiped into a cinematic grade, with a glowing divider and Before / After tags.
//
// params
//   before, after   tag texts (default "Before" / "After")
//   look            "cinematic" (warm/teal), "punchy" or "mono"
//   at              when the wipe starts (default 0.6)
FX.effect({
  defaults: { before: "Before", after: "After", look: "cinematic", at: 0.6, wipe: 1.1 },
  build(fx, p) {
    const { W, H, tl, u } = fx;
    const looks = {
      cinematic: "contrast(1.16) saturate(1.28) sepia(.12) brightness(.98) hue-rotate(-6deg)",
      punchy: "contrast(1.3) saturate(1.55) brightness(1.02)",
      mono: "grayscale(1) contrast(1.35) brightness(1.04)",
    };
    const flat = "contrast(.74) saturate(.42) brightness(1.1)";
    fx.cam.style.filter = flat;

    // graded copy of the same frame on top, revealed by a moving clip edge (right → left)
    const top = fx.el("img", { css: { position: "absolute", inset: "0px", width: "100%", height: "100%", objectFit: "cover",
      filter: looks[p.look] || looks.cinematic } }, fx.hud);
    const tint = fx.el("div", { css: { position: "absolute", inset: "0px",
      background: "linear-gradient(180deg,rgba(0,60,80,.10),rgba(255,140,60,.08))", mixBlendMode: "soft-light" } }, fx.hud);
    const line = fx.el("div", { css: { position: "absolute", top: "0px", width: u(5) + "px", height: H + "px", marginLeft: -u(2.5) + "px",
      background: "#fff", boxShadow: `0 0 ${u(20)}px rgba(255,255,255,.9)` } }, fx.hud);
    const tag = (txt, side) => fx.el("div", { text: txt, css: { position: "absolute", top: u(250) + "px",
      [side]: u(40) + "px", padding: `${u(10)}px ${u(24)}px`, borderRadius: u(40) + "px", fontWeight: 800, fontSize: u(30) + "px",
      background: "rgba(0,0,0,.45)", backdropFilter: `blur(${u(10)}px)`, color: "#fff" } }, fx.hud);
    const tb = tag(p.before, "left"), ta = tag(p.after, "right");

    const edge = { x: W + u(10) };
    tl.to(edge, { x: -u(10), duration: p.wipe, ease: "power2.inOut" }, p.at);
    tl.from(tb, { opacity: 0, y: -u(20), duration: 0.3 }, 0.1);
    tl.from(ta, { opacity: 0, y: -u(20), duration: 0.3 }, p.at + 0.2);
    tl.to(tb, { opacity: 0, duration: 0.2 }, p.at + p.wipe * 0.8);
    tl.to(line, { opacity: 0, duration: 0.2 }, p.at + p.wipe);
    fx.onFrame(() => {
      if (top.dataset.src !== fx.bg.dataset.src) { top.dataset.src = fx.bg.dataset.src; top.src = fx.bg.src; }
      const clip = `inset(0 0 0 ${Math.max(0, edge.x)}px)`;
      top.style.clipPath = clip; tint.style.clipPath = clip;
      line.style.left = edge.x + "px";
    });
    const out = fx.dur - 0.25;
    tl.to(ta, { opacity: 0, duration: 0.2 }, out);
  },
});
