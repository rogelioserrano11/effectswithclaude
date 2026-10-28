"""Run a plan: render each effect window of your clip and lay the segments back over the original, audio intact.

plan.json
{
  "clip": "me.mp4",                 # your talking-head clip (paths are relative to the plan file)
  "out": "final.mp4",
  "trim": [0, 12.5],                # optional: only keep this part of the clip
  "brand": {"accent": "#ff6b1a"},   # optional: colours, handle (see README)
  "fonts": {"display": "MyFont.ttf"},
  "effects": [
    {"fx": "giant-word-behind", "at": 1.2, "dur": 3.0, "params": {"word": "FOCUS"}}
  ]
}
"""
import hashlib
import json
import os
import subprocess

from .media import need, probe
from .prep import prep
from .render import render, resolve_media


def load_plan(path):
    with open(path, encoding="utf-8") as f:
        plan = json.load(f)
    base = os.path.dirname(os.path.abspath(path))
    rel = lambda p: p if os.path.isabs(p) else os.path.join(base, p)
    plan["clip"] = rel(plan["clip"])
    plan["out"] = rel(plan.get("out") or os.path.splitext(os.path.basename(path))[0] + ".mp4")
    plan["fonts"] = {k: rel(v) for k, v in (plan.get("fonts") or {}).items()}
    work = base if os.path.basename(base) == ".efx" else os.path.join(base, ".efx")
    plan["_base"] = base
    plan["_work"] = os.path.join(work, os.path.splitext(os.path.basename(path))[0])
    return plan


def check(plan):
    info = probe(plan["clip"])
    t0, t1 = plan.get("trim") or [0, info["dur"]]
    problems, last_end = [], None
    for k, e in enumerate(sorted(plan["effects"], key=lambda e: e["at"])):
        a, d = e["at"], e.get("dur", 3)
        if a < 0 or t0 + a + d > t1 + 1e-3:
            problems.append(f"effect {k} ({e['fx']}) runs past the end of the clip ({a}+{d}s > {t1 - t0:.2f}s)")
        if last_end is not None and a < last_end - 1e-3:
            problems.append(f"effect {k} ({e['fx']}) overlaps the previous one")
        last_end = a + d
    return problems


def build(plan_path, workers=None, scale=1.0, only=None, log=print):
    need("ffmpeg")
    plan = load_plan(plan_path)
    problems = check(plan)
    if problems:
        raise SystemExit("plan problems:\n  " + "\n  ".join(problems))
    info = probe(plan["clip"])
    t0, t1 = plan.get("trim") or [0, info["dur"]]
    segs = []
    for k, e in enumerate(plan["effects"]):
        if only is not None and k not in only:
            continue
        job = os.path.join(plan["_work"], f"{k:02d}_{e['fx']}")
        os.makedirs(job, exist_ok=True)
        log(f"[{k + 1}/{len(plan['effects'])}] {e['fx']} at {e['at']}s for {e.get('dur', 3)}s")
        # the cut-out of a clip window is shared by every effect that uses the same window
        key = hashlib.sha1(f"{os.path.abspath(plan['clip'])}|{t0 + e['at']:.3f}|{e.get('dur', 3):.3f}".encode()).hexdigest()[:12]
        cache = os.path.join(os.path.dirname(plan["_work"]), "cache", key)
        os.makedirs(cache, exist_ok=True)
        track = prep(plan["clip"], t0 + e["at"], e.get("dur", 3), cache, log=log)
        seg = os.path.join(job, "segment.mp4")
        render(job, e["fx"], track, seg, resolve_media(e.get("params"), plan["_base"]), plan.get("brand"), plan.get("fonts"), workers, scale, log,
               frames_dir=cache)
        segs.append((e["at"], seg))

    # original clip as the base layer, each rendered segment on top during its window
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.3f}", "-to", f"{t1:.3f}", "-i", plan["clip"]]
    for _, s in segs:
        cmd += ["-i", s]
    w, h = info["w"], info["h"]
    if scale != 1.0:
        w, h = int(w * scale) // 2 * 2, int(h * scale) // 2 * 2
    graph = [f"[0:v]setpts=PTS-STARTPTS,scale={w}:{h},setsar=1[v0]"]
    for k, (at, _) in enumerate(segs):
        graph.append(f"[{k + 1}:v]scale={w}:{h},setsar=1,setpts=PTS-STARTPTS+{at:.4f}/TB[s{k}]")
        graph.append(f"[v{k}][s{k}]overlay=eof_action=pass:repeatlast=0[v{k + 1}]")
    cmd += ["-filter_complex", ";".join(graph), "-map", f"[v{len(segs)}]"]
    if info["audio"]:
        cmd += ["-map", "0:a:0", "-c:a", "aac", "-b:a", "192k"]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            plan["out"]]
    subprocess.run(cmd, check=True)
    log(f"done: {plan['out']}")
    return plan["out"]
