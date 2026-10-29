import { createContext, useContext, useEffect, useState } from "react";
import { api, clearSession, getToken, setSession, storedUser } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(storedUser);
  const [checking, setChecking] = useState(Boolean(getToken()));

  useEffect(() => {
    let active = true;
    if (getToken()) {
      api("/api/auth/me")
        .then((data) => active && setUser(data))
        .catch(() => {
          clearSession();
          if (active) setUser(null);
        })
        .finally(() => active && setChecking(false));
    }
    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    const data = await api("/api/auth/login", { method: "POST", body: { email, password } });
    setSession(data.access_token, data.user);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await api("/api/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
    setSession(data.access_token, data.user);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, checking, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
