import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getToken, setToken, setCachedUser, getCachedUser, setUnauthorizedHandler } from "../api/client";
import { cacheClear } from "../api/cache";
import { useToast } from "../components/Toast.jsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Hydrate user instantly from localStorage cache — no loading spinner needed
  // if the user was previously logged in. We still verify with /me in background.
  const [user, setUser] = useState(() => getCachedUser());
  const [token, setTokenState] = useState(getToken());
  // If we have a cached user, skip the loading state entirely — show UI immediately
  const [loading, setLoading] = useState(Boolean(getToken()) && !getCachedUser());
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const logout = useCallback(() => {
    setToken(null);
    setCachedUser(null);
    setTokenState(null);
    setUser(null);
    cacheClear();
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setTokenState(null);
      setUser(null);
      setCachedUser(null);
      cacheClear();
      navigate("/login", { replace: true });
    });
  }, [navigate]);

  // Verify the cached session with the server in the background.
  // If the token is stale, clear everything; otherwise refresh the user data silently.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
        setCachedUser(res.data);
      })
      .catch(() => {
        setUser(null);
        setCachedUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  /** Pull unseen status changes, toast them, then ack so they never repeat. */
  const syncNotifications = useCallback(async () => {
    try {
      const { data } = await api.get("/leaves/notifications");
      const items = data.notifications || [];
      if (!items.length) return;
      items.forEach((n) =>
        pushToast(
          `Leave ${n.start_date?.slice(0, 10)} → ${n.end_date?.slice(0, 10)} was ${n.status}`,
          n.status === "approved" ? "success" : "error",
        ),
      );
      await api.post("/leaves/notifications/ack", { ids: items.map((n) => n.id) });
    } catch {
      /* notifications are best-effort */
    }
  }, [pushToast]);

  useEffect(() => {
    if (user?.role !== "employee") return undefined;
    syncNotifications();
    const id = setInterval(syncNotifications, 30000);
    return () => clearInterval(id);
  }, [user, syncNotifications]);

  // Login — use the response data directly instead of making a second /me call.
  const login = useCallback(async (username, password) => {
    const { data } = await api.post("/auth/login", { username, password });
    setToken(data.token);
    setTokenState(data.token);
    // The server returns all profile fields — use them directly.
    const userData = { 
      id: data.id, 
      username: data.username, 
      role: data.role,
      full_name: data.full_name,
      department: data.department,
      profile_pic_url: data.profile_pic_url,
    };
    setUser(userData);
    setCachedUser(userData);
    return userData;
  }, []);

  // Register — same optimisation, use response data directly.
  const register = useCallback(async (username, password, full_name, department) => {
    const { data } = await api.post("/auth/register", { username, password, full_name, department });
    setToken(data.token);
    setTokenState(data.token);
    const userData = { 
      id: data.id, 
      username: data.username, 
      role: data.role,
      full_name: data.full_name,
      department: data.department
    };
    setUser(userData);
    setCachedUser(userData);
    return userData;
  }, []);

  const updateProfile = useCallback(async (formData) => {
    const { data } = await api.patch("/auth/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setUser(data);
    setCachedUser(data);
    return data;
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, updateProfile }),
    [user, token, loading, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
