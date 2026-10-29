export function Spinner({ label }) {
  return (
    <div className="flex items-center gap-3 text-slate-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
}

export function ErrorAlert({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200">
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-rose-400 hover:text-rose-600" aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}

const BADGE_STYLES = {
  attraction: "bg-sky-100 text-sky-700",
  food: "bg-amber-100 text-amber-700",
  culture: "bg-violet-100 text-violet-700",
  nature: "bg-emerald-100 text-emerald-700",
  adventure: "bg-orange-100 text-orange-700",
  nightlife: "bg-fuchsia-100 text-fuchsia-700",
  shopping: "bg-rose-100 text-rose-700",
  relaxation: "bg-cyan-100 text-cyan-700",
  photography: "bg-blue-100 text-blue-700",
  wildlife: "bg-lime-100 text-lime-700",
  art: "bg-indigo-100 text-indigo-700",
  transport: "bg-slate-200 text-slate-700",
};

export function CategoryBadge({ category }) {
  const style = BADGE_STYLES[category] || BADGE_STYLES.attraction;
  return <span className={`chip ${style}`}>{category}</span>;
}

const GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-500",
];

export function DestinationImage({ src, name, className = "h-40" }) {
  const gradient = GRADIENTS[(name || "").length % GRADIENTS.length];
  if (!src) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${className}`}>
        <span className="absolute inset-0 grid place-items-center text-4xl font-extrabold text-white/90">
          {(name || "?").charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
    </div>
  );
}

export function BudgetBar({ spent, budget, currency = "₹" }) {
  if (!budget) return null;
  const ratio = Math.min(1, spent / budget);
  const over = spent > budget;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>
          Estimated {currency}
          {spent.toLocaleString("en-IN")}
        </span>
        <span className={over ? "text-rose-600" : ""}>
          Budget {currency}
          {budget.toLocaleString("en-IN")}
          {over && " · over budget"}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${over ? "bg-rose-500" : "bg-gradient-to-r from-indigo-500 to-violet-500"}`}
          style={{ width: `${Math.max(4, ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function EmptyState({ icon = "🧳", title, subtitle, action }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-8 py-14 text-center">
      <span className="text-4xl">{icon}</span>
      <h3 className="text-lg font-bold">{title}</h3>
      {subtitle && <p className="max-w-sm text-sm text-slate-500">{subtitle}</p>}
      {action}
    </div>
  );
}
