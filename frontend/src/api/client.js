const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TOKEN_KEY = "tc_token";
const USER_KEY = "tc_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function storedUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;
  let data = {};
  try {
    data = await response.json();
  } catch {
    /* non-JSON response */
  }

  if (!response.ok) {
    let detail = data.detail;
    if (detail && typeof detail === "object") {
      detail = Array.isArray(detail)
        ? detail.map((issue) => `${issue.loc?.slice(1).join(".") || "field"}: ${issue.msg}`).join(", ")
        : JSON.stringify(detail);
    }
    throw new Error(detail || `Request failed (${response.status})`);
  }
  return data;
}
