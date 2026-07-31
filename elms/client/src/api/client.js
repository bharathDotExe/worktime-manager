import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

// Token lives in memory (module scope) and mirrors sessionStorage.
let accessToken = sessionStorage.getItem("elms_token") || null;
let onUnauthorized = () => {};

export function setToken(token) {
  accessToken = token;
  if (token) sessionStorage.setItem("elms_token", token);
  else sessionStorage.removeItem("elms_token");
}

export function getToken() {
  return accessToken;
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
