// The ending: "Comment WORD" lands with a shine and a bouncing arrow, then a DM notification drops in.
//
// params
//   word      the keyword (default "EFFECTS")
//   pre       text before it (default "Comment")
//   post      line under it (default "and I'll DM you the link")
//   dm        notification text (empty = no notification)
//   handle    sender (default brand.handle)
FX.effect({
  defaults: { word: "EFFECTS", pre: "Comment", post: "and I'll DM you the link", dm: "Here's your link 👉 effects pack",
    handle: "", y: 0.6, enter: 0.15 },
  build(fx, p) {
    const { W, H, tl, u } = fx;
    tl.to(fx.shade, { opacity: 0.45, duration: 0.4 }, p.enter);
    const wrap = fx.el("div", { css: { position: "absolute", left: "0px", width: W + "px", top: (H * p.y) + "px", textAlign: "center",
      color: "#fff", textShadow: `0 ${u(4)}px ${u(24)}px rgba(0,0,0,.55)` } }, fx.hud);
    const pre = fx.el("div", { text: p.pre, css: { fontSize: u(64) + "px", fontWeight: 800 } }, wrap);
    const word = fx.el("div", { text: `"${String(p.word).toUpperCase()}"`, css: { display: "inline-block", fontFamily: "var(--display)",
      fontSize: u(190) + "px", lineHeight: 1, marginTop: u(6) + "px", color: "transparent", WebkitBackgroundClip: "text", backgroundClip: "text",
      backgroundImage: "linear-gradient(100deg,var(--accent) 0%,var(--accent) 38%,#fff 50%,var(--accent) 62%,var(--accent) 100%)",
      backgroundSize: "300% 100%", textShadow: "none", filter: `drop-shadow(0 ${u(6)}px ${u(24)}px rgba(0,0,0,.5))` } }, wrap);
    const post = fx.el("div", { text: p.post, css: { fontSize: u(40) + "px", fontWeight: 600, marginTop: u(14) + "px", opacity: 0.92 } }, wrap);
    const arrow = fx.el("div", { text: "↓", css: { fontSize: u(110) + "px", fontWeight: 800, color: "var(--accent)", lineHeight: 1,
      marginTop: u(10) + "px" } }, wrap);
    const e = p.enter;
    tl.from(pre, { y: u(40), opacity: 0, duration: 0.35 }, e);
    tl.from(word, { scale: 2.2, opacity: 0, duration: 0.4, ease: "back.out(1.8)" }, e + 0.15);
    tl.fromTo(word, { backgroundPosition: "100% 0" }, { backgroundPosition: "0% 0", duration: 0.9, ease: "power2.inOut" }, e + 0.55);
    tl.from(post, { opacity: 0, y: u(20), duration: 0.35 }, e + 0.45);
    tl.from(arrow, { opacity: 0, duration: 0.2 }, e + 0.6);
    tl.to(arrow, { y: u(26), duration: 0.32, ease: "sine.inOut", yoyo: true, repeat: 7 }, e + 0.6);

    if (p.dm) {
      const handle = p.handle || fx.brand.handle;
      const note = fx.el("div", { css: { position: "absolute", left: u(36) + "px", right: u(36) + "px", top: u(70) + "px",
        display: "flex", alignItems: "center", gap: u(22) + "px", padding: `${u(22)}px ${u(26)}px`, borderRadius: u(34) + "px",
        background: "rgba(30,30,34,.82)", backdropFilter: `blur(${u(24)}px)`, color: "#fff",
        boxShadow: `0 ${u(20)}px ${u(50)}px rgba(0,0,0,.45)` } }, fx.hud);
      const ini = handle.replace(/^@/, "").slice(0, 2).toUpperCase();
      note.innerHTML = `<div style="width:${u(84)}px;height:${u(84)}px;flex:none;border-radius:50%;background:var(--accent);display:flex;
        align-items:center;justify-content:center;font-weight:800;font-size:${u(32)}px">${ini}</div>
        <div style="min-width:0"><div style="font-weight:800;font-size:${u(32)}px">${handle}<span style="opacity:.55;font-weight:500"> · now</span></div>
        <div style="font-size:${u(31)}px;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.dm}</div></div>`;
      const at = Math.min(fx.dur - 1.0, e + 1.5);
      tl.from(note, { yPercent: -160, duration: 0.5, ease: "back.out(1.4)" }, at);
    }
  },
});
