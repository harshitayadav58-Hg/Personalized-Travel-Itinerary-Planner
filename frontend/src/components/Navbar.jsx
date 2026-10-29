import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 text-lg text-white">
            ✈
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            Trip<span className="text-indigo-600">Craft</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Link to="/dashboard" className="rounded-lg px-3 py-2 hover:bg-slate-100">
            Dashboard
          </Link>
          <Link to="/plan" className="rounded-lg px-3 py-2 hover:bg-slate-100">
            Plan a trip
          </Link>
          <div className="mx-2 hidden h-6 w-px bg-slate-200 sm:block" />
          <span className="hidden text-slate-500 sm:block">{user?.name}</span>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="btn-ghost"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
