@echo off
echo ===================================================
echo Starting BhuSync AI Backend (FastAPI + GIS Engine)
echo ===================================================
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause
