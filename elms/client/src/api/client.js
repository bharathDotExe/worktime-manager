import axios from "axios";
import { cacheClear } from "./cache";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_BASE,
});

// Token lives in memory (module scope) and mirrors localStorage so it
// persists across tabs and page refreshes (sessionStorage was lost on
// every new tab, forcing a full re-login).
let accessToken = localStorage.getItem("elms_token") || null;
let onUnauthorized = () => {};

export function setToken(token) {
  accessToken = token;
  if (token) localStorage.setItem("elms_token", token);
  else {
    localStorage.removeItem("elms_token");
    localStorage.removeItem("elms_user");
    cacheClear();
  }
}

export function getToken() {
  return accessToken;
}

/** Save the user object to localStorage for instant hydration on reload. */
export function setCachedUser(user) {
  if (user) localStorage.setItem("elms_user", JSON.stringify(user));
  else localStorage.removeItem("elms_user");
}

/** Read the cached user so we can render the UI before /auth/me returns. */
export function getCachedUser() {
  try {
    const raw = localStorage.getItem("elms_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      setToken(null);
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

/** Normalizes any axios failure into a displayable message. */
export function errorMessage(error, fallback = "Something went wrong") {
  return error?.response?.data?.error || error?.message || fallback;
}

export default api;
