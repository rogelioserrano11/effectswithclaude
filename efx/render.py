"""Render one effect over a prepared job folder: Chromium draws each frame, ffmpeg encodes the segment.

The page is generated into the job folder (page.html) so frames/ and person/ load by relative path.
"""
import asyncio
import json
import os
import shutil
import subprocess
from pathlib import Path

from .assets import FONTS, ROOT, VENDOR

RUNTIME = os.path.join(ROOT, "efx", "runtime", "fx.js")
EFFECTS = os.path.join(ROOT, "effects")

PAGE = """<!doctype html><html><head><meta charset="utf-8"><base href="{base}"></head>
<body><div id="stage"></div>
<script src="{gsap}"></script>
<script>window.__FX_SPEC = {spec};</script>
<script src="{runtime}"></script>
<script src="{effect}"></script>
</body></html>"""


def effect_path(name):
    p = os.path.join(EFFECTS, name, "effect.js")
    if not os.path.isfile(p):
        known = ", ".join(sorted(list_effects()))
        raise SystemExit(f"unknown effect '{name}'. Available: {known}")
    return p


def list_effects():
    return [d for d in os.listdir(EFFECTS) if os.path.isfile(os.path.join(EFFECTS, d, "effect.js"))]


def uri(path):
    return Path(os.path.abspath(path)).as_uri()


def font_uris(fonts):
    default = {"display": os.path.join(FONTS, "Anton-Regular.ttf"), "body": os.path.join(FONTS, "Inter.ttf"),
               "mono": os.path.join(FONTS, "JetBrainsMono.ttf")}
    out = {}
    for k, v in default.items():
        path = (fonts or {}).get(k) or v
        out[k] = uri(path) if os.path.isfile(path) else None
    return out


def resolve_media(params, base):
    """Image paths in params (`images`, `image`, `logo`) become file URLs the page can load."""
    out = dict(params or {})
    for k in ("images", "image", "logo", "before_image", "after_image"):
        v = out.get(k)
        if not v:
            continue
        one = lambda x: uri(x if os.path.isabs(x) else os.path.join(base, x)) if isinstance(x, str) and not x.startswith(("http", "data:", "file:")) else x
        out[k] = [one(x) for x in v] if isinstance(v, list) else one(v)
    return out


def write_page(job, effect, track, params, brand=None, fonts=None, n=None, frames_dir=None):
    spec = {"w": track["w"], "h": track["h"], "fps": track["fps"], "n": n or track["n"],
            "track": {"face": track["face"], "top": track["top"]},
            "params": params or {}, "brand": brand or {}, "fonts": font_uris(fonts), "effect": effect}
    html = PAGE.format(base=uri(frames_dir or job) + "/", gsap=uri(os.path.join(VENDOR, "gsap.min.js")), runtime=uri(RUNTIME),
                       effect=uri(effect_path(effect)), spec=json.dumps(spec))
    page = os.path.join(job, "page.html")
    with open(page, "w", encoding="utf-8") as f:
        f.write(html)
    return page


async def _render(page_path, n, w, h, out_dir, workers, scale, log):
    from playwright.async_api import async_playwright
    errors = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(args=["--allow-file-access-from-files", "--disable-web-security"])

        async def worker(idx):
            ctx = await browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=scale)
            page = await ctx.new_page()
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            await page.goto(uri(page_path))
            await page.evaluate("() => window.__fxReady")
            stage = page.locator("#stage")
            for i in range(idx, n, workers):
                await page.evaluate("(i) => window.__fxFrame(i)", i)
                await stage.screenshot(path=os.path.join(out_dir, f"{i + 1:05d}.jpg"), type="jpeg", quality=93, timeout=180000)
                if errors:
                    break
            await ctx.close()

        await asyncio.gather(*(worker(k) for k in range(workers)))
        await browser.close()
    if errors:
        raise SystemExit("effect failed in the browser:\n  " + "\n  ".join(errors[:5]))


def render(job, effect, track, out, params=None, brand=None, fonts=None, workers=None, scale=1.0, log=print,
           frames_dir=None):
    page = write_page(job, effect, track, params, brand, fonts, frames_dir=frames_dir)
    shots = os.path.join(job, "out")
    shutil.rmtree(shots, ignore_errors=True)
    os.makedirs(shots)
    workers = workers or max(1, min(6, (os.cpu_count() or 4) // 2))
    log(f"  render {effect}: {track['n']} frames, {workers} workers")
    asyncio.run(_render(page, track["n"], track["w"], track["h"], shots, workers, scale, log))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", f"{track['fps']:g}", "-i",
                    os.path.join(shots, "%05d.jpg"), "-c:v", "libx264", "-preset", "medium", "-crf", "16",
                    "-pix_fmt", "yuv420p", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", out], check=True)
    return out
