"""Generative itinerary service: Google Gemini or Groq, with a demo-engine fallback.

Prompt engineering notes (project instruction #4): the system prompt fixes the
role and the hard constraints (real places, geographic clustering per day,
respect pace/budget/group), and the user prompt carries the traveller's
preferences plus the exact JSON contract. Output is validated with the same
pydantic ItineraryPlan / DayPlan models the demo engine uses — any validation
failure, HTTP error or timeout falls back to the demo engine so the product
never shows a dead end.

Provider selection: whichever key is configured wins (Gemini first if both are
set and AI_PROVIDER=auto); set AI_PROVIDER=groq|gemini to force one.
"""

import json
import logging

import httpx

from ..config import get_settings
from ..schemas import DayPlan, ItineraryPlan, TripPreferences
from .mock_generator import generate_demo_plan

logger = logging.getLogger("travel.ai")

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
# Used automatically when the configured Gemini model is retired (404), rate
# limited (429) or overloaded (503) — Google capacity varies through the day.
GEMINI_RESCUE_MODEL = "gemini-3.5-flash-lite"

SYSTEM_PROMPT = (
    "You are an expert travel planner. You create realistic, well-structured, day-by-day "
    "itineraries using only real, well-known places. Rules: (1) cluster each day's activities "
    "geographically to minimise travel time; (2) respect the requested pace, budget level, "
    "travel style, group size and interests; (3) include attractions, dining, accommodation "
    "and transportation for every day; (4) give per-item and per-day costs in INR that are "
    "plausible for the budget level; (5) output ONLY valid JSON — no markdown, no commentary."
)

PLAN_CONTRACT = """{
  "destination": "string",
  "summary": "2-3 sentence overview of the trip",
  "currency": "INR",
  "total_estimated_cost": 0,
  "days": [
    {
      "day": 1,
      "title": "short theme for the day",
      "estimated_cost": 0,
      "accommodation": {"name": "type of stay + area", "note": "per night", "price_per_night": 0},
      "activities": [
        {"time": "09:00", "title": "activity", "description": "1-2 sentences", "category": "attraction|food|culture|nature|adventure|nightlife|shopping|relaxation|photography|wildlife|art|transport",
         "location": "area / venue", "duration": "approx", "cost": 0, "tip": "optional practical tip"}
      ],
      "meals": {"breakfast": "...", "lunch": "...", "dinner": "..."},
      "transport": ["how to move that day, chosen to minimise backtracking"],
      "tips": ["practical tips for that day"]
    }
  ]
}"""


def _prefs_block(prefs: TripPreferences) -> str:
    return (
        f"Destination: {prefs.destination}\n"
        f"Start date: {prefs.start_date.isoformat()}\n"
        f"Number of days: {prefs.days}\n"
        f"Budget level: {prefs.budget_level}\n"
        f"Total budget for the trip: {prefs.budget_amount if prefs.budget_amount else 'flexible'}\n"
        f"Travel style: {prefs.travel_style}\n"
        f"Group size: {prefs.group_size}\n"
        f"Pace: {prefs.pace}\n"
        f"Interests: {', '.join(prefs.interests) if prefs.interests else 'general sightseeing'}\n"
        f"Special notes from the traveller: {prefs.notes or 'none'}"
    )


def active_engine() -> tuple[str | None, str]:
    """Returns (engine, model). engine is 'gemini', 'groq', or None (demo fallback)."""
    settings = get_settings()
    preference = settings.AI_PROVIDER.strip().lower()
    options = {
        "groq": (settings.GROQ_API_KEY, settings.GROQ_MODEL),
        "gemini": (settings.GEMINI_API_KEY, settings.GEMINI_MODEL),
    }
    if preference in options:
        api_key, model = options[preference]
        return (preference, model) if api_key else (None, "")
    for name in ("groq", "gemini"):  # auto: first configured engine wins
        api_key, model = options[name]
        if api_key:
            return name, model
    return None, ""


def _parse_json(text: str):
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
    return json.loads(cleaned)


def _call_groq(prompt: str, model: str) -> str:
    settings = get_settings()
    response = httpx.post(
        GROQ_URL,
        headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.7,
            "response_format": {"type": "json_object"},
        },
        timeout=90.0,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]


def _call_gemini(prompt: str, model: str) -> str:
    settings = get_settings()

    def generate(model_name: str) -> httpx.Response:
        return httpx.post(
            GEMINI_URL.format(model=model_name),
            headers={"x-goog-api-key": settings.GEMINI_API_KEY},
            json={
                "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.7, "responseMimeType": "application/json"},
            },
            timeout=90.0,
        )

    response = generate(model)
    if response.status_code in (404, 429, 503) and model != GEMINI_RESCUE_MODEL:
        logger.warning(
            "Gemini model %s unavailable (%s), retrying with %s",
            model,
            response.status_code,
            GEMINI_RESCUE_MODEL,
        )
        response = generate(GEMINI_RESCUE_MODEL)
    response.raise_for_status()
    data = response.json()
    candidates = data.get("candidates") or []
    if not candidates:
        raise ValueError(f"Gemini returned no candidates ({data.get('promptFeedback', 'no feedback')})")
    parts = (candidates[0].get("content") or {}).get("parts") or []
    text = "".join(part.get("text", "") for part in parts)
    if not text:
        raise ValueError("Gemini returned an empty response")
    return text


def _call_ai(prompt: str) -> str:
    engine, model = active_engine()
    if engine is None:
        raise RuntimeError("No AI engine configured")
    if engine == "gemini":
        return _call_gemini(prompt, model)
    return _call_groq(prompt, model)


def generate_ai_plan(prefs: TripPreferences) -> ItineraryPlan:
    user_prompt = (
        f"Create a {prefs.days}-day itinerary as JSON matching exactly this contract:\n"
        f"{PLAN_CONTRACT}\n\n"
        f"Traveller preferences:\n{_prefs_block(prefs)}\n\n"
        f"The 'days' array must contain exactly {prefs.days} items numbered 1..{prefs.days}. "
        f"Estimate costs for a {prefs.budget_level} budget and state the grand total."
    )
    data = _parse_json(_call_ai(user_prompt))
    plan = ItineraryPlan(**data)
    if len(plan.days) != prefs.days:
        raise ValueError(f"AI returned {len(plan.days)} days, expected {prefs.days}")
    plan.days = sorted(plan.days, key=lambda d: d.day)
    for index, day in enumerate(plan.days, start=1):
        day.day = index
    if plan.total_estimated_cost <= 0:
        plan.total_estimated_cost = round(sum(d.estimated_cost for d in plan.days), 0)
    return plan


def generate_ai_day(prefs: TripPreferences, day_number: int, notes: str | None,
                    previous_title: str | None) -> DayPlan:
    context = f" The previous day was titled '{previous_title}'." if previous_title else ""
    extra = f" The traveller added these instructions for this day: {notes}." if notes else ""
    user_prompt = (
        "Create exactly ONE day of an itinerary as a JSON object matching this contract:\n"
        f"{PLAN_CONTRACT}\n\n"
        f"Return only the object for the 'day' field — day number must be {day_number}.\n\n"
        f"Traveller preferences:\n{_prefs_block(prefs)}\n"
        f"This is day {day_number} of {prefs.days}.{context}{extra}"
    )
    data = _parse_json(_call_ai(user_prompt))
    day = DayPlan(**data)
    day.day = day_number
    return day


def generate_full_plan(prefs: TripPreferences) -> tuple[ItineraryPlan, str]:
    """Returns (plan, engine) where engine is 'gemini', 'groq' or 'demo'."""
    engine, _ = active_engine()
    if engine:
        try:
            return generate_ai_plan(prefs), engine
        except Exception as error:  # noqa: BLE001 - any AI failure falls back
            logger.warning("%s itinerary generation failed, using demo engine: %s", engine, error)
    return generate_demo_plan(prefs), "demo"


def regenerate_day(prefs: TripPreferences, day_number: int, notes: str | None,
                   previous_title: str | None) -> tuple[DayPlan, str]:
    engine, _ = active_engine()
    if engine:
        try:
            return generate_ai_day(prefs, day_number, notes, previous_title), engine
        except Exception as error:  # noqa: BLE001
            logger.warning("%s day regeneration failed, using demo engine: %s", engine, error)
    from .mock_generator import build_day

    # A different variant keeps the regenerated day visibly different from the stored one.
    return build_day(prefs, day_number, variant=day_number * 3 + 1), "demo"
