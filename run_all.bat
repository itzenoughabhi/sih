@echo off
echo =========================================================================
echo Launching BhuSync AI Multi-Source Geospatial Harmonization Platform
echo =========================================================================
start "BhuSync Backend (FastAPI)" cmd /c "run_backend.bat"
timeout /t 3 /nobreak >nul
start "BhuSync Frontend (Next.js)" cmd /c "run_frontend.bat"
echo.
echo Platform services launched!
echo Frontend: http://localhost:3000
echo Backend API Docs: http://localhost:8000/docs
echo.
