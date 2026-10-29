import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorAlert } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 text-lg text-white">
            ✈
          </span>
          <span className="text-xl font-extrabold">
            Trip<span className="text-indigo-600">Craft</span>
          </span>
        </Link>
        <h1 className="text-center text-2xl font-extrabold">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Sign in to view and plan your trips.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <ErrorAlert message={error} onDismiss={() => setError("")} />
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full py-3">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          New here?{" "}
          <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
            Create an account
          </Link>
        </p>
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center text-xs text-slate-500 ring-1 ring-slate-200">
          Demo account — <span className="font-mono">demo@travel.app</span> /{" "}
          <span className="font-mono">demo1234</span>
        </div>
      </div>
    </div>
  );
}
