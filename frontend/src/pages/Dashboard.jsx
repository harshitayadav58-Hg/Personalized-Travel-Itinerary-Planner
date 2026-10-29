import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import Navbar from "../components/Navbar";
import TripCard from "../components/TripCard";
import { EmptyState, ErrorAlert, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    api("/api/trips")
      .then(setTrips)
      .catch((err) => setError(err.message));
  };
  useEffect(load, []);

  const remove = async (trip) => {
    if (!window.confirm(`Delete "${trip.title}"? This cannot be undone.`)) return;
    try {
      await api(`/api/trips/${trip.id}`, { method: "DELETE" });
      setTrips((current) => current.filter((item) => item.id !== trip.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const destinations = trips ? new Set(trips.map((trip) => trip.destination)).size : 0;
  const totalDays = trips ? trips.reduce((sum, trip) => sum + (trip.days || 0), 0) : 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">Hi {user?.name?.split(" ")[0]} 👋</h1>
            <p className="mt-1 text-slate-500">Your saved itineraries, ready when you are.</p>
          </div>
          <Link to="/plan" className="btn-primary">＋ Plan a new trip</Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Saved trips", value: trips ? trips.length : "—", icon: "🗺️" },
            { label: "Destinations", value: trips ? destinations : "—", icon: "📍" },
            { label: "Days planned", value: trips ? totalDays : "—", icon: "📅" },
          ].map((stat) => (
            <div key={stat.label} className="card flex items-center gap-4 p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-xl">
                {stat.icon}
              </span>
              <div>
                <p className="text-2xl font-extrabold leading-none">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <ErrorAlert message={error} onDismiss={() => setError("")} />

        {trips === null && !error ? (
          <div className="mt-10 flex justify-center">
            <Spinner label="Loading your trips…" />
          </div>
        ) : trips && trips.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="No trips yet"
              subtitle="Describe your next getaway and the AI will build a day-by-day itinerary in seconds."
              action={
                <Link to="/plan" className="btn-primary mt-2">
                  Plan your first trip
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(trips || []).map((trip) => (
              <TripCard key={trip.id} trip={trip} onDelete={remove} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
