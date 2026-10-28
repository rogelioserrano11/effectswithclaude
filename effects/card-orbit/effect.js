// Your reels orbit your head in 3D: cards swing out from behind you, pass in front and disappear behind again.
//
// params
//   images    list of thumbnails (9:16 frames of your reels); without it, numbered tiles are drawn
//   labels    optional caption per card ("1.2M views")
//   turns     how many full turns over the effect (default 0.85)
//   tilt      ring tilt (0 = flat, default 0.16)
FX.effect({
  defaults: { images: [], labels: [], count: 7, turns: 0.85, tilt: 0.16, size: 230, enter: 0.1 },
  build(fx, p) {
    const { W, tl, u } = fx;
    const imgs = p.images || [];
    const n = imgs.length ? Math.min(imgs.length, 10) : p.count;
    const cw = u(p.size), ch = cw * 16 / 9;
    const cards = [];
    for (let i = 0; i < n; i++) {
      const el = fx.el("div", { css: { position: "absolute", left: "0px", top: "0px", width: cw + "px", height: ch + "px",
        marginLeft: -cw / 2 + "px", marginTop: -ch / 2 + "px", borderRadius: u(22) + "px", overflow: "hidden",
        border: `${u(3)}px solid rgba(255,255,255,.9)`, boxShadow: `0 ${u(20)}px ${u(50)}px rgba(0,0,0,.45)`,
        background: `linear-gradient(160deg, color-mix(in srgb,var(--accent) 85%,#000), #111)` } }, fx.front);
      if (imgs[i]) {
        el.innerHTML = `<img src="${imgs[i]}" style="width:100%;height:100%;object-fit:cover;display:block">`;
      } else {
        el.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
          font-family:var(--display);font-size:${u(110)}px;color:rgba(255,255,255,.95)">${String(i + 1).padStart(2, "0")}</div>`;
      }
      const lab = (p.labels || [])[i];
      if (lab) el.insertAdjacentHTML("beforeend", `<div style="position:absolute;left:0;right:0;bottom:0;padding:${u(40)}px ${u(12)}px ${u(12)}px;
        background:linear-gradient(0deg,rgba(0,0,0,.75),transparent);font-weight:800;font-size:${u(26)}px;color:#fff;text-align:center">▶ ${lab}</div>`);
      cards.push(el);
    }

    // ring around your head: radius grows in, spins, shrinks out
    const ring = { r: 0, spin: 0, o: 0 };
    const e = p.enter;
    tl.to(ring, { r: 1, o: 1, duration: 0.7, ease: "back.out(1.4)" }, e);
    tl.to(ring, { spin: p.turns * Math.PI * 2, duration: fx.dur - e, ease: "power1.inOut" }, e);
    tl.to(ring, { r: 0.2, o: 0, duration: 0.35, ease: "power2.in" }, fx.dur - 0.35);

    fx.onFrame((t) => {
      const f = fx.face(t);
      const cx = f.x, cy = f.y - f.h * 0.05;
      const rx = W * 0.43 * ring.r, ry = W * p.tilt * ring.r;
      cards.forEach((el, i) => {
        const a = ring.spin + (i / n) * Math.PI * 2 + Math.PI / 2;
        const z = Math.sin(a);                         // +1 in front of you, -1 behind
        const x = cx + Math.cos(a) * rx, y = cy + z * ry;
        const s = 0.72 + 0.28 * (z + 1) / 2;
        const layer = z >= 0 ? fx.front : fx.behind;
        if (el.parentNode !== layer) layer.appendChild(el);
        el.style.zIndex = String(Math.round(z * 100) + 100);
        el.style.transform = `translate(${x}px, ${y}px) scale(${s}) rotateY(${(-Math.cos(a) * 38).toFixed(2)}deg)`;
        el.style.opacity = ring.o * (0.55 + 0.45 * (z + 1) / 2);
        el.style.filter = z < 0 ? `brightness(${0.7 + 0.3 * (1 + z)})` : "none";
      });
    });
    [fx.front, fx.behind].forEach((l) => { l.style.perspective = u(1800) + "px"; });
    tl.to(fx.shade, { opacity: 0.22, duration: 0.5 }, e);
    tl.to(fx.shade, { opacity: 0, duration: 0.3 }, fx.dur - 0.3);
  },
});
