# Writing an effect

An effect is one file, `effects/<name>/effect.js`, whose first line is a one-sentence description (shown by `efx list`).

```js
// A one-line description of what the viewer sees.
FX.effect({
  defaults: { word: "HELLO", enter: 0.2 },        // every option with its default
  build(fx, p) {                                   // p = defaults merged with the plan's params
    const el = fx.el("div", { text: p.word, css: { position: "absolute", top: fx.u(300) + "px" } }, fx.behind);
    fx.tl.from(el, { opacity: 0, y: fx.u(40), duration: 0.5 }, p.enter);
  },
});
```

## The stage

| Layer | What it is |
|---|---|
| `fx.cam` | camera: everything below moves with it (`gsap.to(fx.cam, fx.aim(x, y, 1.4))`) |
| `fx.fill` | wall extension shown when the shot slides down (`fx.reframe`) |
| `fx.plate` / `fx.bg` | the source frame |
| `fx.shade` | black veil over the room only — tween its `opacity` to dim the background |
| `fx.behind` | your layer behind the person |
| `fx.personWrap` / `fx.person` | the person, cut out (filters here = rim light, sticker outline…) |
| `fx.front` | your layer in front of the person |
| `fx.hud` | screen layer, not moved by the camera (captions, tags, CTAs) |

## The API

| | |
|---|---|
| `fx.W`, `fx.H`, `fx.fps`, `fx.dur` | canvas size, frame rate, effect length (s) |
| `fx.tl` | the single paused GSAP timeline; positions are seconds from the effect start |
| `fx.u(px)` | design at 1080 px wide; returns px for the real canvas |
| `fx.face(t)` | `{x, y, w, h, top}` of the face at time t, in stage px (after any reframe) |
| `fx.headTop(t0, t1)` | highest point of the head during the window — the line text behind should sit on |
| `fx.roomFor(need, t0, t1)` | how far to slide the shot down so the head stays `need` px below the top |
| `fx.reframe(scale, dy)` | apply the slide (call from `fx.onFrame` when animating it) |
| `fx.aim(x, y, zoom)` | camera values that centre a point at a zoom without showing the frame edge |
| `fx.el(tag, {text, html, css, cls}, parent)` | create an element (default parent `fx.front`) |
| `fx.fit(el, maxW)` | largest font size that keeps `el` on one line |
| `fx.counter(el, to, {at, dur, fmt})` | count a number up on the timeline |
| `fx.onFrame((t, i) => …)` | per-frame hook for things that follow the face or are computed |
| `fx.mapFrame = (i) => j` | show source frame j at output frame i (freeze, slow-mo) |
| `fx.rng(seed)` | seeded random — the only randomness allowed |
| `fx.brand` | `{accent, accent2, text, bg, handle, …}`; CSS vars `--accent`, `--display`, `--body`, `--mono` |

## Contract

- No `Math.random`, `Date.now`, timers or network: every frame is rendered by seeking, in parallel, out of order.
- Animate with `fx.tl`; anything that depends on the face goes in `fx.onFrame`.
- Keep the top ~200 px and bottom ~400 px (at 1920 tall) free of important text: that is where the platform UI sits.
- Test: `python -m efx fx <name> clip.mp4 --at 2 --dur 3 --trim --scale 0.5`.
