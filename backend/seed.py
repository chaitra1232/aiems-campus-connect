"""Adds clearly-labelled DEMO data. Safe to run many times (no duplicates)."""
from datetime import timedelta
from app.database import Base, engine, SessionLocal
from app import models
from app.models import now
from app.security import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

SOCIETIES = [
    ("AIEMS Coding Club", "Technical", "Programming contests and hackathons."),
    ("AIEMS Dance Club", "Cultural", "Dance performances and battles."),
    ("AIEMS Cultural Society", "Cultural", "Festivals and cultural events."),
    ("AIEMS Robotics Club", "Technical", "Robotics workshops and builds."),
    ("AIEMS Music Club", "Cultural", "Concerts and jam sessions."),
    ("AIEMS Sports Club", "Sports", "Tournaments and fitness events."),
]
soc = {}
for name, cat, desc in SOCIETIES:
    s = db.query(models.Society).filter_by(name=name).first()
    if not s:
        s = models.Society(name=name, category=cat, description=desc)
        db.add(s)
        db.flush()
    soc[name] = s

PASSWORD = "Demo@1234"  # DEMO ONLY - never use this outside local testing
USERS = [
    ("Demo Admin", "admin@aiems.demo", "admin", None),
    ("Demo Student", "student@aiems.demo", "student", None),
    ("Demo Coding Organizer", "organizer.coding@aiems.demo", "organizer", "AIEMS Coding Club"),
    ("Demo Robotics Organizer", "organizer.robotics@aiems.demo", "organizer", "AIEMS Robotics Club"),
]
for name, email, role, society in USERS:
    if not db.query(models.User).filter_by(email=email).first():
        db.add(models.User(name=name, email=email, password_hash=hash_password(PASSWORD), role=role,
                           society_id=soc[society].id if society else None, is_demo=True))

# (title, society, category, days from today, venue, capacity, status)
EVENTS = [
    ("AIEMS Hackathon", "AIEMS Coding Club", "Technical", 14, "Main Auditorium", 120, "approved"),
    ("CodeSprint Programming Contest", "AIEMS Coding Club", "Technical", 7, "Computer Lab 2", 60, "approved"),
    ("Cultural Fest", "AIEMS Cultural Society", "Cultural", 30, "College Ground", 500, "approved"),
    ("Dance Battle", "AIEMS Dance Club", "Cultural", 21, "Open Air Theatre", 150, "approved"),
    ("Robotics Workshop", "AIEMS Robotics Club", "Technical", 10, "Robotics Lab", 40, "approved"),
    ("Sports Tournament", "AIEMS Sports Club", "Sports", 25, "Sports Ground", 200, "approved"),
    ("Photography Competition", "AIEMS Cultural Society", "Cultural", 18, "Campus Lawn", 80, "approved"),
    ("Technical Project Exhibition", "AIEMS Robotics Club", "Technical", 35, "Seminar Hall", 100, "pending"),
]
for title, society, cat, days, venue, cap, status in EVENTS:
    if not db.query(models.Event).filter_by(title=title).first():
        start = (now() + timedelta(days=days)).replace(hour=10, minute=0, second=0, microsecond=0)
        db.add(models.Event(title=title, description="[DEMO EVENT] Sample data for testing the platform.",
                            category=cat, venue=venue, start_time=start,
                            registration_deadline=start - timedelta(days=1), capacity=cap,
                            status=status, society_id=soc[society].id, is_demo=True))

db.commit()
db.close()
print("Seed complete. Demo password for all demo users: Demo@1234")
