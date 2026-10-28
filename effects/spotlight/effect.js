// Lights out: the room drops to black, a warm rim light picks you out and a neon word flickers on behind you.
//
// params
//   word      the glowing word (default "FOCUS MODE")
//   color     glow colour (default warm "#ffd08a"; "accent" uses your brand)
//   dark      how dark the room gets (0-1, default 0.86)
FX.effect({
  defaults: { word: "FOCUS MODE", color: "#ffd08a", dark: 0.86, overlap: 0.15, safeTop: 210, enter: 0.15 },
  build(fx, p) {
    const { W, H, tl, u } = fx;
    const glow = p.color === "accent" ? fx.brand.accent : p.color;
    const t0 = p.enter;

    // the switch: two quick flickers, then dark
    const k = p.dark;
    tl.set(fx.shade, { opacity: k * 0.7 }, t0)
      .set(fx.shade, { opacity: 0.1 }, t0 + 0.06)
      .set(fx.shade, { opacity: k }, t0 + 0.13)
      .set(fx.shade, { opacity: 0.25 }, t0 + 0.18)
      .set(fx.shade, { opacity: k }, t0 + 0.24);

    // a soft cone of light from above onto you
    const f = fx.face(t0 + 0.4);
    const cone = fx.el("div", { css: { position: "absolute", inset: "0px",
      background: `radial-gradient(ellipse ${u(560)}px ${u(980)}px at ${f.x}px ${f.y + u(220)}px, rgba(255,214,160,.32), rgba(255,214,160,0) 70%)`,
      mixBlendMode: "screen", opacity: 0 } }, fx.behind);
    tl.to(cone, { opacity: 1, duration: 0.4 }, t0 + 0.24);

    // dust in the beam (seeded, so every render is identical)
    const rnd = fx.rng(7);
    const dust = [];
    for (let i = 0; i < 46; i++) {
      const d = fx.el("div", { css: { position: "absolute", width: u(3 + rnd() * 5) + "px", height: u(3 + rnd() * 5) + "px",
        borderRadius: "50%", background: "rgba(255,230,190,.9)", boxShadow: `0 0 ${u(8)}px rgba(255,220,170,.9)`,
        left: (f.x + (rnd() - 0.5) * u(620)) + "px", top: (rnd() * H * 0.85) + "px", opacity: 0 } }, fx.front);
      dust.push({ d, vy: -u(14 + rnd() * 30), vx: u((rnd() - 0.5) * 18), ph: rnd() * 6.28, a: 0.25 + rnd() * 0.6 });
    }
    fx.onFrame((t) => {
      const on = Math.max(0, Math.min(1, (t - t0 - 0.3) / 0.5)) * Math.max(0, Math.min(1, (fx.dur - t) / 0.3));
      for (const s of dust) {
        s.d.style.transform = `translate(${s.vx * t + Math.sin(t * 1.3 + s.ph) * u(10)}px, ${s.vy * t}px)`;
        s.d.style.opacity = on * s.a * (0.6 + 0.4 * Math.sin(t * 3 + s.ph));
      }
    });

    // rim light on you: a warm glow that hugs your outline, and a touch of warmth on your skin
    tl.fromTo(fx.person, { filter: "drop-shadow(0 0 0px rgba(255,190,110,0)) brightness(1)" },
      { filter: `drop-shadow(0 0 ${u(22)}px rgba(255,190,110,.75)) drop-shadow(0 0 ${u(6)}px rgba(255,220,170,.9)) brightness(1.04)`,
        duration: 0.35, ease: "power2.out" }, t0 + 0.24);

    // neon word behind your head, readable: same headroom logic as giant-word-behind
    const word = String(p.word).toUpperCase();
    const box = fx.el("div", { css: { position: "absolute", left: "0px", width: W + "px", textAlign: "center",
      fontFamily: "var(--display)", lineHeight: "1", color: "#fff8ec", whiteSpace: "nowrap" } }, fx.behind);
    const px = fx.fit(box.appendChild(Object.assign(document.createElement("span"), { textContent: word })), W * 0.9, u(330));
    box.style.fontSize = px + "px";
    box.firstChild.style.fontSize = px + "px";
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = `${px}px "fx-display"`;
    const capH = ctx.measureText(word).actualBoundingBoxAscent || px * 0.72;
    const dy = fx.roomFor(u(p.safeTop) + capH * (1 - p.overlap) + u(30), t0, fx.dur);
    const shot = { dy: 0 };
    if (dy > 0) tl.to(shot, { dy, duration: 0.5, ease: "power3.inOut" }, 0);
    fx.onFrame(() => fx.reframe(1, shot.dy));
    fx.reframe(1, dy);
    const baseline = fx.headTop(t0, fx.dur) + capH * p.overlap;
    fx.reframe(1, 0);
    const base = fx.el("span", { css: { display: "inline-block", width: "0px", height: "0px" } }, box);
    box.style.top = "0px";
    box.style.top = (baseline - base.offsetTop) + "px";
    const neon = `0 0 ${u(8)}px #fff, 0 0 ${u(24)}px ${glow}, 0 0 ${u(60)}px ${glow}, 0 0 ${u(120)}px ${glow}`;
    box.style.textShadow = neon;
    // tube flicker on
    const on = t0 + 0.55;
    [[0, 0.9], [0.05, 0.1], [0.11, 1], [0.16, 0.3], [0.22, 1]].forEach(([dt, o]) => tl.set(box, { opacity: o }, on + dt));
    tl.set(box, { opacity: 0 }, 0);
    tl.fromTo(box, { scale: 1.04 }, { scale: 1, duration: fx.dur - on, ease: "none" }, on);

    // lights back up at the end
    const out = fx.dur - 0.32;
    tl.to(fx.shade, { opacity: 0, duration: 0.3 }, out);
    tl.to([box, cone], { opacity: 0, duration: 0.2 }, out);
    tl.to(fx.person, { filter: "drop-shadow(0 0 0px rgba(255,190,110,0)) brightness(1)", duration: 0.3 }, out);
  },
});
