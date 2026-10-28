// A title decodes character by character behind your head (monospace, terminal style), then locks in.
//
// params
//   text      the title (default "NEW DROP")
//   sub       small line above it (default "// loading")
//   color     "accent" (default) or any CSS colour
FX.effect({
  defaults: { text: "NEW DROP", sub: "// loading", color: "accent", enter: 0.15, safeTop: 210 },
  build(fx, p) {
    const { W, tl, u } = fx;
    const col = p.color === "accent" ? "var(--accent)" : p.color;
    const text = String(p.text).toUpperCase();
    const wrap = fx.el("div", { css: { position: "absolute", left: "0px", width: W + "px", textAlign: "center", lineHeight: 1 } }, fx.behind);
    const sub = fx.el("div", { text: p.sub, css: { fontFamily: "var(--mono)", fontSize: u(34) + "px", color: "rgba(255,255,255,.75)",
      marginBottom: u(12) + "px" } }, wrap);
    const main = fx.el("div", { text: text, css: { fontFamily: "var(--mono)", fontWeight: 800, color: col,
      textShadow: `0 0 ${u(30)}px color-mix(in srgb, ${col} 60%, transparent)` } }, wrap);
    const px = fx.fit(main, W * 0.88, u(200));
    const total = u(34) + u(12) + px;
    const dy = fx.roomFor(u(p.safeTop) + total * 0.92, p.enter, fx.dur);
    const shot = { dy: 0 };
    if (dy > 0) tl.to(shot, { dy, duration: 0.45, ease: "power3.inOut" }, 0);
    fx.onFrame(() => fx.reframe(1, shot.dy));
    fx.reframe(1, dy);
    const top = fx.headTop(p.enter, fx.dur);
    fx.reframe(1, 0);
    wrap.style.top = (top - total + px * 0.12) + "px";

    // decode: each character cycles through glyphs, then locks left to right
    const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=<>/";
    const k = { p: 0 };
    const e = p.enter;
    tl.from(wrap, { opacity: 0, duration: 0.2 }, e);
    tl.to(k, { p: 1, duration: 1.1, ease: "none" }, e + 0.1);
    fx.onFrame((t, i) => {
      const locked = Math.floor(k.p * text.length);
      main.textContent = [...text].map((ch, j) => j < locked || ch === " " ? ch
        : glyphs[(j * 7 + i * 3 + ((j * 13) % 5)) % glyphs.length]).join("");
    });
    tl.fromTo(main, { scale: 1 }, { scale: 1.06, duration: 0.12, yoyo: true, repeat: 1 }, e + 1.2);
    tl.to(wrap, { opacity: 0, duration: 0.25 }, fx.dur - 0.3);
  },
});
