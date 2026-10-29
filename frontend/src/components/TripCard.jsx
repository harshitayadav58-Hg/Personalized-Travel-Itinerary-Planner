import { Link } from "react-router-dom";
import { DestinationImage } from "./ui";

export default function TripCard({ trip, onDelete }) {
  const plan = trip.itinerary || {};
  return (
    <div className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/trips/${trip.id}`}>
        <DestinationImage src={trip.image_url} name={trip.destination} className="h-36" />
      </Link>
      <div className="space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              to={`/trips/${trip.id}`}
              className="line-clamp-1 font-bold hover:text-indigo-600"
            >
              {trip.title}
            </Link>
            <p className="text-sm text-slate-500">
              {trip.destination} · starts {trip.start_date}
            </p>
          </div>
          <span className="chip bg-indigo-50 text-indigo-700">{trip.days}d</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="chip bg-slate-100 capitalize text-slate-600">{trip.budget_level}</span>
          <span className="chip bg-slate-100 capitalize text-slate-600">{trip.pace} pace</span>
          <span className="chip bg-slate-100 capitalize text-slate-600">
            {trip.travel_style} · {trip.group_size}
          </span>
          {plan.total_estimated_cost ? (
            <span className="chip bg-emerald-50 text-emerald-700">
              ≈ ₹{Number(plan.total_estimated_cost).toLocaleString("en-IN")}
            </span>
          ) : null}
          <span
            className={`chip ${trip.generated_by === "demo" ? "bg-amber-50 text-amber-700" : "bg-violet-50 text-violet-700"}`}
            title={trip.generated_by === "demo" ? "Generated with the built-in demo engine" : `Generated with ${trip.generated_by === "gemini" ? "Google Gemini" : "Groq"} AI`}
          >
            {trip.generated_by === "demo" ? "Demo engine" : "AI"}
          </span>
        </div>

        <div className="flex justify-end pt-1">
          <button onClick={() => onDelete(trip)} className="btn-danger px-3 py-1.5 text-xs">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
