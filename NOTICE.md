# Third-party components

None of these are stored in this repository. `efx setup` downloads them from their official sources and checks the
SHA-256 of the models and GSAP before use (`efx/assets.py`).

| Component | Used for | Source | License |
|---|---|---|---|
| MODNet (ONNX export by Xenova) | portrait cut-out | huggingface.co/Xenova/modnet · github.com/ZHKKKe/MODNet | Apache-2.0 |
| YuNet face detector | face tracking | github.com/opencv/opencv_zoo | Apache-2.0 |
| GSAP 3.12.5 | animation timeline | gsap.com | GreenSock Standard "no charge" license |
| Anton, Inter, JetBrains Mono | default fonts | github.com/google/fonts | SIL Open Font License 1.1 |
| Playwright + Chromium | frame rendering | playwright.dev | Apache-2.0 / BSD |
| OpenCV, ONNX Runtime, NumPy, Pillow | image processing | PyPI | Apache-2.0 / MIT / BSD / HPND |

The demo clips in `demo/` show the author's own AI avatar and are provided only to illustrate the effects.
