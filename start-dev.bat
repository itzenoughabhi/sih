@echo off
title Naksha.ai Launcher
echo ===================================================
echo        Starting Naksha.ai (Backend + Frontend)
echo ===================================================
echo.
echo [1/2] Launching Backend on http://localhost:8000 ...
start "Naksha.ai - Backend (Port 8000)" cmd /k "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Launching Frontend on http://localhost:3000 ...
start "Naksha.ai - Frontend (Port 3000)" cmd /k "npm --prefix frontend run dev"

echo.
echo ===================================================
echo   Both services are starting!
echo   - Frontend: http://localhost:3000
echo   - Backend:  http://localhost:8000
echo   - Docs:     http://localhost:8000/docs
echo ===================================================
timeout /t 5 >nul
