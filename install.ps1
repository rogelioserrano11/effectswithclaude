# effects with claude — install on Windows: venv, dependencies, models, Chromium, Claude Code skill link.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { throw "ffmpeg not found: winget install Gyan.FFmpeg" }
$py = if (Get-Command py -ErrorAction SilentlyContinue) { "py" } else { "python" }
if (-not (Test-Path .venv)) { & $py -m venv .venv }
& .venv\Scripts\python -m pip install -q --upgrade pip
& .venv\Scripts\python -m pip install -q -r requirements.txt
& .venv\Scripts\python -m efx setup
$skills = Join-Path $HOME ".claude\skills"
New-Item -ItemType Directory -Force -Path $skills | Out-Null
$link = Join-Path $skills "effectswithclaude"
if (Test-Path $link) { (Get-Item $link).Delete() }
New-Item -ItemType Junction -Path $link -Target $PSScriptRoot | Out-Null
Write-Host "Claude Code skill linked: $link"
