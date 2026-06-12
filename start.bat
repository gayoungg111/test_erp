@echo off
echo ERP 분석 서비스 시작...

start "ERP Backend" cmd /k "cd /d %~dp0backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000"
timeout /t 3 /nobreak > nul
start "ERP Frontend" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

echo.
echo 백엔드: http://localhost:8000
echo 프론트엔드: http://localhost:5173
echo.
pause
