# AIEMS Campus Connect — Never Miss a Campus Moment

College event platform for AIEMS: students discover and register for club events, organizers publish events and check people in, admins approve events.

## Run it on Windows (2 windows, double-click)

Install first (one time): **Python 3.11+** (tick "Add python.exe to PATH") and **Node.js LTS**. Restart the PC.

1. Double-click `start-backend.bat` — leave it open. Check http://localhost:8000/docs
2. Double-click `start-frontend.bat` — leave it open. Open http://localhost:5173

If a window closes instantly, open the folder in VS Code and run the same commands in the terminal:

    cd backend
    python -m venv venv
    venv\Scripts\activate
    python -m pip install -r requirements.txt
    python seed.py
    python -m uvicorn app.main:app --reload

    (second terminal)
    cd frontend
    npm install
    npm run dev

## Demo accounts (all use password `Demo@1234`) — DEMO DATA ONLY
| Role | Email |
|---|---|
| Student | student@aiems.demo |
| Organizer (Coding Club) | organizer.coding@aiems.demo |
| Organizer (Robotics Club) | organizer.robotics@aiems.demo |
| Admin | admin@aiems.demo |

Re-running `python seed.py` is safe; it never creates duplicates.

## Try the full flow (good for your review demo)
1. Log in as **organizer.coding** → create an event → it shows as *pending*.
2. Log in as **admin** → approve it.
3. Log in as **student** → Explore → register → see the QR ticket under My Registrations.
4. Log in as **organizer.coding** → Check-in → choose the event → type the ticket code → success. Try again to see "Already checked in".
5. As organizer, press **People** or **CSV** on the event to see/download participants.

## Add your campus photo
Save a photo as `frontend/public/campus.jpg`. It becomes the background automatically.

## What works now
- Login/register (students only self-register), JWT, bcrypt, roles enforced **on the backend**
- Events, search/filter, registration with duplicate / deadline / capacity checks
- Organizer: create events (ownership enforced), approval workflow, participants list, CSV
- Admin: approve/reject, platform counts
- QR ticket (QR contains only the random ticket code) + backend check-in; repeats are rejected
- In-app notifications, month calendar, rule-based recommendations (NOT machine learning)
- Public counts on the login page come from the database

## Not built yet (honest list)
Society directory/follow, interests onboarding, poster upload, email/SMTP, camera QR scanning,
Recharts analytics, profile/password change, audit log, rate limiting, Framer Motion
(animations are CSS), automated tests, PostgreSQL setup. The code is a starting point for these.

## Troubleshooting
- **python not recognized** → reinstall Python with "Add to PATH", restart PC.
- **Cannot reach the server** → backend window not running.
- **Port in use** → close old windows, or run uvicorn with `--port 8001` and set `VITE_API_URL` in `frontend/.env`.
- **Reset the database** → stop the backend, delete `backend/campus.db`, run `python seed.py`.
- **PowerShell blocks activate** → `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.
