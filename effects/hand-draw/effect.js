// A marker scribble: an arrow swoops in from a note and a loose circle loops around your face (or any box).
//
// params
//   note      handwritten-style note at the arrow's tail (default "that's me")
//   target    "face" (default) or {x, y, w, h} as 0-1 fractions of the frame
//   side      where the note sits: "left" (default) or "right"
//   color     "accent" (default) or any CSS colour
FX.effect({
  defaults: { note: "that's me", target: "face", side: "left", color: "accent", enter: 0.2 },
  build(fx, p) {
    const { W, H, tl, u } = fx;
    const col = p.color === "accent" ? fx.brand.accent : p.color;
    let box;
    if (p.target === "face") {
      const f = fx.face(p.enter + 0.6);
      box = { x: f.x - f.w * 0.72, y: f.y - f.h * 0.78, w: f.w * 1.44, h: f.h * 1.6 };
    } else {
      box = { x: p.target.x * W, y: p.target.y * H, w: p.target.w * W, h: p.target.h * H };
    }
    const svg = fx.el("div", { css: { position: "absolute", inset: "0px" } }, fx.front);
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2, rx = box.w / 2, ry = box.h / 2;
    // loose loop: an ellipse that overshoots its start, like a real marker
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const a = -Math.PI * 0.62 + (i / 48) * Math.PI * 2.18;
      const wob = 1 + 0.035 * Math.sin(i * 1.7);
      pts.push(`${(cx + Math.cos(a) * rx * wob).toFixed(1)},${(cy + Math.sin(a) * ry * wob).toFixed(1)}`);
    }
    const left = p.side !== "right";
    const nx = left ? u(70) : W - u(70), ny = Math.min(H * 0.78, box.y + box.h + u(220));
    const ax = left ? box.x + u(10) : box.x + box.w - u(10), ay = box.y + box.h * 0.82;
    const arrow = `M${nx + (left ? u(60) : -u(60))},${ny - u(40)} C${nx + (left ? u(40) : -u(40))},${ay + u(60)} ${ax + (left ? -u(120) : u(120))},${ay + u(40)} ${ax},${ay}`;
    const sw = u(11);
    svg.innerHTML = `<svg width="${W}" height="${H}" style="position:absolute;inset:0;overflow:visible">
      <g fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"
         style="filter:drop-shadow(0 ${u(4)}px ${u(10)}px rgba(0,0,0,.35))">
        <polyline class="loop" points="${pts.join(" ")}"/>
        <path class="arrow" d="${arrow}"/>
        <path class="head" d="M${ax + (left ? -u(46) : u(46))},${ay + u(4)} L${ax},${ay} L${ax + (left ? -u(18) : u(18))},${ay + u(44)}"/>
      </g></svg>`;
    const note = fx.el("div", { text: p.note, css: { position: "absolute", top: (ny - u(10)) + "px", [left ? "left" : "right"]: u(50) + "px",
      fontFamily: "var(--body)", fontStyle: "italic", fontWeight: 800, fontSize: u(64) + "px", color: "#fff", rotate: left ? "-6deg" : "6deg",
      textShadow: `0 ${u(4)}px ${u(16)}px rgba(0,0,0,.6)` } }, fx.hud);
    const draw = (el, at, dur) => {
      const len = el.getTotalLength ? el.getTotalLength() : 4000;
      el.style.strokeDasharray = len;
      tl.fromTo(el, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: dur, ease: "power1.inOut" }, at);
    };
    const e = p.enter;
    tl.from(note, { scale: 0.4, opacity: 0, duration: 0.3, ease: "back.out(2)" }, e);
    draw(svg.querySelector(".arrow"), e + 0.25, 0.4);
    draw(svg.querySelector(".head"), e + 0.62, 0.12);
    draw(svg.querySelector(".loop"), e + 0.7, 0.6);
    tl.to([svg, note], { opacity: 0, duration: 0.25 }, fx.dur - 0.28);
  },
});
