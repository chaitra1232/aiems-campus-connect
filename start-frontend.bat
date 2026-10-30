@echo off
cd /d "%~dp0frontend"
if not exist node_modules (
  echo Installing website packages - first time only, takes a few minutes...
  call npm install
)
echo.
echo Website will open at http://localhost:5173  (press Ctrl+C to stop)
call npm run dev
pause
