// Old vs new: the old value gets struck through with a hand-drawn red line, the new one drops in below.
//
// params
//   before    {label, value}  e.g. {label: "Editing a reel", value: "4 hours"}
//   after     {label, value}  e.g. {label: "With this pack", value: "10 min"}
//   y         vertical position 0-1 (default 0.6)
FX.effect({
  defaults: { before: { label: "Editing a reel", value: "4 hours" }, after: { label: "With this pack", value: "10 min" },
    y: 0.6, enter: 0.15 },
  build(fx, p) {
    const { W, H, tl, u } = fx;
    const wrap = fx.el("div", { css: { position: "absolute", left: u(60) + "px", width: (W - u(120)) + "px", top: (H * p.y) + "px",
      textAlign: "center", color: "#fff", textShadow: `0 ${u(4)}px ${u(24)}px rgba(0,0,0,.6)` } }, fx.hud);
    const row = (d, accent) => {
      const r = fx.el("div", { css: { position: "relative", display: "inline-block", padding: `${u(8)}px ${u(30)}px`,
        borderRadius: u(24) + "px", background: accent ? "var(--accent)" : "rgba(0,0,0,.5)", marginTop: u(18) + "px" } }, wrap);
      r.innerHTML = `<div style="font-size:${u(30)}px;font-weight:600;opacity:.85">${d.label}</div>
        <div style="font-family:var(--display);font-size:${u(120)}px;line-height:1.02">${d.value}</div>`;
      fx.el("br", {}, wrap);
      return r;
    };
    const a = row(p.before, false), b = row(p.after, true);
    // hand-drawn strike across the old value
    a.insertAdjacentHTML("beforeend", `<svg viewBox="0 0 400 100" preserveAspectRatio="none" style="position:absolute;left:-4%;top:30%;
      width:108%;height:60%;overflow:visible"><path d="M6,62 C90,48 170,58 250,40 C310,28 360,34 396,22" fill="none"
      stroke="var(--danger)" stroke-width="12" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`);
    const path = a.querySelector("path"), len = path.getTotalLength();
    path.style.strokeDasharray = len;
    const e = p.enter;
    tl.from(a, { y: u(40), opacity: 0, duration: 0.4 }, e);
    tl.fromTo(path, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.35, ease: "power2.in" }, e + 0.7);
    tl.to(a, { opacity: 0.6, scale: 0.92, duration: 0.3 }, e + 1.05);
    tl.from(b, { y: -u(60), scale: 1.4, opacity: 0, duration: 0.45, ease: "back.out(2)" }, e + 1.1);
    tl.to(wrap, { opacity: 0, duration: 0.25 }, fx.dur - 0.28);
  },
});
