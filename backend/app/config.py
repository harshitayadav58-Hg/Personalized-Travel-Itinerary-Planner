from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Personalized Travel Itinerary Planner"
    SECRET_KEY: str = "dev-only-change-me-1f3a5c7e9b2d4f6a8c0e2b4d6f8a1c3e"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    DATABASE_URL: str = "sqlite:///./travel_planner.db"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Generative AI: configure ONE of the keys (or both and choose with AI_PROVIDER).
    # With no key at all, the deterministic demo engine is used.
    AI_PROVIDER: str = "auto"  # auto | groq | gemini
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash"

    # Unsplash images. Empty key -> UI gradient placeholders.
    UNSPLASH_ACCESS_KEY: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
