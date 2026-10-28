#!/usr/bin/env bash
# effects with claude — install: venv, dependencies, models, Chromium, Claude Code skill link.
set -euo pipefail
cd "$(dirname "$0")"
PY=${PYTHON:-python3}
command -v "$PY" >/dev/null || PY=python
command -v ffmpeg >/dev/null || { echo "ffmpeg not found: install it first (brew install ffmpeg / apt install ffmpeg)"; exit 1; }
[ -d .venv ] || "$PY" -m venv .venv
.venv/bin/python -m pip install -q --upgrade pip
.venv/bin/python -m pip install -q -r requirements.txt
.venv/bin/python -m efx setup
mkdir -p "$HOME/.claude/skills"
ln -sfn "$(pwd)" "$HOME/.claude/skills/effectswithclaude"
echo "Claude Code skill linked: ~/.claude/skills/effectswithclaude"
