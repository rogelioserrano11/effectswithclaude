// Corner brackets snap onto your face and track it, with a scan line and a status tag; the camera leans in.
//
// params
//   label     tag under the brackets (default "TARGET LOCKED")
//   sub       small line after the label (default your handle)
//   color     "accent" (default) or any CSS colour
FX.effect({
  defaults: { label: "TARGET LOCKED", sub: "", color: "accent", enter: 0.2, follow: 0.18 },
  build(fx, p) {
    const { tl, u, W, H } = fx;
    const col = p.color === "accent" ? "var(--accent)" : p.color;
    const box = fx.el("div", { css: { position: "absolute", left: "0px", top: "0px" } }, fx.front);
    const L = u(70), T = u(8);
    const corners = ["tl", "tr", "bl", "br"].map((c) => fx.el("div", { css: { position: "absolute", width: L + "px", height: L + "px",
      [c[0] === "t" ? "top" : "bottom"]: "0px", [c[1] === "l" ? "left" : "right"]: "0px",
      [`border${c[0] === "t" ? "Top" : "Bottom"}`]: `${T}px solid ${col}`, [`border${c[1] === "l" ? "Left" : "Right"}`]: `${T}px solid ${col}`,
      filter: `drop-shadow(0 0 ${u(10)}px ${col})` } }, box));
    const scan = fx.el("div", { css: { position: "absolute", left: "0px", right: "0px", height: u(4) + "px", top: "0px",
      background: col, boxShadow: `0 0 ${u(18)}px ${col}`, opacity: 0.85 } }, box);
    const tag = fx.el("div", { css: { position: "absolute", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap",
      fontFamily: "var(--mono)", fontWeight: 700, fontSize: u(30) + "px", color: "#fff", padding: `${u(8)}px ${u(18)}px`,
      background: "rgba(0,0,0,.55)", borderLeft: `${u(6)}px solid ${col}` } }, box);
    const sub = p.sub || fx.brand.handle;
    tag.innerHTML = `${p.label}<span style="opacity:.65;font-weight:400"> · ${sub}</span>`;

    // brackets start wide and loose, snap to the face; tag types on
    const k = { s: 2.2, o: 0, scan: 0 };
    const e = p.enter;
    tl.to(k, { s: 1, o: 1, duration: 0.45, ease: "expo.out" }, e);
    tl.fromTo(k, { scan: 0 }, { scan: 1, duration: 0.9, ease: "sine.inOut", repeat: 1, yoyo: true }, e + 0.4);
    const chars = { n: 0 };
    const full = tag.textContent.length;
    tl.to(chars, { n: full, duration: 0.5, ease: "none" }, e + 0.45);
    const html = tag.innerHTML;
    // camera leans toward you a touch
    fx.onFrame((t) => {
      const f = fx.face(t);
      const bw = f.w * 1.25 * k.s, bh = f.h * 1.35 * k.s;
      box.style.width = bw + "px"; box.style.height = bh + "px";
      box.style.transform = `translate(${f.x - bw / 2}px, ${f.y - bh / 2 - f.h * 0.06}px)`;
      box.style.opacity = k.o;
      scan.style.top = (k.scan * (bh - u(4))) + "px";
      scan.style.opacity = t > e + 0.4 && t < e + 2.2 ? 0.85 : 0;
      tag.style.top = (bh + u(18)) + "px";
      const n = Math.round(chars.n);
      tag.innerHTML = n >= full ? html : `${p.label}${(" · " + sub)}`.slice(0, n) + "▌";
      const a = fx.aim(f.x, f.y, 1 + p.follow * k.o);
      fx.cam.style.transform = `translate(${a.x}px, ${a.y}px) scale(${a.scale})`;
    });
    tl.to(k, { o: 0, duration: 0.25 }, fx.dur - 0.3);
  },
});
