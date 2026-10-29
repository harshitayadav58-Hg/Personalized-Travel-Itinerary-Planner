import { useState } from "react";
import { CategoryBadge } from "./ui";

const CATEGORY_ICONS = {
  attraction: "📍",
  food: "🍽️",
  culture: "🏛️",
  nature: "🌿",
  adventure: "🥾",
  nightlife: "🌙",
  shopping: "🛍️",
  relaxation: "🧘",
  photography: "📷",
  wildlife: "🦚",
  art: "🎨",
  transport: "🚌",
};

const inr = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function DayCard({ trip, day, onRegenerate, regenerating }) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const date = new Date(trip.start_date);
  date.setDate(date.getDate() + (day.day - 1));
  const dateLabel = Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 to-violet-50/50 px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
            Day {day.day}
            {dateLabel && ` · ${dateLabel}`}
          </p>
          <h3 className="text-lg font-bold">{day.title}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="chip bg-white text-slate-700 ring-1 ring-slate-200">
            ≈ {inr(day.estimated_cost)}
          </span>
          <button
            onClick={() => (showNotes ? onRegenerate(day, notes) : setShowNotes(true))}
            disabled={regenerating === day.day}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            {regenerating === day.day ? "Regenerating…" : "↻ Regenerate this day"}
          </button>
        </div>
      </header>

      {showNotes && regenerating !== day.day && (
        <div className="flex gap-2 border-b border-slate-100 bg-indigo-50/40 px-5 py-3">
          <input
            className="input"
            placeholder="Optional: steer the regeneration, e.g. 'more street food, less walking'"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && onRegenerate(day, notes)}
          />
          <button onClick={() => onRegenerate(day, notes)} className="btn-primary whitespace-nowrap">
            Regenerate
          </button>
          <button onClick={() => setShowNotes(false)} className="btn-ghost">
            Cancel
          </button>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {(day.activities || []).map((activity, index) => (
          <div key={index} className="flex gap-4 px-5 py-4">
            <div className="w-14 shrink-0 pt-0.5 text-sm font-bold text-slate-400">{activity.time}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span aria-hidden>{CATEGORY_ICONS[activity.category] || "📍"}</span>
                <h4 className="font-semibold">{activity.title}</h4>
                <CategoryBadge category={activity.category} />
                {activity.cost ? (
                  <span className="text-xs font-semibold text-emerald-600">{inr(activity.cost)}</span>
                ) : null}
              </div>
              {activity.description && (
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{activity.description}</p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                {activity.location && <span>📍 {activity.location}</span>}
                {activity.duration && <span>⏱ {activity.duration}</span>}
                {activity.tip && <span>💡 {activity.tip}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-sm sm:grid-cols-2">
        <div>
          <h4 className="mb-1 font-bold text-slate-700">🍽️ Meals</h4>
          <ul className="space-y-0.5 text-slate-600">
            {Object.entries(day.meals || {}).map(([meal, description]) => (
              <li key={meal}>
                <span className="font-semibold capitalize">{meal}:</span> {description}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-1 font-bold text-slate-700">🚌 Getting around</h4>
          <ul className="list-disc space-y-0.5 pl-4 text-slate-600">
            {(day.transport || []).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        {day.accommodation && (
          <div>
            <h4 className="mb-1 font-bold text-slate-700">🏨 Stay</h4>
            <p className="text-slate-600">
              {day.accommodation.name}
              {day.accommodation.price_per_night
                ? ` — ${inr(day.accommodation.price_per_night)}/night`
                : ""}
            </p>
          </div>
        )}
        {(day.tips || []).length > 0 && (
          <div>
            <h4 className="mb-1 font-bold text-slate-700">💡 Tips</h4>
            <ul className="list-disc space-y-0.5 pl-4 text-slate-600">
              {day.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
