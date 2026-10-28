// A lower-third name tag: an accent bar wipes in, your name and role slide out of it, the handle types on.
//
// params
//   name, role, handle   (handle defaults to brand.handle)
//   side                 "left" (default) or "right"
//   y                    vertical position 0-1 (default 0.68, above the platform caption area)
FX.effect({
  defaults: { name: "Your Name", role: "Creator · AI automation", handle: "", side: "left", y: 0.68, enter: 0.15 },
  build(fx, p) {
    const { W, H, tl, u } = fx;
    const right = p.side === "right";
    const wrap = fx.el("div", { css: { position: "absolute", top: (H * p.y) + "px", [right ? "right" : "left"]: u(56) + "px",
      display: "flex", flexDirection: right ? "row-reverse" : "row", alignItems: "stretch", gap: u(20) + "px" } }, fx.hud);
    const bar = fx.el("div", { css: { width: u(12) + "px", borderRadius: u(6) + "px", background: "var(--accent)",
      boxShadow: `0 0 ${u(24)}px color-mix(in srgb,var(--accent) 70%,transparent)`, transformOrigin: "50% 0%" } }, wrap);
    const txt = fx.el("div", { css: { overflow: "hidden", textAlign: right ? "right" : "left", padding: `${u(6)}px 0` } }, wrap);
    const inner = fx.el("div", {}, txt);
    const name = fx.el("div", { text: p.name, css: { fontFamily: "var(--display)", fontSize: u(84) + "px", lineHeight: 1, color: "#fff",
      textShadow: `0 ${u(4)}px ${u(20)}px rgba(0,0,0,.55)` } }, inner);
    const role = fx.el("div", { text: p.role, css: { fontSize: u(34) + "px", fontWeight: 600, marginTop: u(10) + "px", color: "#fff",
      textShadow: `0 ${u(2)}px ${u(12)}px rgba(0,0,0,.6)` } }, inner);
    const handle = p.handle || fx.brand.handle;
    const h = fx.el("div", { css: { display: "inline-block", marginTop: u(14) + "px", padding: `${u(6)}px ${u(16)}px`, borderRadius: u(8) + "px",
      background: "var(--accent)", color: "#fff", fontWeight: 800, fontSize: u(28) + "px", fontFamily: "var(--mono)" } }, inner);
    // soft shadow band so it reads on any background
    const band = fx.el("div", { css: { position: "absolute", left: "0px", width: W + "px", top: (H * p.y - u(80)) + "px", height: u(380) + "px",
      background: `linear-gradient(${right ? 270 : 90}deg, rgba(0,0,0,.5), rgba(0,0,0,0) 70%)`, opacity: 0 } }, fx.hud);
    fx.hud.insertBefore(band, wrap);

    const e = p.enter, dir = right ? 1 : -1;
    tl.to(band, { opacity: 1, duration: 0.4 }, e);
    tl.from(bar, { scaleY: 0, duration: 0.35, ease: "power3.out" }, e);
    tl.from(name, { xPercent: dir * 105, duration: 0.5, ease: "power4.out" }, e + 0.12);
    tl.from(role, { xPercent: dir * 105, duration: 0.5, ease: "power4.out" }, e + 0.22);
    tl.from(h, { opacity: 0, y: u(16), duration: 0.3 }, e + 0.4);
    const n = { c: 0 };
    tl.to(n, { c: handle.length, duration: 0.45, ease: "none" }, e + 0.42);
    fx.onFrame(() => { h.textContent = handle.slice(0, Math.round(n.c)) || " "; });
    const out = fx.dur - 0.4;
    tl.to([name, role], { xPercent: dir * 105, duration: 0.3, ease: "power3.in", stagger: 0.05 }, out);
    tl.to([h, band], { opacity: 0, duration: 0.25 }, out);
    tl.to(bar, { scaleY: 0, duration: 0.25, ease: "power3.in" }, out + 0.12);
  },
});
