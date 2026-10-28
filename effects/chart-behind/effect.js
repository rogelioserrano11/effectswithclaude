// A bar chart rises from behind your shoulders; the top bar towers over your head and gets circled.
//
// params
//   title, sub    heading, top-left ("My top reels" / "by views")
//   items         [{label, value}] — the biggest one becomes the hero and is placed right above your head
//   safeTop       px kept free for the platform UI (default 170)
//   dim           darken the room (default 0.3)
FX.effect({
  defaults: {
    title: "My top reels", sub: "by views",
    items: [{ label: "Hook", value: 33000 }, { label: "Story", value: 82000 }, { label: "Data", value: 140000 },
            { label: "Demo", value: 197000 }, { label: "Tips", value: 124000 }, { label: "Tool", value: 49000 },
            { label: "Q&A", value: 38000 }],
    safeTop: 170, dim: 0.3, enter: 0.1,
  },
  build(fx, p) {
    const { W, H, tl, u } = fx;
    const t0 = p.enter, t1 = fx.dur;

    // hero (max) in the middle, the rest alternating outwards so the tall bars sit beside your head
    const sorted = [...p.items].sort((a, b) => b.value - a.value);
    const mid = Math.floor(sorted.length / 2);
    const items = new Array(sorted.length);
    sorted.forEach((it, k) => { items[mid + (k % 2 ? -1 : 1) * Math.ceil(k / 2)] = it; });   // mid, mid-1, mid+1, …
    const max = sorted[0].value;

    // headroom: the hero's value label needs to clear your head
    const chartTop = u(p.safeTop) + u(190);
    const dy = fx.roomFor(chartTop + u(150), t0, t1);
    const shot = { dy: 0 };
    if (dy > 0) tl.to(shot, { dy, duration: 0.5, ease: "power3.inOut" }, 0);
    fx.onFrame(() => fx.reframe(1, shot.dy));
    fx.reframe(1, dy);
    const f = fx.face(t0 + 0.5);
    fx.reframe(1, 0);
    // baseline at chin height: below it your shoulders hide everything, above it the wall shows the bars
    const baseline = f.y + f.h * 0.5;
    if (p.dim) tl.to(fx.shade, { opacity: p.dim, duration: 0.5 }, t0);

    const n = items.length, span = W * 0.94, slot = span / n, bw = slot * 0.7;
    const x0 = (W - span) / 2;
    const bars = [], labels = [];
    items.forEach((it, i) => {
      const hero = it === sorted[0];
      // bars start tall (35 %) so the short ones still clear your shoulders; the order stays honest
      const h = (0.35 + 0.65 * it.value / max) * (baseline - chartTop);
      const x = x0 + slot * i + (slot - bw) / 2;
      const bar = fx.el("div", { css: { position: "absolute", left: x + "px", top: (baseline - h) + "px", width: bw + "px",
        height: h + "px", borderRadius: `${u(18)}px ${u(18)}px ${u(4)}px ${u(4)}px`, transformOrigin: "50% 100%",
        background: hero ? "linear-gradient(180deg,var(--accent),color-mix(in srgb,var(--accent) 70%,#000))"
                         : "linear-gradient(180deg,rgba(255,255,255,.95),rgba(255,255,255,.55))",
        boxShadow: hero ? `0 0 ${u(50)}px color-mix(in srgb,var(--accent) 55%,transparent)` : "none" } }, fx.behind);
      const lab = fx.el("div", { css: { position: "absolute", left: (x + bw / 2) + "px", top: (baseline - h - u(hero ? 78 : 58)) + "px",
        transform: "translateX(-50%)", textAlign: "center", fontWeight: 800, lineHeight: 1, whiteSpace: "nowrap",
        fontSize: u(hero ? 50 : 32) + "px", color: "#fff", textShadow: `0 ${u(3)}px ${u(14)}px rgba(0,0,0,.5)` } }, fx.behind);
      const num = fx.el("div", {}, lab);
      fx.el("div", { text: it.label, css: { fontSize: u(hero ? 24 : 20) + "px", fontWeight: 600, opacity: 0.8, marginTop: u(6) + "px" } }, lab);
      const at = t0 + 0.35 + Math.abs(i - mid) * 0.07 + (hero ? 0.25 : 0);
      tl.from(bar, { scaleY: 0, duration: hero ? 0.9 : 0.7, ease: "power3.out" }, at);
      tl.from(lab, { opacity: 0, y: u(30), duration: 0.4 }, at + 0.2);
      fx.counter(num, it.value, { at, dur: hero ? 0.9 : 0.7 });
      bars.push(bar); labels.push(lab);
      if (hero) {
        // hand-drawn ring around the hero number
        const rw = u(250), rh = u(120);
        const ring = fx.el("div", { css: { position: "absolute", left: (x + bw / 2 - rw / 2) + "px",
          top: (baseline - h - u(78) - u(28)) + "px", width: rw + "px", height: rh + "px" } }, fx.behind);
        ring.innerHTML = `<svg width="${rw}" height="${rh}" viewBox="0 0 250 120" style="overflow:visible">
          <path d="M40,22 C95,2 205,6 232,46 C252,82 190,112 118,110 C52,108 8,86 14,56 C20,30 70,14 128,12"
           fill="none" stroke="var(--accent)" stroke-width="7" stroke-linecap="round"/></svg>`;
        const path = ring.querySelector("path"), len = path.getTotalLength();
        path.style.strokeDasharray = len;
        tl.fromTo(path, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.55, ease: "power2.inOut" }, at + 0.85);
        labels.push(ring);
      }
    });

    // heading, screen space top-left (sits in the room you made, never on your face)
    const head = fx.el("div", { css: { position: "absolute", left: u(64) + "px", top: u(p.safeTop - 40) + "px", lineHeight: 1.0 } }, fx.hud);
    head.innerHTML = `<div style="font-family:var(--display);font-size:${u(78)}px;color:#fff;text-shadow:0 ${u(4)}px ${u(20)}px rgba(0,0,0,.45)">${p.title}</div>
      <div style="font-family:var(--body);font-weight:700;font-style:italic;font-size:${u(44)}px;color:var(--accent);margin-top:${u(6)}px">${p.sub}</div>`;
    tl.from(head.children, { opacity: 0, x: -u(40), duration: 0.5, stagger: 0.12 }, t0 + 0.15);

    const out = fx.dur - 0.35;
    tl.to(bars, { scaleY: 0, duration: 0.3, ease: "power2.in", stagger: 0.02 }, out);
    tl.to([...labels, head], { opacity: 0, duration: 0.25 }, out);
  },
});
