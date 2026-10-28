// Word-by-word captions with a bottom fade; *starred* words hit in your accent colour, the key word can sit behind you.
//
// params
//   text      the line(s) said in this window; wrap a word in *stars* to emphasise it
//   words     optional exact timings [{w, t}] (seconds); otherwise words are spread evenly
//   behind    a key word to show huge behind your head as the line plays (optional)
//   y         caption height 0-1 (default 0.7)
//   fade      bottom fade for legibility (default true)
FX.effect({
  defaults: { text: "This is how you *edit* like a *pro*", words: null, behind: "", y: 0.7, fade: true, perLine: 3 },
  build(fx, p) {
    const { W, H, tl, u } = fx;
    if (p.fade) {
      const fade = fx.el("div", { css: { position: "absolute", left: "0px", right: "0px", bottom: "0px", height: (H * 0.45) + "px",
        background: "linear-gradient(0deg, rgba(0,0,0,.72), rgba(0,0,0,0))", opacity: 0 } }, fx.hud);
      tl.to(fade, { opacity: 1, duration: 0.3 }, 0);
      tl.to(fade, { opacity: 0, duration: 0.3 }, fx.dur - 0.3);
    }
    const raw = p.words || String(p.text).split(/\s+/).filter(Boolean).map((w, i, a) => ({ w, t: 0.15 + i * (fx.dur - 0.6) / a.length }));
    // group into short lines (Reels style: 2-3 words on screen at a time)
    const lines = [];
    raw.forEach((x, i) => { if (i % p.perLine === 0) lines.push([]); lines[lines.length - 1].push(x); });
    lines.forEach((line, li) => {
      const box = fx.el("div", { css: { position: "absolute", left: u(40) + "px", width: (W - u(80)) + "px", top: (H * p.y) + "px",
        textAlign: "center", fontFamily: "var(--display)", fontSize: u(104) + "px", lineHeight: 1.05, color: "#fff",
        textTransform: "uppercase", textShadow: `0 ${u(5)}px ${u(24)}px rgba(0,0,0,.6)` } }, fx.hud);
      const start = line[0].t, end = li + 1 < lines.length ? lines[li + 1][0].t : fx.dur - 0.2;
      tl.set(box, { opacity: 0 }, 0).set(box, { opacity: 1 }, start).set(box, { opacity: 0 }, end);
      line.forEach((x) => {
        const hot = /^\*.*\*[.,!?]?$/.test(x.w);
        const span = fx.el("span", { text: x.w.replace(/\*/g, "") + " ", css: { display: "inline-block", whiteSpace: "pre",
          color: hot ? "var(--accent)" : "#fff" } }, box);
        tl.from(span, { scale: hot ? 1.6 : 1.25, opacity: 0, y: u(20), duration: hot ? 0.22 : 0.16, ease: "back.out(2.2)" }, x.t);
        if (hot) tl.to(span, { scale: 1.08, duration: 0.15, yoyo: true, repeat: 1 }, x.t + 0.22);
      });
    });
    if (p.behind) {
      const word = String(p.behind).toUpperCase();
      const box = fx.el("div", { text: word, css: { position: "absolute", left: "0px", width: W + "px", textAlign: "center",
        fontFamily: "var(--display)", lineHeight: 1, color: "rgba(255,255,255,.95)" } }, fx.behind);
      const px = fx.fit(box, W * 0.92);
      const ctx = document.createElement("canvas").getContext("2d");
      ctx.font = `${px}px "fx-display"`;
      const capH = ctx.measureText(word).actualBoundingBoxAscent || px * 0.72;
      const dy = fx.roomFor(u(200) + capH * 0.82 + u(24), 0, fx.dur);
      const shot = { dy: 0 };
      if (dy > 0) tl.to(shot, { dy, duration: 0.4, ease: "power3.inOut" }, 0);
      fx.onFrame(() => fx.reframe(1, shot.dy));
      fx.reframe(1, dy);
      const top = fx.headTop(0, fx.dur);
      fx.reframe(1, 0);
      box.style.top = (top + capH * 0.18 - px * 0.9) + "px";
      tl.from(box, { yPercent: 40, opacity: 0, duration: 0.5, ease: "power3.out" }, 0.1);
      tl.to(box, { opacity: 0, duration: 0.3 }, fx.dur - 0.35);
    }
  },
});
