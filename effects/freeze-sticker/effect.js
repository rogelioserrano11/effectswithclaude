// Freeze! The room goes grey, you pop out as a white-outlined sticker with a name tag, then the clip runs again.
//
// params
//   at        when to freeze (default 0.3 s)
//   hold      how long (default 1.8 s)
//   tag       text on the tag (default "this is me 👋")
//   tilt      sticker rotation in degrees (default -3)
FX.effect({
  defaults: { at: 0.3, hold: 1.8, tag: "this is me 👋", tilt: -3 },
  build(fx, p) {
    const { tl, u, W } = fx;
    const fps = fx.fps;
    const fi = Math.round(p.at * fps), fo = Math.round((p.at + p.hold) * fps);
    fx.mapFrame = (i) => (i >= fi && i < fo ? fi : i);       // hold one frame while frozen

    const flash = fx.el("div", { css: { position: "absolute", inset: "0px", background: "#fff", opacity: 0 } }, fx.hud);
    tl.fromTo(flash, { opacity: 0.85 }, { opacity: 0, duration: 0.25, ease: "power2.out" }, p.at);
    tl.set(flash, { opacity: 0 }, 0);

    // room: grey and darker. you: white sticker outline, lifted, slightly rotated
    tl.to(fx.plate, { filter: "grayscale(1) brightness(.7) contrast(.95)", duration: 0.2 }, p.at);
    const o = u(7);
    const outline = [[o, 0], [-o, 0], [0, o], [0, -o]]
      .map(([x, y]) => `drop-shadow(${x.toFixed(1)}px ${y.toFixed(1)}px 0 #fff)`).join(" ");
    const f = fx.face(p.at);
    fx.person.style.transformOrigin = `${f.x}px ${f.y + f.h}px`;
    tl.set(fx.person, { filter: `${outline} drop-shadow(0 ${u(24)}px ${u(30)}px rgba(0,0,0,.45))` }, p.at);
    tl.fromTo(fx.person, { scale: 1, rotate: 0 }, { scale: 1.05, rotate: p.tilt, duration: 0.35, ease: "back.out(2.2)" }, p.at);

    const tag = fx.el("div", { text: p.tag, css: { position: "absolute", left: Math.min(W - u(460), f.x + f.w * 0.3) + "px",
      top: (f.y + f.h * 0.75) + "px", padding: `${u(16)}px ${u(30)}px`, borderRadius: u(16) + "px", background: "var(--accent)",
      color: "#fff", fontWeight: 800, fontSize: u(44) + "px", whiteSpace: "nowrap", rotate: "4deg",
      boxShadow: `0 ${u(14)}px ${u(30)}px rgba(0,0,0,.4)`, border: `${u(5)}px solid #fff` } }, fx.hud);
    tl.from(tag, { scale: 0, rotate: -20, duration: 0.4, ease: "back.out(2.4)" }, p.at + 0.25);

    // unfreeze
    const back = p.at + p.hold;
    tl.set(fx.person, { filter: "none" }, back);
    tl.to(fx.person, { scale: 1, rotate: 0, duration: 0.2 }, back);
    tl.to(fx.plate, { filter: "grayscale(0) brightness(1) contrast(1)", duration: 0.2 }, back);
    tl.to(tag, { scale: 0, duration: 0.2, ease: "power2.in" }, back - 0.1);
  },
});
