# Personalized Travel Itinerary Planner (TripCraft)

A full-stack, AI-powered web application that generates customized **day-by-day travel
itineraries** from user preferences — attractions, dining, accommodation and
transportation — using prompt engineering with generative AI (Groq), with a modern
SaaS-style React dashboard.

Built for the *"Generative AI with Google Cloud"* module (SkillWallet project:
**Personalized Travel Itinerary Planner**).

## Architecture

```
User ──> Frontend (Vercel)          Backend (Render) ──> Supabase (Database)
         React + Vite               FastAPI                + Groq AI (Generative AI)
         Tailwind CSS                                     + Unsplash API (Images)
```

| Layer | Choice |
| --- | --- |
| Frontend | React 18 + Vite, React Router, Tailwind CSS |
| Backend | FastAPI (Python 3), SQLAlchemy 2, Pydantic v2 |
| Database | SQLite locally → **Supabase Postgres** in production (`DATABASE_URL`) |
| Auth | JWT (PyJWT) + bcrypt password hashing, Bearer tokens |
| Generative AI | **Groq API** (`llama-3.3-70b-versatile` by default, JSON-mode output) |
| Images | **Unsplash API** (with gradient placeholder fallback) |

**Works with zero API keys.** If `GROQ_API_KEY` is not configured, a built-in
*demo itinerary engine* generates structured plans locally (and the trip is
labelled "Demo engine" in the UI); if `UNSPLASH_ACCESS_KEY` is missing, the UI
renders elegant gradient placeholders. Add the keys to `.env` and the same
endpoints switch to real AI and real photos automatically.

## Features (mapped to the project instructions)

1. **Environment setup** — Node 18+/20, Python 3.10+, virtualenv, npm — see below.
2. **System architecture** — React SPA ⇄ FastAPI REST API ⇄ Supabase-ready storage ⇄ Groq AI + Unsplash.
3. **User input handling** — Trip Builder form: destination, start date, days (1–14),
   budget level and optional total budget, travel style, group size, pace
   (relaxed/balanced/packed), interest chips and free-text notes.
4. **AI itinerary generator** — system + user prompt engineering with a strict JSON
   contract; output is validated with Pydantic (`ItineraryPlan`), day count and numbering
   are enforced, and any AI failure falls back to the demo engine so the product never dead-ends.
5. **Backend APIs** — auth, generate, list/get/patch/delete trips, regenerate whole trip,
   regenerate a single day, image proxy, health (see API table).
6. **Supabase** — `backend/supabase/schema.sql` sets up tables + RLS policies; point
   `DATABASE_URL` at your Supabase connection pooler string to move storage to Supabase.
7. **Frontend dashboard** — landing page, auth pages, stats dashboard, trip cards,
   smart trip builder and a full itinerary viewer.
8. **Customization** — regenerate the whole trip, or one specific day, optionally steered
   with a free-text note ("more street food, no museums").
9. **Optimized logic** — days are clustered to minimise travel time, activities are
   paced (2/3/4 per day), costs are budget-tiered with a running total vs. budget bar,
   and the demo engine never repeats an activity within a day.
10. **Deploy & test** — deployment guide below; API verified end-to-end
    (auth → generate → regenerate → edit → delete, plus 401/404/422 handling).

## Project structure

```
Personal-Travel-Itinerary-Planner/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, seeding, health
│   │   ├── config.py          # env-driven settings (pydantic-settings)
│   │   ├── database.py        # SQLAlchemy engine/session (SQLite ⇄ Postgres)
│   │   ├── models.py          # User, Trip (ORM)
│   │   ├── schemas.py         # request/response + ItineraryPlan contract
│   │   ├── security.py        # bcrypt + JWT
│   │   ├── deps.py            # get_current_user
│   │   ├── routers/           # auth.py, trips.py, images.py
│   │   └── services/          # generator.py (Groq+fallback), mock_generator.py, travel_images.py
│   ├── supabase/schema.sql    # tables + RLS for Supabase
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/client.js      # fetch wrapper + token storage
    │   ├── context/AuthContext.jsx
    │   ├── components/        # Navbar, ProtectedRoute, TripCard, DayCard, ui.jsx
    │   └── pages/             # Landing, Login, Register, Dashboard, TripBuilder, TripDetail
    ├── package.json
    └── .env.example
```

## Run locally

**Backend** (terminal 1):

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # optional: add your API keys here
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

**Frontend** (terminal 2):

```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

**Demo account** (seeded automatically on first backend start):
`demo@travel.app` / `demo1234` — includes a sample 3-day Jaipur trip.
Or register a fresh account from the landing page.

## Connecting Supabase, Groq and Unsplash

1. **Supabase** — create a project at supabase.com → SQL Editor → paste and run
   `backend/supabase/schema.sql` → Project Settings → Database → copy the
   **connection pooler** string into `backend/.env`:
   `DATABASE_URL=postgresql+psycopg://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`
2. **Groq** — get a free key at console.groq.com/keys → set `GROQ_API_KEY`.
   Itineraries will now be generated by Llama 3.3 via Groq (labelled "✦ Groq AI").
3. **Unsplash** — create an app at unsplash.com/developers → set `UNSPLASH_ACCESS_KEY`
   for real destination photography.

## API summary

All routes are prefixed `/api` and (except auth/health) require
`Authorization: Bearer <token>`.

| Method + path | Purpose |
| --- | --- |
| POST `/auth/register` · `/auth/login` | Create account / sign in → `{access_token, user}` |
| GET `/auth/me` | Current user |
| POST `/trips/generate` | Generate an itinerary from preferences and save it |
| GET `/trips` · GET `/trips/{id}` | List / read own trips (per-user isolation enforced) |
| PATCH `/trips/{id}` · DELETE `/trips/{id}` | Rename/notes · delete |
| POST `/trips/{id}/regenerate` | Regenerate the entire itinerary |
| POST `/trips/{id}/days/{n}/regenerate` | Regenerate one day, optionally with steering notes |
| GET `/images?query=` | Unsplash image URL (null → UI placeholder) |
| GET `/health` | Status + which engines are active |

## Deployment

**Backend → Render** (or any Python host):
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Env vars: `SECRET_KEY`, `DATABASE_URL` (Supabase), `GROQ_API_KEY`, `UNSPLASH_ACCESS_KEY`,
  `CORS_ORIGINS=https://your-frontend.vercel.app`

**Frontend → Vercel**:
- Framework: Vite; build `npm run build`, output `dist`
- Env var: `VITE_API_URL=https://your-backend.onrender.com`

## Demo walkthrough (for evaluation)

1. Open the landing page → *Try the demo account* → sign in with `demo@travel.app / demo1234`.
2. Dashboard shows the seeded Jaipur trip with stats.
3. Click **Plan a new trip** → destination "Kerala", 4 days, Moderate, couple, pace
   Balanced, interests Food + Nature + Relaxation → **Generate my itinerary**.
4. Review the day cards (activities with times, costs, meals, transport, tips).
5. Click **↻ Regenerate this day** on any day (optionally type "more beaches, less walking").
6. Regenerate the whole trip, then delete a trip — all changes persist per user.

## Honest notes

- Costs are **estimates** in INR (per person) produced by the AI/demo engine for planning guidance only.
- Without a Groq key the app uses the clearly-labelled demo engine (deterministic templates) —
  add the key for real generative AI. Both produce the identical JSON contract.
- Auth is handled by the FastAPI backend (JWT + bcrypt). The Supabase schema ships with
  RLS policies for a future switch to Supabase Auth (GoTrue).
