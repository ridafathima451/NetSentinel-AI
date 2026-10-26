@echo off
TITLE NetSentinel AI Launcher
echo =====================================================================
echo           NetSentinel AI - Cybersecurity Platform Launcher
echo =====================================================================
echo.

REM Check if Python virtual environment exists
if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found at .venv\
    echo Please create it first:
    echo   python -m venv .venv
    echo   .\.venv\Scripts\python -m pip install -r backend\requirements.txt
    pause
    exit /b 1
)

echo [1/2] Starting NetSentinel Backend (FastAPI on http://127.0.0.1:8000)...
start "NetSentinel Backend" .\.venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

echo [2/2] Starting NetSentinel Frontend (Vite on http://localhost:5173)...
start "NetSentinel Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo =====================================================================
echo  Both services launched in separate windows!
echo  - Frontend Dashboard: http://localhost:5173
echo  - Backend API Docs:   http://127.0.0.1:8000/docs
echo =====================================================================
echo.
pause
