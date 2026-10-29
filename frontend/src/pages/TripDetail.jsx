import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import DayCard from "../components/DayCard";
import Navbar from "../components/Navbar";
import { BudgetBar, DestinationImage, ErrorAlert, Spinner } from "../components/ui";

const inr = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");
  const [regenerating, setRegenerating] = useState(null);
  const freshlyGenerated = Boolean(location.state?.freshlyGenerated);

  useEffect(() => {
    api(`/api/trips/${id}`)
      .then(setTrip)
      .catch((err) => setError(err.message));
  }, [id]);

  const regenerateDay = async (day, notes) => {
    setRegenerating(day.day);
    setError("");
    try {
      const updated = await api(`/api/trips/${id}/days/${day.day}/regenerate`, {
        method: "POST",
        body: { notes: notes || null },
      });
      setTrip(updated);
      setRegenerating(null);
    } catch (err) {
      setError(err.message);
      setRegenerating(null);
    }
  };

  const regenerateAll = async () => {
    if (!window.confirm("Regenerate the entire itinerary? The current plan will be replaced.")) return;
    setRegenerating("all");
    try {
      setTrip(await api(`/api/trips/${id}/regenerate`, { method: "POST" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setRegenerating(null);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this trip? This cannot be undone.")) return;
    try {
      await api(`/api/trips/${id}`, { method: "DELETE" });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  if (error && !trip) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <ErrorAlert message={error} />
          <Link to="/dashboard" className="btn-ghost mt-4">← Back to dashboard</Link>
        </main>
      </div>
    );
  }
  if (!trip) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center pt-24">
          <Spinner label="Loading itinerary…" />
        </div>
      </div>
    );
  }

  const plan = trip.itinerary || {};

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {freshlyGenerated && (
          <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
            ✦ Your itinerary is ready and saved. Read through it and regenerate any day you'd like to change.
          </div>
        )}
        <ErrorAlert message={error} onDismiss={() => setError("")} />

        <div className="card overflow-hidden">
          <DestinationImage src={trip.image_url} name={trip.destination} className="h-48" />
          <div className="space-y-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold">{trip.title}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {trip.destination} · starts {trip.start_date} · {trip.days} day
                  {trip.days > 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`chip ${
                    trip.generated_by === "demo"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-violet-50 text-violet-700"
                  }`}
                  title={
                    trip.generated_by === "demo"
                      ? "Generated with the built-in demo engine (no AI key configured)"
                      : `Generated with ${trip.generated_by === "gemini" ? "Google Gemini" : "Groq"} AI`
                  }
                >
                  {trip.generated_by === "demo"
                    ? "⚙ Demo engine"
                    : trip.generated_by === "gemini"
                      ? "✦ Gemini AI"
                      : "✦ Groq AI"}
                </span>
                <button onClick={remove} className="btn-danger px-3 py-1.5 text-xs">Delete</button>
              </div>
            </div>

            {plan.summary && <p className="leading-relaxed text-slate-600">{plan.summary}</p>}

            <div className="flex flex-wrap gap-1.5">
              <span className="chip bg-slate-100 capitalize text-slate-600">{trip.budget_level} budget</span>
              <span className="chip bg-slate-100 capitalize text-slate-600">{trip.pace} pace</span>
              <span className="chip bg-slate-100 capitalize text-slate-600">{trip.travel_style}</span>
              <span className="chip bg-slate-100 text-slate-600">group of {trip.group_size}</span>
              {(trip.interests || []).map((interest) => (
                <span key={interest} className="chip bg-violet-50 text-violet-700">{interest}</span>
              ))}
            </div>

            <BudgetBar spent={plan.total_estimated_cost} budget={trip.budget_amount} />
            {plan.total_estimated_cost ? (
              <p className="text-sm text-slate-500">
                Total estimated cost:{" "}
                <span className="font-bold text-slate-700">
                  {inr(plan.total_estimated_cost)}
                </span>{" "}
                <span className="text-xs">(per person, excluding travel to {trip.destination})</span>
              </p>
            ) : null}

            <div className="flex gap-2 pt-1">
              <button onClick={regenerateAll} disabled={regenerating === "all"} className="btn-ghost text-xs">
                {regenerating === "all" ? "Regenerating everything…" : "↻ Regenerate whole trip"}
              </button>
              <Link to="/plan" className="btn-ghost text-xs">＋ Plan another trip</Link>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {(plan.days || []).map((day) => (
            <DayCard
              key={day.day}
              trip={trip}
              day={day}
              onRegenerate={regenerateDay}
              regenerating={regenerating}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
