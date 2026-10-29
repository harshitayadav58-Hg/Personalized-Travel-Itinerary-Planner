import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  {
    icon: "🤖",
    title: "AI day-by-day plans",
    text: "Groq-powered generative AI turns your preferences into a structured itinerary with attractions, dining, stays and transport.",
  },
  {
    icon: "💰",
    title: "Budget-aware",
    text: "Pick a budget level or a total amount — every day carries cost estimates and a running total against your budget.",
  },
  {
    icon: "🔁",
    title: "Regenerate any day",
    text: "Not happy with Tuesday? Regenerate just that day, optionally steering it with a free-text note.",
  },
  {
    icon: "🖼️",
    title: "Destination imagery",
    text: "Real photos via the Unsplash API, with elegant gradient fallbacks when offline.",
  },
];

const STEPS = [
  { n: "1", title: "Describe your trip", text: "Destination, dates, days, budget, interests, travel style, group size and pace." },
  { n: "2", title: "AI crafts the itinerary", text: "A structured plan is generated and saved to your dashboard in seconds." },
  { n: "3", title: "Refine and go", text: "Read the day cards, regenerate what you don't love, and travel." },
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <span className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 text-lg text-white">
            ✈
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            Trip<span className="text-indigo-600">Craft</span>
          </span>
        </span>
        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/dashboard" className="btn-primary">Open dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Sign in</Link>
              <Link to="/register" className="btn-primary">Get started</Link>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 text-center">
        <span className="chip mx-auto mb-5 bg-indigo-50 text-indigo-700">
          ✦ Generative AI with Google Cloud — Capstone Project
        </span>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Your personalized travel itinerary,{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
            planned in seconds
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Tell TripCraft where you want to go and how you like to travel. It generates a
          day-by-day plan — attractions, dining, stays and transport — tuned to your budget
          and interests. Edit or regenerate any day you like.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to={user ? "/plan" : "/register"} className="btn-primary px-6 py-3 text-base">
            Plan my trip — free
          </Link>
          <Link to="/login" className="btn-ghost px-6 py-3 text-base">
            Try the demo account
          </Link>
        </div>
        <div className="mx-auto mt-10 flex max-w-lg items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-500 px-6 py-4 text-left text-sm font-semibold text-white shadow-lg">
          <span className="text-2xl">🧳</span>
          <span>
            Demo login: <span className="font-mono">demo@travel.app</span> /{" "}
            <span className="font-mono">demo1234</span>
          </span>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card p-6">
              <span className="text-3xl">{feature.icon}</span>
              <h3 className="mt-3 font-bold">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-extrabold">How it works</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n} className="card relative p-6">
              <span className="absolute -top-3 left-6 grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                {step.n}
              </span>
              <h3 className="mt-2 font-bold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        Personalized Travel Itinerary Planner · React + Vite · FastAPI · Supabase-ready · Groq AI · Unsplash
      </footer>
    </div>
  );
}
