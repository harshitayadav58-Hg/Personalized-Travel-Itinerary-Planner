from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..services.generator import generate_full_plan, regenerate_day
from ..services.travel_images import fetch_destination_image

router = APIRouter(prefix="/api", tags=["trips"])


def _owned_trip(trip_id: int, user: models.User, db: Session) -> models.Trip:
    trip = db.get(models.Trip, trip_id)
    if trip is None or trip.user_id != user.id:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def _prefs_from_trip(trip: models.Trip) -> schemas.TripPreferences:
    return schemas.TripPreferences(
        destination=trip.destination,
        start_date=trip.start_date,
        days=trip.days,
        budget_level=trip.budget_level,  # type: ignore[arg-type]
        budget_amount=trip.budget_amount,
        travel_style=trip.travel_style,  # type: ignore[arg-type]
        pace=trip.pace,  # type: ignore[arg-type]
        group_size=trip.group_size,
        interests=trip.interests or [],
        notes=trip.notes,
    )


@router.post("/trips/generate", response_model=schemas.TripOut, status_code=status.HTTP_201_CREATED)
def generate_trip(
    prefs: schemas.TripPreferences,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate an itinerary with AI and save it as a new trip in one step."""
    plan, engine = generate_full_plan(prefs)
    trip = models.Trip(
        user_id=user.id,
        title=f"{prefs.destination} · {prefs.days}-day trip",
        destination=prefs.destination,
        start_date=prefs.start_date,
        days=prefs.days,
        budget_level=prefs.budget_level,
        budget_amount=prefs.budget_amount,
        travel_style=prefs.travel_style,
        pace=prefs.pace,
        group_size=prefs.group_size,
        interests=prefs.interests,
        notes=prefs.notes,
        image_url=fetch_destination_image(prefs.destination),
        itinerary=plan.model_dump(),
        generated_by=engine,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.get("/trips", response_model=list[schemas.TripOut])
def list_trips(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Trip)
        .filter(models.Trip.user_id == user.id)
        .order_by(models.Trip.created_at.desc())
        .all()
    )


@router.get("/trips/{trip_id}", response_model=schemas.TripOut)
def get_trip(
    trip_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _owned_trip(trip_id, user, db)


@router.patch("/trips/{trip_id}", response_model=schemas.TripOut)
def update_trip(
    trip_id: int,
    body: schemas.TripPatch,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = _owned_trip(trip_id, user, db)
    if body.title is not None:
        trip.title = body.title
    if body.notes is not None:
        trip.notes = body.notes
    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/trips/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = _owned_trip(trip_id, user, db)
    db.delete(trip)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/trips/{trip_id}/regenerate", response_model=schemas.TripOut)
def regenerate_trip(
    trip_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Regenerate the whole itinerary for the same preferences."""
    trip = _owned_trip(trip_id, user, db)
    plan, engine = generate_full_plan(_prefs_from_trip(trip))
    trip.itinerary = plan.model_dump()
    trip.generated_by = engine
    db.commit()
    db.refresh(trip)
    return trip


@router.post("/trips/{trip_id}/days/{day_number}/regenerate", response_model=schemas.TripOut)
def regenerate_single_day(
    trip_id: int,
    day_number: int,
    body: schemas.DayRegenerateIn,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Regenerate one specific day, optionally steered with free-text notes."""
    trip = _owned_trip(trip_id, user, db)
    if not 1 <= day_number <= trip.days:
        raise HTTPException(status_code=400, detail=f"day must be between 1 and {trip.days}")

    itinerary = dict(trip.itinerary)
    days = list(itinerary.get("days", []))
    previous = next((d for d in days if d.get("day") == day_number), None)
    if previous is None:
        raise HTTPException(status_code=404, detail="Day not found in itinerary")

    day, engine = regenerate_day(
        _prefs_from_trip(trip), day_number, body.notes, previous.get("title")
    )
    old_cost = float(previous.get("estimated_cost") or 0)
    new_cost = day.estimated_cost
    itinerary["days"] = [day.model_dump() if d.get("day") == day_number else d for d in days]
    total = float(itinerary.get("total_estimated_cost") or 0)
    itinerary["total_estimated_cost"] = round(total - old_cost + new_cost, 0)

    trip.itinerary = itinerary
    trip.generated_by = engine
    db.commit()
    db.refresh(trip)
    return trip
