import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import Navbar from "../components/Navbar";
import { ErrorAlert } from "../components/ui";

const INTERESTS = [
  "Food", "History & Culture", "Nature", "Adventure", "Nightlife",
  "Shopping", "Relaxation", "Photography", "Wildlife", "Art",
];

const BUDGET_LEVELS = [
  { value: "budget", label: "Budget", hint: "Hostels & street food" },
  { value: "moderate", label: "Moderate", hint: "3★ stays & local dining" },
  { value: "luxury", label: "Luxury", hint: "5★ stays & curated experiences" },
];

const today = () => new Date().toISOString().slice(0, 10);

export default function TripBuilder() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    destination: "",
    start_date: today(),
    days: 3,
    budget_level: "moderate",
    budget_amount: "",
    travel_style: "solo",
    pace: "balanced",
    group_size: 1,
    notes: "",
  });
  const [interests, setInterests] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const toggleInterest = (interest) =>
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const trip = await api("/api/trips/generate", {
        method: "POST",
        body: {
          destination: form.destination,
          start_date: form.start_date,
          days: Number(form.days),
          budget_level: form.budget_level,
          budget_amount: form.budget_amount ? Number(form.budget_amount) : null,
          travel_style: form.travel_style,
          pace: form.pace,
          group_size: Number(form.group_size),
          interests,
          notes: form.notes || null,
        },
      });
      navigate(`/trips/${trip.id}`, { state: { freshlyGenerated: true } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      {busy && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-white/80 backdrop-blur-sm">
          <div className="card flex flex-col items-center gap-4 px-10 py-8 text-center">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            <div>
              <p className="text-lg font-bold">
                {form.days > 5 ? "Crafting a long adventure…" : "Crafting your itinerary…"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Building {form.days} day{form.days > 1 ? "s" : ""} for {form.destination || "your destination"}
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-extrabold">Plan a new trip</h1>
        <p className="mt-1 text-slate-500">
          The more the AI knows, the better the plan. Everything except the destination is optional.
        </p>

        <form onSubmit={submit} className="card mt-6 space-y-6 p-6">
          <ErrorAlert message={error} onDismiss={() => setError("")} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="destination">Destination *</label>
              <input
                id="destination"
                required
                minLength={2}
                className="input"
                placeholder="e.g. Goa, Manali, Jaipur, Bali"
                value={form.destination}
                onChange={set("destination")}
              />
            </div>
            <div>
              <label className="label" htmlFor="start_date">Start date *</label>
              <input
                id="start_date"
                type="date"
                required
                className="input"
                value={form.start_date}
                onChange={set("start_date")}
              />
            </div>
            <div>
              <label className="label" htmlFor="days">Number of days * (1–14)</label>
              <input
                id="days"
                type="number"
                min="1"
                max="14"
                required
                className="input"
                value={form.days}
                onChange={set("days")}
              />
            </div>
          </div>

          <div>
            <span className="label">Budget level</span>
            <div className="grid gap-3 sm:grid-cols-3">
              {BUDGET_LEVELS.map((level) => (
                <button
                  type="button"
                  key={level.value}
                  onClick={() => setForm((current) => ({ ...current, budget_level: level.value }))}
                  className={`rounded-xl px-4 py-3 text-left text-sm ring-1 transition ${
                    form.budget_level === level.value
                      ? "bg-indigo-50 ring-2 ring-indigo-500"
                      : "bg-white ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="block font-bold">{level.label}</span>
                  <span className="block text-xs text-slate-500">{level.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="budget_amount">Total budget ₹ (optional)</label>
              <input
                id="budget_amount"
                type="number"
                min="0"
                className="input"
                placeholder="e.g. 25000"
                value={form.budget_amount}
                onChange={set("budget_amount")}
              />
            </div>
            <div>
              <label className="label" htmlFor="travel_style">Travelling as</label>
              <select id="travel_style" className="input" value={form.travel_style} onChange={set("travel_style")}>
                <option value="solo">Solo</option>
                <option value="couple">Couple</option>
                <option value="family">Family</option>
                <option value="friends">Friends / group</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="group_size">Group size</label>
              <input
                id="group_size"
                type="number"
                min="1"
                max="20"
                className="input"
                value={form.group_size}
                onChange={set("group_size")}
              />
            </div>
          </div>

          <div>
            <span className="label">Pace</span>
            <div className="flex flex-wrap gap-2">
              {["relaxed", "balanced", "packed"].map((pace) => (
                <button
                  type="button"
                  key={pace}
                  onClick={() => setForm((current) => ({ ...current, pace }))}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ring-1 transition ${
                    form.pace === pace
                      ? "bg-indigo-600 text-white ring-indigo-600"
                      : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {pace}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="label">Interests</span>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  type="button"
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                    interests.includes(interest)
                      ? "bg-violet-600 text-white ring-violet-600"
                      : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="notes">Anything special? (optional)</label>
            <textarea
              id="notes"
              rows={3}
              className="input"
              placeholder="e.g. first-time visitor, vegetarian, prefer walking, celebrating an anniversary…"
              value={form.notes}
              onChange={set("notes")}
            />
          </div>

          <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-base">
            ✦ Generate my itinerary
          </button>
        </form>
      </main>
    </div>
  );
}
