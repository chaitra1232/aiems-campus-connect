@echo off
cd /d "%~dp0backend"
if not exist venv (
  echo Creating Python environment...
  python -m venv venv
)
call venv\Scripts\activate.bat
python -m pip install -r requirements.txt
python seed.py
echo.
echo Backend running at http://localhost:8000/docs  (press Ctrl+C to stop)
python -m uvicorn app.main:app --reload
pause
