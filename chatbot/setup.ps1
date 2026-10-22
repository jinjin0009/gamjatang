# One-time setup on a new PC: Python 3.12.10 (pyenv-win) -> .venv -> packages.
# Run: powershell -ExecutionPolicy Bypass -File setup.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$ver = (Get-Content .python-version).Trim()
$py = Join-Path $env:USERPROFILE ".pyenv\pyenv-win\versions\$ver\python.exe"
if (-not (Test-Path $py)) {
    if (Get-Command pyenv -ErrorAction SilentlyContinue) {
        pyenv install $ver
    } else {
        Write-Host "pyenv-win not found. Install it first: https://github.com/pyenv-win/pyenv-win"
        exit 1
    }
}
if (-not (Test-Path ".venv\Scripts\python.exe")) { & $py -m venv .venv }
& ".venv\Scripts\python.exe" -m pip install --disable-pip-version-check -r requirements.txt

if (-not (Test-Path "..\.env")) {
    Copy-Item "..\.env.example" "..\.env"
    Write-Host "Created gamjatang\.env from .env.example - put your API keys in it."
}
Write-Host "Done. Start the server with: powershell -ExecutionPolicy Bypass -File run.ps1"
