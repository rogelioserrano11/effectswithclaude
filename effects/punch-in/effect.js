// A hard punch-in on one word: the camera snaps to your face with motion blur, the room drops out of focus.
//
// params
//   at        when the punch lands (s from the effect start, default 0.4)
//   zoom      how tight (default 1.38)
//   hold      how long it stays in (default 1.4)
//   word      optional caption that slams in with the punch
FX.effect({
  defaults: { at: 0.4, zoom: 1.38, hold: 1.4, word: "", shake: true },
  build(fx, p) {
    const { tl, u, H, W } = fx;
    const f = fx.face(p.at + 0.2);
    const aim = fx.aim(f.x, f.y + f.h * 0.15, p.zoom);
    // the snap: overshoot, blur on the move, room goes soft (depth of field) while you stay sharp
    tl.to(fx.cam, { ...aim, duration: 0.16, ease: "power4.out" }, p.at);
    tl.fromTo(fx.cam, { filter: "blur(0px)" }, { filter: `blur(${u(10)}px)`, duration: 0.08, yoyo: true, repeat: 1, ease: "none" }, p.at);
    tl.to(fx.plate, { filter: `blur(${u(9)}px)`, duration: 0.25 }, p.at + 0.05);
    tl.to(fx.shade, { opacity: 0.12, duration: 0.25 }, p.at + 0.05);
    if (p.shake) {
      const o = { k: 0 };
      tl.fromTo(o, { k: 1 }, { k: 0, duration: 0.35, ease: "power2.out" }, p.at + 0.12);
      fx.onFrame((t) => {
        const a = o.k * u(14);
        fx.cam.style.translate = o.k ? `${(Math.sin(t * 91) * a).toFixed(1)}px ${(Math.cos(t * 77) * a).toFixed(1)}px` : "";
      });
    }
    if (p.word) {
      const w = fx.el("div", { text: String(p.word).toUpperCase(), css: { position: "absolute", left: "0px", width: W + "px",
        top: (H * 0.66) + "px", textAlign: "center", fontFamily: "var(--display)", fontSize: u(150) + "px", lineHeight: 1,
        color: "#fff", textShadow: `0 ${u(6)}px ${u(30)}px rgba(0,0,0,.55)` } }, fx.hud);
      tl.from(w, { scale: 1.8, opacity: 0, duration: 0.18, ease: "power4.out" }, p.at);
      tl.to(w, { opacity: 0, duration: 0.15 }, p.at + p.hold);
    }
    const back = Math.min(fx.dur - 0.3, p.at + p.hold);
    tl.to(fx.cam, { x: 0, y: 0, scale: 1, duration: 0.22, ease: "power3.inOut" }, back);
    tl.to(fx.plate, { filter: "blur(0px)", duration: 0.22 }, back);
    tl.to(fx.shade, { opacity: 0, duration: 0.22 }, back);
  },
});
