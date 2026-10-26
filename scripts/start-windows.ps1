# NetSentinel AI - PowerShell Startup Script
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "          NetSentinel AI - Cybersecurity Platform Launcher           " -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$WorkspaceRoot = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path "$WorkspaceRoot\.venv\Scripts\python.exe")) {
    Write-Host "[ERROR] Virtual environment not found at .venv\" -ForegroundColor Red
    Write-Host "Please create and install dependencies:"
    Write-Host "  python -m venv .venv"
    Write-Host "  .\.venv\Scripts\python -m pip install -r backend\requirements.txt"
    exit 1
}

Write-Host "[1/2] Starting Backend Server (FastAPI on http://127.0.0.1:8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$WorkspaceRoot'; .\.venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "[2/2] Starting Frontend Server (Vite on http://localhost:5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$WorkspaceRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " Both servers launched in separate PowerShell windows!" -ForegroundColor Green
Write-Host " - Frontend Dashboard: http://localhost:5173" -ForegroundColor Yellow
Write-Host " - Backend API Docs:   http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan
