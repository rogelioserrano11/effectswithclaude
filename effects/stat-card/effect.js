// A repo-style stat card: the big number rolls up with motion blur, sub-stats pop in as chips.
//
// params
//   title     card title (default "owner/project")
//   icon      emoji or short text for the badge (default "★")
//   value     the number (counts up, compact: 62.3K)
//   unit      word after the number (default "stars")
//   stats     [{icon, label, value}] chips under the number
//   y         vertical position 0-1 (default 0.6)
FX.effect({
  defaults: { title: "owner/project", icon: "★", value: 62300, unit: "stars",
    stats: [{ icon: "⑂", label: "forks", value: 4800 }, { icon: "👁", label: "watching", value: 912 }], y: 0.6, enter: 0.15 },
  build(fx, p) {
    const { W, H, tl, u } = fx;
    const card = fx.el("div", { css: { position: "absolute", left: "50%", top: (H * p.y) + "px", width: u(820) + "px",
      marginLeft: -u(410) + "px", padding: `${u(36)}px ${u(44)}px`, borderRadius: u(36) + "px", color: "#fff",
      background: "rgba(13,17,23,.86)", border: `${u(2)}px solid rgba(255,255,255,.14)`, backdropFilter: `blur(${u(16)}px)`,
      boxShadow: `0 ${u(30)}px ${u(80)}px rgba(0,0,0,.5)`, transformOrigin: "50% 100%" } }, fx.front);
    card.innerHTML = `<div style="display:flex;align-items:center;gap:${u(18)}px;font-size:${u(34)}px;font-weight:700">
      <div style="width:${u(58)}px;height:${u(58)}px;border-radius:${u(14)}px;background:var(--accent);display:flex;align-items:center;
      justify-content:center;font-size:${u(32)}px">${p.icon}</div><span style="opacity:.9">${p.title}</span></div>`;
    const row = fx.el("div", { css: { display: "flex", alignItems: "baseline", gap: u(18) + "px", marginTop: u(18) + "px" } }, card);
    const num = fx.el("div", { css: { fontSize: u(150) + "px", fontWeight: 800, letterSpacing: "-.04em", lineHeight: 1 } }, row);
    fx.el("div", { text: p.unit, css: { fontSize: u(40) + "px", fontWeight: 600, opacity: 0.7 } }, row);
    const roll = { v: 0 };
    tl.to(roll, { v: p.value, duration: 1.3, ease: "power3.out" }, p.enter + 0.25);
    let last = 0;
    fx.onFrame(() => {                       // blur proportional to how fast the counter moves
      num.textContent = fx.compact(roll.v);
      const speed = Math.abs(roll.v - last) / Math.max(1, p.value) * fx.fps;
      num.style.filter = `blur(${Math.min(u(8), speed * u(3)).toFixed(1)}px)`;
      last = roll.v;
    });
    const chips = fx.el("div", { css: { display: "flex", gap: u(14) + "px", marginTop: u(24) + "px", flexWrap: "wrap" } }, card);
    const cs = (p.stats || []).map((s) => {
      const c = fx.el("div", { css: { padding: `${u(10)}px ${u(20)}px`, borderRadius: u(40) + "px", fontSize: u(28) + "px", fontWeight: 700,
        background: "rgba(255,255,255,.1)", border: `${u(1.5)}px solid rgba(255,255,255,.16)` } }, chips);
      c.textContent = `${s.icon} ${fx.compact(s.value)} ${s.label}`;
      return c;
    });
    tl.from(card, { y: u(140), scale: 0.86, opacity: 0, rotateX: 25, duration: 0.6, ease: "back.out(1.5)" }, p.enter);
    tl.from(cs, { scale: 0, duration: 0.35, ease: "back.out(2.4)", stagger: 0.1 }, p.enter + 1.0);
    tl.to(card, { y: u(80), opacity: 0, duration: 0.3, ease: "power2.in" }, fx.dur - 0.32);
  },
});
