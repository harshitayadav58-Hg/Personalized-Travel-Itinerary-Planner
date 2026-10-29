-- Personalized Travel Itinerary Planner — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
--
-- Two supported integration modes:
--   Mode A (used by this repo's backend): the FastAPI backend owns auth (JWT)
--     and writes through the Postgres connection string. Tables live in the
--     public schema with the same names as the SQLAlchemy models. When the
--     backend connects with the service connection string, RLS below does not
--     apply to it (service role bypasses RLS); API-level ownership checks in
--     the backend enforce per-user access.
--   Mode B (optional, future): switch auth to Supabase Auth (GoTrue). Then the
--     users table below is replaced by auth.users and the RLS policies using
--     auth.uid() enforce row-level access directly.

create table if not exists public.users (
    id            bigint generated always as identity primary key,
    email         text unique not null,
    name          text not null,
    password_hash text not null,
    created_at    timestamptz not null default now()
);

create table if not exists public.trips (
    id            bigint generated always as identity primary key,
    user_id       bigint not null references public.users(id) on delete cascade,
    title         text not null,
    destination   text not null,
    start_date    date not null,
    days          int not null,
    budget_level  text not null default 'moderate',
    budget_amount numeric,
    travel_style  text not null default 'solo',
    pace          text not null default 'balanced',
    group_size    int not null default 1,
    interests     jsonb not null default '[]'::jsonb,
    notes         text,
    image_url     text,
    itinerary     jsonb not null,
    generated_by  text not null default 'demo',
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create index if not exists trips_user_id_idx on public.trips(user_id);
create index if not exists trips_destination_idx on public.trips(destination);

-- Row-level security for direct PostgREST access (Mode B).
alter table public.trips enable row level security;

drop policy if exists "trips_select_own" on public.trips;
create policy "trips_select_own" on public.trips
    for select using (user_id::text = auth.uid()::text);

drop policy if exists "trips_insert_own" on public.trips;
create policy "trips_insert_own" on public.trips
    for insert with check (user_id::text = auth.uid()::text);

drop policy if exists "trips_update_own" on public.trips;
create policy "trips_update_own" on public.trips
    for update using (user_id::text = auth.uid()::text);

drop policy if exists "trips_delete_own" on public.trips;
create policy "trips_delete_own" on public.trips
    for delete using (user_id::text = auth.uid()::text);
