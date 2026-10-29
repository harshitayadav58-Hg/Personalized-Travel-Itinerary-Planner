import datetime

from sqlalchemy import JSON, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP
from sqlalchemy.orm import relationship

from .database import Base

# Match supabase/schema.sql on Postgres (jsonb / timestamptz) while keeping
# plain JSON / DateTime on SQLite for local development.
JSON_TYPE = JSON().with_variant(JSONB(), "postgresql")
TIMESTAMP_TYPE = DateTime().with_variant(TIMESTAMP(timezone=True), "postgresql")


def _utcnow() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=_utcnow)

    trips = relationship("Trip", back_populates="owner", cascade="all, delete-orphan")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    title = Column(String(200), nullable=False)
    destination = Column(String(120), index=True, nullable=False)
    start_date = Column(Date, nullable=False)
    days = Column(Integer, nullable=False)
    budget_level = Column(String(20), nullable=False, default="moderate")
    budget_amount = Column(Float, nullable=True)
    travel_style = Column(String(30), nullable=False, default="solo")
    pace = Column(String(20), nullable=False, default="balanced")
    group_size = Column(Integer, nullable=False, default=1)
    interests = Column(JSON_TYPE, default=list)
    notes = Column(Text, nullable=True)

    image_url = Column(String(600), nullable=True)
    itinerary = Column(JSON_TYPE, nullable=False)
    generated_by = Column(String(20), nullable=False, default="demo")

    created_at = Column(TIMESTAMP_TYPE, default=_utcnow)
    updated_at = Column(TIMESTAMP_TYPE, default=_utcnow, onupdate=_utcnow)

    owner = relationship("User", back_populates="trips")
