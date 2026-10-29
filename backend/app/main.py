from contextlib import asynccontextmanager
from datetime import date

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .config import get_settings
from .database import Base, SessionLocal, engine
from .routers import auth, images, trips
from .schemas import TripPreferences
from .security import hash_password
from .services.generator import active_engine, generate_full_plan


def seed_demo_data() -> None:
    """Create a demo account with one sample trip the first time the app runs."""
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "demo@travel.app").first()
        if user is None:
            user = models.User(
                email="demo@travel.app",
                name="Demo Traveller",
                password_hash=hash_password("demo1234"),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif db.query(models.Trip).filter(models.Trip.user_id == user.id).first():
            return

        prefs = TripPreferences(
            destination="Jaipur",
            start_date=date.today(),
            days=3,
            budget_level="moderate",
            travel_style="solo",
            pace="balanced",
            group_size=1,
            interests=["History & Culture", "Food", "Shopping"],
            notes="First-time visitor, prefers walking where possible.",
        )
        plan, engine = generate_full_plan(prefs)
        db.add(
            models.Trip(
                user_id=user.id,
                title="Jaipur · 3-day trip",
                destination="Jaipur",
                start_date=prefs.start_date,
                days=3,
                budget_level="moderate",
                travel_style="solo",
                pace="balanced",
                group_size=1,
                interests=prefs.interests,
                notes=prefs.notes,
                itinerary=plan.model_dump(),
                generated_by=engine,
            )
        )
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_demo_data()
    yield


settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI-powered day-by-day travel itineraries: React + Vite frontend, FastAPI backend, "
    "Supabase-ready storage, Groq generative AI and Unsplash imagery.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(trips.router)
app.include_router(images.router)


@app.get("/api/health", tags=["system"])
def health():
    engine, _model = active_engine()
    return {
        "status": "ok",
        "ai_engine": engine or "demo-fallback",
        "images": "unsplash" if settings.UNSPLASH_ACCESS_KEY else "placeholders",
    }
