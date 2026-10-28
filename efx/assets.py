"""Third-party assets the pack downloads on `efx setup` instead of shipping them in the repo.

Every file is pinned by URL and SHA-256, so a clean clone always renders the same pixels.
"""
import hashlib
import os
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(ROOT, "models")
VENDOR = os.path.join(ROOT, "vendor")
FONTS = os.path.join(VENDOR, "fonts")

ASSETS = [
    # Portrait matting. MODNet (ZHKKKe/MODNet) ONNX export by Xenova, Apache-2.0.
    {"path": os.path.join(MODELS, "modnet.onnx"),
     "url": "https://huggingface.co/Xenova/modnet/resolve/main/onnx/model.onnx",
     "sha256": "07c308cf0fc7e6e8b2065a12ed7fc07e1de8febb7dc7839d7b7f15dd66584df9"},
    # Face detection. YuNet from opencv_zoo, Apache-2.0.
    {"path": os.path.join(MODELS, "yunet.onnx"),
     "url": "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
     "sha256": "8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4"},
    # Animation engine. GSAP, standard "no charge" license (gsap.com/standard-license).
    {"path": os.path.join(VENDOR, "gsap.min.js"),
     "url": "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js",
     "sha256": "28033e449a31ebcc396e5be8b13b63152bf03094288fb5867034321927bce087"},
    # Default fonts, SIL Open Font License (google/fonts).
    {"path": os.path.join(FONTS, "Anton-Regular.ttf"),
     "url": "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf"},
    {"path": os.path.join(FONTS, "Inter.ttf"),
     "url": "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf"},
    {"path": os.path.join(FONTS, "JetBrainsMono.ttf"),
     "url": "https://github.com/google/fonts/raw/main/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf"},
]


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def ensure(asset, log=print):
    path = asset["path"]
    want = asset.get("sha256")
    if os.path.isfile(path) and (not want or sha256(path) == want):
        return path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    log(f"  downloading {os.path.basename(path)}")
    tmp = path + ".part"
    req = urllib.request.Request(asset["url"], headers={"User-Agent": "effectswithclaude"})
    with urllib.request.urlopen(req, timeout=120) as r, open(tmp, "wb") as f:
        while True:
            block = r.read(1 << 20)
            if not block:
                break
            f.write(block)
    if want and sha256(tmp) != want:
        os.remove(tmp)
        raise SystemExit(f"checksum mismatch for {os.path.basename(path)}; refusing to use it")
    os.replace(tmp, path)
    return path


def ensure_all(log=print):
    for a in ASSETS:
        ensure(a, log)


def model(name):
    path = os.path.join(MODELS, name)
    if not os.path.isfile(path):
        raise SystemExit(f"missing models/{name}: run `efx setup` first")
    return path
