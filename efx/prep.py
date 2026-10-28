"""Prepare a clip window for an effect: frames, a clean person cut-out and a face track.

Writes into the job folder:
  frames/00001.jpg    the source frames
  person/00001.png    the same frame with the person's alpha (MODNet), used to put things BEHIND you
  track.json          {w, h, fps, start, n, face: [[cx, cy, fw, fh]], top: [y]}  in source pixels
                      `top` is the highest row of your head/hair per frame, so text can sit right above it.
"""
import json
import os
import subprocess

import cv2
import numpy as np
from PIL import Image

from .assets import model
from .media import probe

MATTE_SHORT = 512      # MODNet works on the short side at 512 px (multiple of 32)
FACE_W = 480           # face detection on a 480 px wide copy


class Matter:
    """MODNet on one frame, at the model's resolution. Temporal smoothing happens later, across frames."""

    def __init__(self, threads=0):
        import onnxruntime as ort
        opts = ort.SessionOptions()
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        opts.intra_op_num_threads = threads
        self.sess = ort.InferenceSession(model("modnet.onnx"), opts, providers=["CPUExecutionProvider"])
        self.inp = self.sess.get_inputs()[0].name

    def __call__(self, rgb):
        h, w = rgb.shape[:2]
        k = MATTE_SHORT / min(w, h)
        mw, mh = int(round(w * k / 32)) * 32, int(round(h * k / 32)) * 32
        x = cv2.resize(rgb, (mw, mh), interpolation=cv2.INTER_AREA).astype(np.float32)
        x = (x / 127.5 - 1.0).transpose(2, 0, 1)[None]
        return self.sess.run(None, {self.inp: x})[0][0, 0]


class FaceFinder:
    def __init__(self, w, h):
        self.k = FACE_W / w
        self.size = (FACE_W, int(round(h * self.k)))
        self.det = cv2.FaceDetectorYN_create(model("yunet.onnx"), "", self.size, 0.6, 0.3, 5000)

    def __call__(self, bgr):
        small = cv2.resize(bgr, self.size, interpolation=cv2.INTER_AREA)
        _, faces = self.det.detect(small)
        if faces is None or len(faces) == 0:
            return None
        x, y, fw, fh = max(faces, key=lambda f: f[2] * f[3])[:4]
        return [(x + fw / 2) / self.k, (y + fh / 2) / self.k, fw / self.k, fh / self.k]


def head_top(alpha, face):
    """Highest row where the person is solid, searched in a column band around the face."""
    h, w = alpha.shape
    if face:
        x0, x1 = int(max(0, face[0] - face[2])), int(min(w, face[0] + face[2]))
    else:
        x0, x1 = w // 4, 3 * w // 4
    rows = (alpha[:, x0:x1] > 0.5).sum(axis=1)
    hit = np.nonzero(rows > max(8, (x1 - x0) * 0.04))[0]
    return float(hit[0]) if len(hit) else float(h * 0.3)


def smooth(series, win=3, ema=0.5):
    arr = np.array(series, dtype=np.float64)
    if arr.ndim == 1:
        arr = arr[:, None]
    out = np.empty_like(arr)
    for i in range(len(arr)):
        out[i] = np.median(arr[max(0, i - win): i + win + 1], axis=0)
    for i in range(1, len(out)):
        out[i] = ema * out[i] + (1 - ema) * out[i - 1]
    return out.squeeze().tolist()


_worker = {}


def _init_worker(w, h, threads):
    _worker["matter"] = Matter(threads)
    _worker["finder"] = FaceFinder(w, h)


def _infer(path):
    bgr = cv2.imread(path)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    return _worker["matter"](rgb), _worker["finder"](bgr)


def _finish(args):
    """Full-resolution alpha, head top and the RGBA cut-out for one frame."""
    frame_path, out_path, low, face = args
    bgr = cv2.imread(frame_path)
    h, w = bgr.shape[:2]
    a = cv2.resize(low, (w, h), interpolation=cv2.INTER_LINEAR)
    a = np.clip(cv2.morphologyEx(a, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)), 0, 1)
    rgba = np.dstack([cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), (a * 255).astype(np.uint8)])
    Image.fromarray(rgba, "RGBA").save(out_path, compress_level=1)
    return head_top(a, face)


def prep(clip, start, dur, job, log=print):
    info = probe(clip)
    fps = info["fps"]
    n = max(1, int(round(dur * fps)))
    meta_path = os.path.join(job, "track.json")
    key = {"clip": os.path.abspath(clip), "mtime": os.path.getmtime(clip), "start": round(start, 3), "n": n}
    if os.path.isfile(meta_path):
        with open(meta_path, encoding="utf-8") as f:
            old = json.load(f)
        if old.get("key") == key:
            return old
    frames = os.path.join(job, "frames")
    person = os.path.join(job, "person")
    for d in (frames, person):
        os.makedirs(d, exist_ok=True)
        for name in os.listdir(d):
            os.remove(os.path.join(d, name))

    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.3f}", "-i", clip, "-frames:v", str(n),
                    "-q:v", "2", os.path.join(frames, "%05d.jpg")], check=True)
    names = sorted(os.listdir(frames))
    n = len(names)
    log(f"  prep {n} frames ({dur:.2f}s at {fps:g} fps): cut-out + face track")

    from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
    paths = [os.path.join(frames, name) for name in names]
    cpus = os.cpu_count() or 4
    procs = max(1, min(4, cpus // 4))
    with ProcessPoolExecutor(procs, initializer=_init_worker,
                             initargs=(info["w"], info["h"], max(1, cpus // procs))) as pool:
        results = list(pool.map(_infer, paths, chunksize=4))
    # temporal smoothing at model resolution keeps the edge from shimmering
    lows, prev = [], None
    for low, _ in results:
        if prev is not None:
            low = 0.6 * low + 0.4 * prev
        prev = low
        lows.append(low)
    faces, last = [], None
    for _, face in results:
        last = face or last
        faces.append(last)
    jobs = [(paths[i], os.path.join(person, f"{i + 1:05d}.png"), lows[i], faces[i]) for i in range(n)]
    with ThreadPoolExecutor(min(8, cpus)) as threads:
        tops = list(threads.map(_finish, jobs))

    fallback = next((f for f in faces if f), [info["w"] / 2, info["h"] * 0.3, info["w"] * 0.3, info["w"] * 0.36])
    faces = [f or fallback for f in faces]
    track = {"key": key, "w": info["w"], "h": info["h"], "fps": fps, "start": start, "n": n,
             "face": [[round(v, 1) for v in f] for f in (smooth(faces) if n > 1 else faces)],
             "top": [round(v, 1) for v in (smooth(tops) if n > 1 else tops)]}
    if n == 1:
        track["top"] = [track["top"]] if not isinstance(track["top"], list) else track["top"]
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(track, f)
    return track
