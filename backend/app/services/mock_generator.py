"""Deterministic demo itinerary engine.

Produces a structured, plausible day-by-day plan without any network calls,
so the full product workflow is demonstrable before Groq/Unsplash keys are
configured. The output validates against the same ItineraryPlan schema as
the Groq-generated plans, which keeps the rest of the stack identical.
"""

from ..schemas import Accommodation, Activity, DayPlan, ItineraryPlan, TripPreferences

PACE_ACTIVITY_COUNT = {"relaxed": 2, "balanced": 3, "packed": 4}

STAY = {
    "budget": ("Backpacker hostel / budget guesthouse near the centre", 1800.0),
    "moderate": ("Boutique 3-star hotel with strong reviews", 4500.0),
    "luxury": ("Premium 5-star stay with breakfast included", 14000.0),
}
MEAL_BUDGET = {"budget": 700.0, "moderate": 1600.0, "luxury": 4500.0}
ACTIVITY_COST = {"budget": (150.0, 500.0), "moderate": (300.0, 1200.0), "luxury": (1500.0, 5000.0)}

INTEREST_POOLS: dict[str, list[tuple[str, str, str]]] = {
    "Food": [
        ("Guided food walk through {dest}'s most-loved local eateries",
         "Sample the dishes locals actually queue for — five to six small stops.", "food"),
        ("Hands-on cooking class covering a signature {dest} dish",
         "Pick ingredients at the local market first, then cook with a local chef.", "food"),
        ("Evening street-food crawl in the buzzing food quarter",
         "Go hungry and follow the longest queues.", "food"),
    ],
    "History & Culture": [
        ("Old quarter heritage walk with a local guide",
         "Temples, havelis and stories the guidebooks skip.", "culture"),
        ("Visit the top-rated museum of {dest}",
         "A perfect indoor stop for the hot midday hours.", "culture"),
        ("Golden-hour visit to the most photographed heritage monument",
         "Arrive 45 minutes before sunset for the best light.", "culture"),
    ],
    "Nature": [
        ("Morning walk through the largest garden or lake promenade",
         "Locals do their jogging here — join them before it gets warm.", "nature"),
        ("Sunset point on the quiet side of town",
         "Pack snacks and reach half an hour early.", "nature"),
    ],
    "Adventure": [
        ("Morning trek on the popular ridge trail",
         "Moderate difficulty; carry water and start early.", "adventure"),
        ("Kayaking / boating session at the main water body",
         "Book the first slot of the day for calm water.", "adventure"),
    ],
    "Nightlife": [
        ("Rooftop bar hopping in the city centre",
         "Reserve a table with a view for the group.", "nightlife"),
        ("Live music night at a well-known local venue",
         "Check the gig schedule — most venues post weekly line-ups.", "nightlife"),
    ],
    "Shopping": [
        ("Bazaar walk through {dest}'s main market district",
         "Bargaining is expected — start at about 60% of the quoted price.", "shopping"),
        ("Handicraft studios and artisan workshops visit",
         "Great place to buy directly from the makers.", "shopping"),
    ],
    "Relaxation": [
        ("Slow morning at a recommended café, then a spa session",
         "Book the spa slot in advance for the evening.", "relaxation"),
        ("Unhurried pool / lakeside afternoon at the stay",
         "Ask the hotel for their quietest hour.", "relaxation"),
    ],
    "Photography": [
        ("Sunrise photo walk through the old town lanes",
         "Best light between 6 and 8 AM; tripods are fine early.", "photography"),
        ("Golden-hour shoot at the panoramic viewpoint",
         "Scout the spot a day earlier if possible.", "photography"),
    ],
    "Wildlife": [
        ("Safari / birding session at the nearest sanctuary",
         "Morning slots have the best sightings; book ahead.", "wildlife"),
        ("Visit the rescue centre / zoo with a naturalist talk",
         "Check feeding-time schedules on arrival.", "wildlife"),
    ],
    "Art": [
        ("Contemporary art gallery and studio district visit",
         "Small galleries often let you meet working artists.", "art"),
        ("Folk art performance or workshop",
         "Ask your stay to arrange tickets a day ahead.", "art"),
    ],
}

GENERAL_POOL: list[tuple[str, str, str]] = [
    ("Morning stroll around the central promenade",
     "An easy way to get oriented on your first hours in {dest}.", "attraction"),
    ("Explore the central market district",
     "Street snacks, textile stalls and people-watching in one place.", "shopping"),
    ("Café hopping in the artsy neighbourhood",
     "Third-wave coffee meets old-school bakeries here.", "food"),
    ("Scenic viewpoint visit",
     "The classic {dest} panorama — go before the evening rush.", "attraction"),
    ("Rooftop dinner with a view",
     "Reserve for sunset; most rooftops fill up fast.", "food"),
]

TIPS = {
    "budget": [
        "Carry some cash — small vendors often don't take cards.",
        "Public transport + walking covers most of this plan.",
    ],
    "moderate": [
        "Use ride-hailing apps for anything beyond 3 km — they're cheap here.",
        "Book the most popular activity of each day one day ahead.",
    ],
    "luxury": [
        "Ask your hotel concierge to pre-arrange tables and tickets.",
        "A private car for the day costs less than three separate cabs.",
    ],
}


def _cost(level: str, low_factor: float = 1.0) -> float:
    low, high = ACTIVITY_COST[level]
    return round(((low + high) / 2) * low_factor, -1)


def _pool_for(interest: str) -> list[tuple[str, str, str]]:
    return INTEREST_POOLS.get(interest, GENERAL_POOL)


def _activities_for_day(prefs: TripPreferences, day_number: int, count: int) -> list[Activity]:
    activities: list[Activity] = []
    times = ["09:00", "11:30", "15:00", "18:30"][:count]
    used_titles: set[str] = set()
    pools = [_pool_for(name) for name in (prefs.interests or [])] or [GENERAL_POOL]

    def pick(pool: list[tuple[str, str, str]], offset: int) -> tuple[str, str, str]:
        fresh = [item for item in pool if item[0].format(dest=prefs.destination) not in used_titles]
        source = fresh or pool
        return source[offset % len(source)]

    for slot in range(count):
        pool = pools[(day_number + slot) % len(pools)]
        title_tpl, desc_tpl, category = pick(pool, day_number * 2 + slot)
        activities.append(
            Activity(
                time=times[slot],
                title=title_tpl.format(dest=prefs.destination),
                description=desc_tpl.format(dest=prefs.destination),
                category=category,
                location=prefs.destination,
                duration="2-3 hrs",
                cost=_cost(prefs.budget_level),
                tip="Book a day in advance if the spot is popular.",
            )
        )
        used_titles.add(activities[-1].title)
    return activities


def _day_title(prefs: TripPreferences, day_number: int) -> str:
    if day_number == 1:
        return f"Arrival & first impressions of {prefs.destination}"
    if day_number == prefs.days and prefs.days > 1:
        return "Souvenirs, slow morning & departure"
    if prefs.interests:
        return f"{prefs.interests[(day_number - 1) % len(prefs.interests)]} day in {prefs.destination}"
    return f"Exploring the best of {prefs.destination}"


def _meals(prefs: TripPreferences, day_number: int) -> dict[str, str]:
    breakfast = (
        "Included at your stay"
        if prefs.budget_level == "luxury"
        else "At a breakfast spot near your stay"
    )
    lunches = [
        "Local eatery near the morning activity",
        f"A classic {prefs.destination} thali house",
        "Street-food lane recommended by locals",
    ]
    dinners = [
        f"Rooftop restaurant with {prefs.destination} views",
        "Family-run place known for one signature dish",
        "Dinner at the night market",
    ]
    return {
        "breakfast": breakfast,
        "lunch": lunches[day_number % len(lunches)],
        "dinner": dinners[(day_number + 1) % len(dinners)],
    }


def build_day(prefs: TripPreferences, day_number: int, variant: int = 0) -> DayPlan:
    count = PACE_ACTIVITY_COUNT[prefs.pace]
    stay_name, stay_price = STAY[prefs.budget_level]
    activities = _activities_for_day(prefs, day_number + variant, count)

    if day_number == 1:
        activities.insert(
            0,
            Activity(
                time="—",
                title="Arrive, check in & settle",
                description="Drop your bags, freshen up and get a local SIM / transport app set up.",
                category="transport",
                location=prefs.destination,
                duration="1-2 hrs",
                cost=0,
            ),
        )
    if day_number == prefs.days and prefs.days > 1:
        activities.append(
            Activity(
                time="—",
                title="Souvenir run & departure",
                description="Pick up gifts from the market closest to your stay, then head out.",
                category="transport",
                location=prefs.destination,
                duration="2 hrs",
                cost=_cost(prefs.budget_level, 0.5),
            )
        )

    activity_total = sum(a.cost for a in activities)
    estimated = round(stay_price + MEAL_BUDGET[prefs.budget_level] + activity_total, 0)

    tips = [TIPS[prefs.budget_level][day_number % 2]]
    if prefs.pace == "relaxed":
        tips.append("Evenings are kept free on purpose — relaxed pacing was requested.")
    if prefs.group_size >= 4:
        tips.append(f"Costs shown are per person for your group of {prefs.group_size}.")

    return DayPlan(
        day=day_number,
        title=_day_title(prefs, day_number),
        estimated_cost=estimated,
        accommodation=Accommodation(name=stay_name, note="Approx. per night", price_per_night=stay_price),
        activities=activities,
        meals=_meals(prefs, day_number),
        transport=[
            "Cluster kept walkable — auto-rickshaw or cab only between distant stops",
            "Approx. 30-40 min total transit per day to minimise travel time",
        ],
        tips=tips,
    )


def generate_demo_plan(prefs: TripPreferences) -> ItineraryPlan:
    days = [build_day(prefs, n) for n in range(1, prefs.days + 1)]
    focus = ", ".join(prefs.interests) if prefs.interests else "the highlights"
    summary = (
        f"A {prefs.days}-day {prefs.pace} trip to {prefs.destination} for a {prefs.travel_style} "
        f"traveller (group of {prefs.group_size}), focused on {focus} and tuned to a "
        f"{prefs.budget_level} budget. Each day is clustered to minimise travel time."
    )
    return ItineraryPlan(
        destination=prefs.destination,
        summary=summary,
        currency="INR",
        total_estimated_cost=round(sum(d.estimated_cost for d in days), 0),
        days=days,
    )
