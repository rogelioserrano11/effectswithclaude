---
name: effectswithclaude
description: Use when someone wants motion-graphics effects on a talking-head or avatar video — text or a word behind their head, glass stat cards, a chart behind them, reels orbiting them, spotlight/neon, before/after, punch-in, face tracking brackets, freeze-frame sticker, name tag / lower third, kinetic captions or a "comment WORD" ending — or says "edit my reel like this", "add effects to my video", "put X behind me".
---

# effects with claude

Renders motion effects over a vertical talking-head clip with the person cut out, so text and cards can sit behind them
and stay readable. Everything runs locally: `python -m efx` from this folder (use the `.venv` interpreter).

## Workflow

1. **Check setup.** If `models/modnet.onnx` is missing, run `./install.sh` (Windows: `install.ps1`) or
   `python -m efx setup`, and wait for `READY`.
2. **Read the clip.** `ffprobe` for length and fps. If the user gave timestamps, use them; otherwise ask what is said
   when, or place effects on natural beats (opening hook 0-3 s, key claim, proof/number, ending CTA).
3. **One idea per effect.** Pick from the table below; never stack two effects in the same window; 2.5-4 s each;
   leave at least 1 s of plain footage between effects in a short clip.
4. **Write `plan.json`** next to the clip (format in README; options per effect at the top of
   `effects/<name>/effect.js`; ready examples in `examples/`). Keep words short: 4-8 letters behind the head.
5. **Draft:** `python -m efx build plan.json --scale 0.5`. Extract 2-3 frames per effect with ffmpeg and look at them:
   is the text behind the head readable, does anything cover the face, does it clear the top ~200 px and bottom
   ~400 px (platform UI)?
6. **Final:** `python -m efx build plan.json`. Report the output path.

## Which effect

| The moment | Effect |
|---|---|
| Hook / topic word | `giant-word-behind`, `scramble-title`, `spotlight` |
| Numbers, growth, proof | `chart-behind`, `glass-widgets`, `stat-card`, `shoulder-compare` |
| Old vs new, price, time saved | `strike`, `shoulder-compare`, `grade-wipe` |
| Introduce yourself | `name-tag`, `freeze-sticker`, `hand-draw` |
| Emphasis on one word | `punch-in`, `kinetic-captions` |
| Portfolio, examples, "all of these" | `card-orbit`, `photo-burst` |
| Tech / AI vibe | `face-lock`, `scramble-title` |
| Ending | `comment-cta` |

## Rules

- Effects are deterministic: never edit an effect to use `Math.random` or `Date.now` (use `FX.rng(seed)`).
- Image params (`images`, `image`, `logo`) take paths relative to the plan file.
- Rendering cost is mostly the cut-out (~1-2 s per frame on a laptop CPU); windows are cached in `.efx/cache`, so
  re-rendering the same window with different text is fast.
- Writing a new effect: `docs/writing-effects.md`.
