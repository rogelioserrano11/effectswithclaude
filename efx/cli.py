"""efx — talking-head effects for your clips.

  efx setup                                   download models, GSAP, fonts and Chromium (prints READY)
  efx list                                    list the effects
  efx fx <effect> clip.mp4 --at 2 --dur 3 [--param word=FOCUS] [-o out.mp4]
  efx build plan.json [--scale 0.5] [--only 0,2]
  efx preview video.mp4 [-o preview.webp]     small looping preview for a README or a chat
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

if __package__ in (None, ""):
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    __package__ = "efx"

from .assets import ensure_all  # noqa: E402
from .build import build  # noqa: E402
from .media import need  # noqa: E402
from .render import EFFECTS, list_effects, resolve_media  # noqa: E402


def cmd_setup(_):
    need("ffmpeg")
    need("ffprobe")
    print("assets:")
    ensure_all()
    print("chromium:")
    subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)
    import cv2, onnxruntime, PIL  # noqa: F401,E401
    print("READY")


def describe(name):
    with open(os.path.join(EFFECTS, name, "effect.js"), encoding="utf-8") as f:
        first = f.readline().strip()
    return first.removeprefix("//").strip()


def cmd_list(_):
    for name in sorted(list_effects()):
        print(f"  {name:<20} {describe(name)}")


def parse_value(v):
    try:
        return json.loads(v)
    except ValueError:
        return v


def cmd_fx(a):
    params = {}
    for kv in a.param or []:
        k, _, v = kv.partition("=")
        params[k] = parse_value(v)
    params = resolve_media(params, os.getcwd())   # image paths are relative to where you run the command
    clip = os.path.abspath(a.clip)
    out = os.path.abspath(a.out or f"{os.path.splitext(clip)[0]}.{a.effect}.mp4")
    plan = {"clip": clip, "out": out, "effects": [{"fx": a.effect, "at": a.at, "dur": a.dur, "params": params}]}
    if a.trim:
        plan["trim"] = [a.at, a.at + a.dur]
        plan["effects"][0]["at"] = 0
    if a.brand:
        with open(a.brand, encoding="utf-8") as f:
            b = json.load(f)
        plan["brand"], plan["fonts"] = b.get("brand", b), b.get("fonts", {})
    work = os.path.join(os.path.dirname(clip), ".efx")
    os.makedirs(work, exist_ok=True)
    path = os.path.join(work, f"fx-{a.effect}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(plan, f, indent=1)
    build(path, workers=a.workers, scale=a.scale)


def cmd_build(a):
    only = [int(x) for x in a.only.split(",")] if a.only else None
    build(a.plan, workers=a.workers, scale=a.scale, only=only)


def cmd_preview(a):
    out = a.out or os.path.splitext(a.video)[0] + ".webp"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.video, "-vf", f"fps=12,scale={a.width}:-2:flags=lanczos",
                    "-loop", "0", "-c:v", "libwebp", "-quality", "70", "-an", out], check=True)
    print(out)


def main(argv=None):
    ap = argparse.ArgumentParser(prog="efx", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("setup").set_defaults(fn=cmd_setup)
    sub.add_parser("list").set_defaults(fn=cmd_list)

    f = sub.add_parser("fx", help="apply one effect to a window of a clip")
    f.add_argument("effect")
    f.add_argument("clip")
    f.add_argument("--at", type=float, default=0.0, help="start (s)")
    f.add_argument("--dur", type=float, default=3.0, help="length (s)")
    f.add_argument("--param", action="append", help="key=value (value may be JSON)")
    f.add_argument("--brand", help="brand.json with colours and fonts")
    f.add_argument("--trim", action="store_true", help="output only the effect window")
    f.add_argument("-o", "--out")
    f.add_argument("--workers", type=int)
    f.add_argument("--scale", type=float, default=1.0, help="0.5 = fast draft")
    f.set_defaults(fn=cmd_fx)

    b = sub.add_parser("build", help="render a plan.json")
    b.add_argument("plan")
    b.add_argument("--workers", type=int)
    b.add_argument("--scale", type=float, default=1.0)
    b.add_argument("--only", help="comma-separated effect indexes")
    b.set_defaults(fn=cmd_build)

    p = sub.add_parser("preview", help="looping webp preview")
    p.add_argument("video")
    p.add_argument("-o", "--out")
    p.add_argument("--width", type=int, default=270)
    p.set_defaults(fn=cmd_preview)

    a = ap.parse_args(argv)
    a.fn(a)


if __name__ == "__main__":
    main()
