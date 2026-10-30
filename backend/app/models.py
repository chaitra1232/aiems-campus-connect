from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base


def now():
    """Current UTC time as a naive datetime (all times in the DB are UTC)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Society(Base):
    __tablename__ = "societies"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), unique=True, nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text, default="")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    role = Column(String(20), nullable=False, default="student")  # student / organizer / admin
    department = Column(String(100), default="")
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now)


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    category = Column(String(50), nullable=False)
    venue = Column(String(200), nullable=False)
    start_time = Column(DateTime, nullable=False, index=True)
    registration_deadline = Column(DateTime, nullable=False)
    capacity = Column(Integer, nullable=False)
    status = Column(String(20), default="pending", index=True)  # pending / approved / rejected
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now)
    society = relationship("Society")


class Registration(Base):
    __tablename__ = "registrations"
    __table_args__ = (UniqueConstraint("event_id", "user_id", name="one_registration_per_student"),)
    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    ticket_code = Column(String(20), unique=True, nullable=False)
    checked_in_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now)
    event = relationship("Event")
    user = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    body = Column(Text, default="")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now)
