# Start the chatbot API server (http://127.0.0.1:8001). Ollama must be running.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$env:PYTHONIOENCODING = "utf-8"
& "$PSScriptRoot\.venv\Scripts\python.exe" server.py
