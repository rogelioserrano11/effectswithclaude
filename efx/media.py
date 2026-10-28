"""Small ffmpeg/ffprobe helpers."""
import json
import shutil
import subprocess


def need(tool):
    if not shutil.which(tool):
        raise SystemExit(f"{tool} not found on PATH (install ffmpeg: https://ffmpeg.org/download.html)")


def probe(path):
    need("ffprobe")
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "stream=codec_type,width,height,r_frame_rate:format=duration", "-of", "json", path],
                       capture_output=True, text=True, check=True)
    d = json.loads(r.stdout)
    v = next(s for s in d["streams"] if s["codec_type"] == "video")
    num, den = v["r_frame_rate"].split("/")
    return {"w": int(v["width"]), "h": int(v["height"]), "fps": float(num) / float(den),
            "dur": float(d["format"]["duration"]),
            "audio": any(s["codec_type"] == "audio" for s in d["streams"])}
