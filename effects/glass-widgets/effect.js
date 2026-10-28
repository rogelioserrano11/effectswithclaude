// Frosted-glass stat cards pop in around your head; one slides out from behind it, a follow pill gets clicked.
//
// params
//   views, viewsLabel, delta     top-left card: a number that counts up and a green change chip
//   watch, watchLabel, watchUnit top-right card: a number and a sparkline that draws itself
//   followers, followersLabel    card that slides out from behind your head
//   name, handle                 the follow pill (handle defaults to brand.handle)
//   tone                         "dark" (default) or "light" glass
FX.effect({
  defaults: {
    views: 189000, viewsLabel: "Views this week", delta: "+38%",
    watch: 4812, watchLabel: "Watch time", watchUnit: "h",
    followers: 2140, followersLabel: "New followers",
    name: "", handle: "", tone: "dark", enter: 0.15,
  },
  build(fx, p) {
    const { W, H, tl, u } = fx;
    const dark = p.tone !== "light";
    const ink = dark ? "#fff" : "#111";
    const sub = dark ? "rgba(255,255,255,.72)" : "rgba(0,0,0,.55)";
    const glass = {
      position: "absolute", borderRadius: u(30) + "px", padding: `${u(24)}px ${u(28)}px`,
      background: dark ? "rgba(16,18,26,.42)" : "rgba(255,255,255,.55)",
      backdropFilter: `blur(${u(22)}px) saturate(1.5)`,
      border: `${u(1.5)}px solid ${dark ? "rgba(255,255,255,.28)" : "rgba(255,255,255,.8)"}`,
      boxShadow: `0 ${u(18)}px ${u(50)}px rgba(0,0,0,.28), inset 0 ${u(1)}px 0 rgba(255,255,255,.25)`,
      color: ink, fontFamily: "var(--body)", transformOrigin: "50% 60%",
    };
    const label = (t) => `<div style="font-size:${u(27)}px;font-weight:600;color:${sub};letter-spacing:.01em">${t}</div>`;

    // the free columns either side of your face, from the face track at the moment the cards land
    const f = fx.face(p.enter + 0.4);
    const leftEdge = Math.max(u(28), 0), rightEdge = W - u(28);
    const colW = Math.max(u(320), Math.min(u(400), f.x - f.w * 0.5 - u(36)));
    const topY = Math.max(u(220), f.y - f.h * 0.62);

    // A · views (front, left, forehead height)
    const a = fx.el("div", { css: { ...glass, left: leftEdge + "px", top: topY + "px", width: colW + "px" } });
    a.innerHTML = label(p.viewsLabel);
    const aNum = fx.el("div", { css: { fontSize: u(84) + "px", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-.02em", marginTop: u(6) + "px" } }, a);
    const chip = fx.el("div", { text: "▲ " + String(p.delta).replace(/^\+/, ""), css: { display: "inline-block", marginTop: u(10) + "px",
      padding: `${u(5)}px ${u(14)}px`, borderRadius: u(40) + "px", fontSize: u(22) + "px", fontWeight: 700,
      color: "#0b3d1f", background: "#4ade80" } }, a);
    fx.counter(aNum, p.views, { at: p.enter + 0.15, dur: 1.4 });

    // B · watch time + sparkline (front, right, jaw height — under the card that hides behind you)
    const b = fx.el("div", { css: { ...glass, left: (rightEdge - colW) + "px", top: (topY + u(200)) + "px", width: colW + "px" } });
    b.innerHTML = label(p.watchLabel);
    const bNum = fx.el("div", { css: { fontSize: u(64) + "px", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-.02em" } }, b);
    fx.counter(bNum, p.watch, { at: p.enter + 0.3, dur: 1.4, fmt: (v) => Math.round(v).toLocaleString("en-US") + p.watchUnit });
    const sw = colW - u(56), sh = u(70);
    const pts = [0.15, 0.22, 0.18, 0.34, 0.3, 0.48, 0.44, 0.62, 0.7, 0.66, 0.86, 1];
    const d = pts.map((v, i) => `${i ? "L" : "M"}${(i / (pts.length - 1) * sw).toFixed(1)},${(sh - v * sh * 0.9 - 4).toFixed(1)}`).join(" ");
    b.insertAdjacentHTML("beforeend", `<svg width="${sw}" height="${sh}" style="display:block;margin-top:${u(8)}px;overflow:visible">
      <defs><linearGradient id="gw-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4ade80" stop-opacity=".35"/><stop offset="1" stop-color="#4ade80" stop-opacity="0"/></linearGradient></defs>
      <path class="area" d="${d} L${sw},${sh} L0,${sh} Z" fill="url(#gw-fill)"/>
      <path class="line" d="${d}" fill="none" stroke="#4ade80" stroke-width="${u(5)}" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
    const line = b.querySelector(".line"), area = b.querySelector(".area");
    const len = line.getTotalLength();
    line.style.strokeDasharray = len;
    tl.fromTo(line, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut" }, p.enter + 0.35);
    tl.fromTo(area, { opacity: 0 }, { opacity: 1, duration: 0.8 }, p.enter + 0.9);

    // C · followers (BEHIND your head: it starts under your hair and slides out to the right, text right-aligned)
    const cLeft = f.x + f.w * 0.05;
    const c = fx.el("div", { css: { ...glass, left: cLeft + "px", top: (topY - u(10)) + "px", width: (rightEdge - cLeft) + "px",
      textAlign: "right" } }, fx.behind);
    c.innerHTML = label(p.followersLabel);
    const cNum = fx.el("div", { css: { fontSize: u(54) + "px", fontWeight: 800, lineHeight: 1.1, color: "#4ade80" } }, c);
    tl.from(c, { x: -u(160), duration: 0.8, ease: "power3.out" }, p.enter + 0.2);
    fx.counter(cNum, p.followers, { at: p.enter + 0.45, dur: 1.2, fmt: (v) => "+" + Math.round(v).toLocaleString("en-US") });

    // D · follow pill (screen space, above the Reels caption area)
    const handle = p.handle || fx.brand.handle;
    const name = p.name || handle.replace(/^@/, "").split(/[._]/)[0];
    const initials = name.split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase();
    const pill = fx.el("div", { css: { ...glass, left: "50%", top: (H - u(560)) + "px", transform: "translateX(-50%)",
      display: "flex", alignItems: "center", gap: u(16) + "px", padding: `${u(12)}px ${u(14)}px ${u(12)}px ${u(12)}px`,
      borderRadius: u(60) + "px", whiteSpace: "nowrap" } }, fx.hud);
    pill.innerHTML = `<div style="width:${u(64)}px;height:${u(64)}px;border-radius:50%;background:var(--accent);display:flex;
      align-items:center;justify-content:center;font-weight:800;font-size:${u(26)}px;color:#fff">${initials}</div>
      <div style="font-size:${u(28)}px;font-weight:700;padding-right:${u(8)}px">${handle}</div>`;
    const btn = fx.el("div", { text: "Follow", css: { padding: `${u(14)}px ${u(30)}px`, borderRadius: u(40) + "px",
      background: "var(--accent2)", color: "#fff", fontWeight: 800, fontSize: u(26) + "px" } }, pill);

    // motion: pop in, drift with your head, click, pop out
    const cards = [a, b, c];
    tl.from(cards, { scale: 0.6, opacity: 0, y: u(40), filter: `blur(${u(12)}px)`, duration: 0.6, ease: "back.out(1.7)", stagger: 0.12 }, p.enter);
    tl.from(chip, { scale: 0, duration: 0.4, ease: "back.out(2.5)" }, p.enter + 1.2);
    tl.from(pill, { yPercent: 120, opacity: 0, duration: 0.55, ease: "back.out(1.6)" }, p.enter + 0.5);
    const click = Math.min(fx.dur - 0.8, p.enter + 1.7);
    tl.to(btn, { scale: 0.86, duration: 0.09, ease: "power2.in" }, click)
      .call(() => {}, null, click + 0.09)
      .to(btn, { scale: 1, duration: 0.25, ease: "back.out(3)" }, click + 0.09);
    fx.onFrame((t) => {
      const on = t >= click + 0.09;
      btn.textContent = on ? "Following ✓" : "Follow";
      btn.style.background = on ? "rgba(255,255,255,.18)" : "var(--accent2)";
    });
    const f0 = fx.face(p.enter + 0.4);
    fx.onFrame((t) => {            // parallax: cards follow your head a little, the far card less
      const ft = fx.face(t);
      const dx = ft.x - f0.x, dy = ft.y - f0.y;
      a.style.translate = `${dx * 0.35}px ${dy * 0.35}px`;
      b.style.translate = `${dx * 0.35}px ${dy * 0.35}px`;
      c.style.translate = `${dx * 0.15}px ${dy * 0.15}px`;
    });
    const out = fx.dur - 0.32;
    tl.to([...cards, pill], { scale: 0.85, opacity: 0, duration: 0.28, ease: "power2.in", stagger: 0.03 }, out);
  },
});
