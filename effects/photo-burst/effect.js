// Polaroids slap onto the wall behind you one after another, fanning out around your head.
//
// params
//   images    list of image paths (up to 12); without them, emoji tiles are used
//   tiles     emoji / short text for the tiles when there are no images
//   every     seconds between photos (default 0.19)
//   seed      layout seed (change it for a different scatter)
FX.effect({
  defaults: { images: [], tiles: ["🎬", "📈", "🤖", "⚡", "🎧", "🧠", "🚀", "💬"], every: 0.19, seed: 11, enter: 0.15, size: 300 },
  build(fx, p) {
    const { W, H, tl, u } = fx;
    const imgs = p.images || [];
    const n = Math.min(12, imgs.length || p.tiles.length);
    const rnd = fx.rng(p.seed);
    const f = fx.face(p.enter + 0.5);
    const s = u(p.size);
    const els = [];
    for (let i = 0; i < n; i++) {
      // alternate sides, climbing from the shoulders to above the head
      const side = i % 2 ? 1 : -1;
      const row = Math.floor(i / 2);
      const x = f.x + side * (f.w * 0.55 + s * 0.35 + rnd() * u(120)) - s / 2;
      const y = f.y + f.h * 0.6 - row * s * 0.42 - rnd() * u(60) - s / 2;
      const el = fx.el("div", { css: { position: "absolute", left: x + "px", top: y + "px", width: s + "px",
        padding: `${u(14)}px ${u(14)}px ${u(52)}px`, background: "#fbfbf7", borderRadius: u(6) + "px",
        boxShadow: `0 ${u(16)}px ${u(34)}px rgba(0,0,0,.45)`, rotate: ((rnd() - 0.5) * 22).toFixed(1) + "deg" } }, fx.behind);
      const pic = imgs[i]
        ? `<img src="${imgs[i]}" style="display:block;width:100%;aspect-ratio:1;object-fit:cover">`
        : `<div style="width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:${s * 0.42}px;
           background:linear-gradient(150deg,color-mix(in srgb,var(--accent) 35%,#fff),#eee)">${p.tiles[i % p.tiles.length]}</div>`;
      el.innerHTML = pic;
      els.push(el);
      tl.from(el, { scale: 1.8, opacity: 0, y: -u(60), duration: 0.22, ease: "power3.in" }, p.enter + i * p.every);
      tl.to(el, { scale: 0.96, duration: 0.08, yoyo: true, repeat: 1 }, p.enter + i * p.every + 0.22);
    }
    tl.to(fx.shade, { opacity: 0.25, duration: 0.4 }, p.enter);
    tl.to(els, { opacity: 0, scale: 0.8, duration: 0.25, stagger: 0.015 }, fx.dur - 0.32);
    tl.to(fx.shade, { opacity: 0, duration: 0.3 }, fx.dur - 0.3);
  },
});
