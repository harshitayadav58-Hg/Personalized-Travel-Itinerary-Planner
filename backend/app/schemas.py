import datetime
from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field

BudgetLevel = Literal["budget", "moderate", "luxury"]
TravelStyle = Literal["solo", "couple", "family", "friends"]
Pace = Literal["relaxed", "balanced", "packed"]


# ---------- Auth ----------

class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class UserOut(BaseModel):
    id: int
    name: str
    email: str

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Trip preferences ----------

class TripPreferences(BaseModel):
    destination: str = Field(min_length=2, max_length=80)
    start_date: date
    days: int = Field(ge=1, le=14)
    budget_level: BudgetLevel = "moderate"
    budget_amount: Optional[float] = Field(default=None, ge=0)
    travel_style: TravelStyle = "solo"
    pace: Pace = "balanced"
    group_size: int = Field(default=1, ge=1, le=20)
    interests: list[str] = Field(default_factory=list)
    notes: Optional[str] = Field(default=None, max_length=1000)


# ---------- Itinerary plan (shared contract between AI, demo engine and UI) ----------

class Activity(BaseModel):
    time: str = ""
    title: str
    description: str = ""
    category: str = "attraction"
    location: str = ""
    duration: str = ""
    cost: float = 0
    tip: str = ""

    model_config = {"extra": "ignore"}


class Accommodation(BaseModel):
    name: str = ""
    note: str = ""
    price_per_night: float = 0

    model_config = {"extra": "ignore"}


class DayPlan(BaseModel):
    day: int
    title: str
    estimated_cost: float = 0
    accommodation: Optional[Accommodation] = None
    activities: list[Activity] = Field(default_factory=list)
    meals: dict[str, str] = Field(default_factory=dict)
    transport: list[str] = Field(default_factory=list)
    tips: list[str] = Field(default_factory=list)

    model_config = {"extra": "ignore"}


class ItineraryPlan(BaseModel):
    destination: str
    summary: str = ""
    currency: str = "INR"
    total_estimated_cost: float = 0
    days: list[DayPlan] = Field(default_factory=list)

    model_config = {"extra": "ignore"}


# ---------- Trips API ----------

class TripOut(BaseModel):
    id: int
    title: str
    destination: str
    start_date: Optional[date] = None
    days: int
    budget_level: str
    budget_amount: Optional[float] = None
    travel_style: str
    pace: str
    group_size: int
    interests: list = Field(default_factory=list)
    notes: Optional[str] = None
    image_url: Optional[str] = None
    itinerary: dict
    generated_by: str
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


class TripPatch(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=1000)


class DayRegenerateIn(BaseModel):
    notes: Optional[str] = Field(default=None, max_length=500)
