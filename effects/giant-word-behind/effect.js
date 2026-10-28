// A giant word drops in letter by letter BEHIND your head, sized and placed so it stays readable.
//
// params
//   word      the word (keep it short: 4-8 letters reads best)
//   color     "text" | "accent" | any CSS colour
//   overlap   how much of the word's bottom your head may cover (0-0.4; default 0.18)
//   safeTop   px kept free at the top for the Reels / TikTok UI (default 200 at 1920 tall)
//   dim       darken the room so the word pops (0-1; default 0.18)
//   pullBack  slide the shot down for headroom when your head is too close to the top (default true)
FX.effect({
  defaults: { word: "FOCUS", color: "text", overlap: 0.18, safeTop: 200, dim: 0.18, pullBack: true, enter: 0.1 },
  build(fx, p) {
    const { W, H, tl, u } = fx;
    const word = String(p.word).toUpperCase();
    const color = p.color === "text" ? "var(--text)" : p.color === "accent" ? "var(--accent)" : p.color;

    const box = fx.el("div", { css: { position: "absolute", left: "0px", width: W + "px", textAlign: "center",
      fontFamily: "var(--display)", lineHeight: "1", color, perspective: u(1400) + "px",
      textShadow: `0 ${u(10)}px ${u(40)}px rgba(0,0,0,.35)` } }, fx.behind);
    const sizer = fx.el("span", { text: word, css: { fontFamily: "var(--display)" } }, box);
    const px = fx.fit(sizer, W * 0.9);
    sizer.remove();
    box.style.fontSize = px + "px";
    const letters = [...word].map((ch) => fx.el("span", { text: ch === " " ? " " : ch,
      css: { display: "inline-block", transformOrigin: "50% 100%", willChange: "transform" } }, box));
    const base = fx.el("span", { css: { display: "inline-block", width: "0px", height: "0px" } }, box);

    // glyph metrics: cap height from the font, baseline from the layout
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = `${px}px "fx-display"`;
    const capH = ctx.measureText(word).actualBoundingBoxAscent || px * 0.72;

    // room above your head: slide the shot down just enough and ease into it
    const t0 = p.enter, t1 = fx.dur;
    const need = u(p.safeTop) + capH * (1 - p.overlap) + u(24);
    const dy = p.pullBack ? fx.roomFor(need, t0, t1) : 0;
    const shot = { dy: 0 };
    if (dy > 0) tl.to(shot, { dy, duration: 0.45, ease: "power3.inOut" }, Math.max(0, t0 - 0.15));
    fx.onFrame(() => fx.reframe(1, shot.dy));

    fx.reframe(1, dy);                               // lay out against the final framing
    const baseline = fx.headTop(t0, t1) + capH * p.overlap;
    fx.reframe(1, 0);
    box.style.top = "0px";
    const baseY = base.offsetTop;
    box.style.top = (baseline - baseY) + "px";

    if (p.dim > 0) tl.to(fx.shade, { opacity: p.dim, duration: 0.5 }, t0);
    tl.from(letters, { yPercent: -70, rotateX: 75, opacity: 0, duration: 0.55, ease: "back.out(1.6)",
      stagger: { each: 0.045, from: "center" } }, t0);
    tl.fromTo(box, { scale: 1.06 }, { scale: 1, duration: fx.dur, ease: "none" }, 0);
    const out = Math.max(t0 + 0.9, fx.dur - 0.35);
    tl.to(letters, { yPercent: 55, opacity: 0, duration: 0.3, ease: "power2.in", stagger: 0.02 }, out);
  },
});
