import csv
import io
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from . import models
from .models import now
from .security import hash_password, verify_password, create_token, get_current_user, require_roles

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AIEMS Campus Connect API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Schemas ----------
class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=8, max_length=72)
    department: str = ""


class EventIn(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = ""
    category: str = Field(min_length=2, max_length=50)
    venue: str = Field(min_length=2, max_length=200)
    start_time: datetime
    registration_deadline: datetime
    capacity: int = Field(gt=0, le=100000)


class CheckinIn(BaseModel):
    event_id: int
    ticket_code: str


# ---------- Helpers ----------
def naive_utc(dt: datetime) -> datetime:
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def notify(db: Session, user_id: int, title: str, body: str = ""):
    db.add(models.Notification(user_id=user_id, title=title, body=body))


def user_dict(u):
    return {"id": u.id, "name": u.name, "email": u.email, "role": u.role,
            "department": u.department, "society_id": u.society_id}


def event_dict(e, db):
    taken = db.query(func.count(models.Registration.id)).filter_by(event_id=e.id).scalar()
    return {"id": e.id, "title": e.title, "description": e.description, "category": e.category,
            "venue": e.venue, "start_time": e.start_time, "registration_deadline": e.registration_deadline,
            "capacity": e.capacity, "registered": taken, "seats_left": max(e.capacity - taken, 0),
            "status": e.status, "society": e.society.name, "society_id": e.society_id, "is_demo": e.is_demo}


def owned_event(db, user, event_id):
    e = db.get(models.Event, event_id)
    if not e:
        raise HTTPException(404, "Event not found")
    if user.role == "organizer" and e.society_id != user.society_id:
        raise HTTPException(403, "This is not your society's event")
    return e


# ---------- Public ----------
@app.get("/stats/public", tags=["Public"])
def public_stats(db: Session = Depends(get_db)):
    return {
        "approved_events": db.query(models.Event).filter_by(status="approved").count(),
        "societies": db.query(models.Society).count(),
        "students": db.query(models.User).filter_by(role="student").count(),
        "registrations": db.query(models.Registration).count(),
        "demo_events": db.query(models.Event).filter_by(is_demo=True).count(),
    }


# ---------- Auth ----------
@app.post("/auth/register", tags=["Auth"])
def register(body: RegisterIn, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.query(models.User).filter_by(email=email).first():
        raise HTTPException(400, "Email already registered")
    user = models.User(name=body.name, email=email, password_hash=hash_password(body.password),
                       role="student", department=body.department)  # role is always student here
    db.add(user)
    db.commit()
    return user_dict(user)


@app.post("/auth/login", tags=["Auth"])
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=form.username.lower()).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return {"access_token": create_token(user.id), "token_type": "bearer", "user": user_dict(user)}


@app.get("/auth/me", tags=["Auth"])
def me(user=Depends(get_current_user)):
    return user_dict(user)


# ---------- Societies ----------
@app.get("/societies", tags=["Societies"])
def societies(db: Session = Depends(get_db)):
    return [{"id": s.id, "name": s.name, "category": s.category, "description": s.description}
            for s in db.query(models.Society).order_by(models.Society.name)]


# ---------- Events ----------
@app.get("/events", tags=["Events"])
def list_events(q: str = "", category: str = "", db: Session = Depends(get_db)):
    query = db.query(models.Event).filter_by(status="approved")
    if q:
        query = query.filter(models.Event.title.ilike(f"%{q}%"))
    if category:
        query = query.filter_by(category=category)
    return [event_dict(e, db) for e in query.order_by(models.Event.start_time)]


@app.get("/events/{event_id}", tags=["Events"])
def get_event(event_id: int, db: Session = Depends(get_db)):
    e = db.get(models.Event, event_id)
    if not e or e.status != "approved":
        raise HTTPException(404, "Event not found")
    return event_dict(e, db)


@app.post("/events", tags=["Events"])
def create_event(body: EventIn, user=Depends(require_roles("organizer")), db: Session = Depends(get_db)):
    if not user.society_id:
        raise HTTPException(400, "Your account is not linked to a society")
    start = naive_utc(body.start_time)
    deadline = naive_utc(body.registration_deadline)
    if deadline > start:
        raise HTTPException(400, "Registration deadline must be before the event start")
    e = models.Event(title=body.title, description=body.description, category=body.category,
                     venue=body.venue, start_time=start, registration_deadline=deadline,
                     capacity=body.capacity, society_id=user.society_id, status="pending")
    db.add(e)
    for admin in db.query(models.User).filter_by(role="admin"):
        notify(db, admin.id, "New event awaiting approval", e.title)
    db.commit()
    return event_dict(e, db)


# ---------- Organizer ----------
@app.get("/organizer/events", tags=["Organizer"])
def my_society_events(user=Depends(require_roles("organizer")), db: Session = Depends(get_db)):
    events = db.query(models.Event).filter_by(society_id=user.society_id).order_by(models.Event.start_time)
    out = []
    for e in events:
        d = event_dict(e, db)
        d["checked_in"] = db.query(models.Registration).filter(
            models.Registration.event_id == e.id, models.Registration.checked_in_at.isnot(None)).count()
        out.append(d)
    return out


@app.get("/organizer/events/{event_id}/registrations", tags=["Organizer"])
def event_registrations(event_id: int, user=Depends(require_roles("organizer", "admin")), db: Session = Depends(get_db)):
    e = owned_event(db, user, event_id)
    regs = db.query(models.Registration).filter_by(event_id=e.id).all()
    return [{"name": r.user.name, "email": r.user.email, "department": r.user.department,
             "ticket_code": r.ticket_code, "checked_in_at": r.checked_in_at} for r in regs]


@app.get("/organizer/events/{event_id}/registrations.csv", tags=["Organizer"])
def event_registrations_csv(event_id: int, user=Depends(require_roles("organizer", "admin")), db: Session = Depends(get_db)):
    e = owned_event(db, user, event_id)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Name", "Email", "Department", "Ticket code", "Checked in at (UTC)"])
    for r in db.query(models.Registration).filter_by(event_id=e.id):
        w.writerow([r.user.name, r.user.email, r.user.department, r.ticket_code, r.checked_in_at or ""])
    return Response(buf.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": f'attachment; filename="event-{e.id}-participants.csv"'})


# ---------- Admin ----------
@app.get("/admin/events/pending", tags=["Admin"])
def pending(user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    return [event_dict(e, db) for e in db.query(models.Event).filter_by(status="pending")]


@app.get("/admin/stats", tags=["Admin"])
def admin_stats(user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    out = public_stats(db)
    out["pending_events"] = db.query(models.Event).filter_by(status="pending").count()
    out["checked_in"] = db.query(models.Registration).filter(models.Registration.checked_in_at.isnot(None)).count()
    return out


@app.post("/admin/events/{event_id}/{decision}", tags=["Admin"])
def decide(event_id: int, decision: str, user=Depends(require_roles("admin")), db: Session = Depends(get_db)):
    if decision not in ("approve", "reject"):
        raise HTTPException(400, "Decision must be approve or reject")
    e = db.get(models.Event, event_id)
    if not e:
        raise HTTPException(404, "Event not found")
    e.status = "approved" if decision == "approve" else "rejected"
    for org in db.query(models.User).filter_by(role="organizer", society_id=e.society_id):
        notify(db, org.id, f"Event {e.status}", e.title)
    db.commit()
    return event_dict(e, db)


# ---------- Registration ----------
@app.post("/events/{event_id}/register", tags=["Registrations"])
def register_event(event_id: int, user=Depends(require_roles("student")), db: Session = Depends(get_db)):
    e = db.get(models.Event, event_id)
    if not e or e.status != "approved":
        raise HTTPException(404, "Event not found")
    if now() > e.registration_deadline:
        raise HTTPException(400, "Registration is closed")
    if db.query(models.Registration).filter_by(event_id=e.id, user_id=user.id).first():
        raise HTTPException(400, "You are already registered")
    taken = db.query(func.count(models.Registration.id)).filter_by(event_id=e.id).scalar()
    if taken >= e.capacity:
        raise HTTPException(400, "Event is full")
    reg = models.Registration(event_id=e.id, user_id=user.id, ticket_code=uuid.uuid4().hex[:12].upper())
    db.add(reg)
    notify(db, user.id, "Registration confirmed", f"You're registered for {e.title}. Your ticket is ready.")
    db.commit()
    return {"message": "Registered", "ticket_code": reg.ticket_code}


@app.delete("/events/{event_id}/register", tags=["Registrations"])
def cancel_registration(event_id: int, user=Depends(require_roles("student")), db: Session = Depends(get_db)):
    reg = db.query(models.Registration).filter_by(event_id=event_id, user_id=user.id).first()
    if not reg:
        raise HTTPException(404, "You are not registered")
    if reg.checked_in_at:
        raise HTTPException(400, "Cannot cancel after check-in")
    title = reg.event.title
    db.delete(reg)
    notify(db, user.id, "Registration cancelled", f"Your registration for {title} was cancelled.")
    db.commit()
    return {"message": "Registration cancelled"}


@app.get("/my/registrations", tags=["Registrations"])
def my_registrations(user=Depends(require_roles("student")), db: Session = Depends(get_db)):
    regs = db.query(models.Registration).filter_by(user_id=user.id).all()
    return [{"ticket_code": r.ticket_code, "checked_in_at": r.checked_in_at, "event": event_dict(r.event, db)}
            for r in regs]


# ---------- Recommendations (rule-based, not machine learning) ----------
@app.get("/recommendations", tags=["Recommendations"])
def recommendations(user=Depends(require_roles("student")), db: Session = Depends(get_db)):
    regs = db.query(models.Registration).filter_by(user_id=user.id).all()
    registered_ids = {r.event_id for r in regs}
    liked = {r.event.category for r in regs}
    out = []
    events = db.query(models.Event).filter_by(status="approved").order_by(models.Event.start_time)
    for e in events:
        d = event_dict(e, db)
        if e.id in registered_ids or e.start_time < now() or now() > e.registration_deadline or d["seats_left"] == 0:
            continue
        if e.category in liked:
            d["reason"] = f"Because you registered for another {e.category} event"
        else:
            d["reason"] = "Upcoming and open for registration"
        d["_score"] = 1 if e.category in liked else 0
        out.append(d)
    out.sort(key=lambda d: -d["_score"])
    for d in out:
        d.pop("_score")
    return out[:4]


# ---------- Notifications ----------
@app.get("/notifications", tags=["Notifications"])
def notifications(user=Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(models.Notification).filter_by(user_id=user.id).order_by(models.Notification.id.desc()).limit(50).all()
    return [{"id": n.id, "title": n.title, "body": n.body, "is_read": n.is_read, "created_at": n.created_at} for n in items]


@app.post("/notifications/read-all", tags=["Notifications"])
def read_all(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.Notification).filter_by(user_id=user.id, is_read=False).update({"is_read": True})
    db.commit()
    return {"message": "ok"}


# ---------- QR check-in ----------
@app.post("/checkin", tags=["Attendance"])
def checkin(body: CheckinIn, user=Depends(require_roles("organizer", "admin")), db: Session = Depends(get_db)):
    event = owned_event(db, user, body.event_id)
    reg = db.query(models.Registration).filter_by(ticket_code=body.ticket_code.strip().upper()).first()
    if not reg:
        raise HTTPException(404, "Invalid ticket")
    if reg.event_id != event.id:
        raise HTTPException(400, "This ticket is for a different event")
    if reg.checked_in_at:
        raise HTTPException(409, "Already checked in")
    reg.checked_in_at = now()
    db.commit()
    return {"message": "Check-in successful", "ticket_code": reg.ticket_code, "student": reg.user.name}
