import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getToken, setToken, setUnauthorizedHandler } from "../api/client";
import { useToast } from "../components/Toast.jsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [loading, setLoading] = useState(Boolean(getToken()));
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const logout = useCallback(() => {
    setToken(null);
    setTokenState(null);
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setTokenState(null);
      setUser(null);
      navigate("/login", { replace: true });
    });
  }, [navigate]);

  // Restore the session from sessionStorage on reload.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
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

  const login = useCallback(async (username, password) => {
    const { data } = await api.post("/auth/login", { username, password });
    setToken(data.token);
    setTokenState(data.token);
    const me = await api.get("/auth/me");
    setUser(me.data);
    return me.data;
  }, []);

  const register = useCallback(async (username, password) => {
    const { data } = await api.post("/auth/register", { username, password });
    setToken(data.token);
    setTokenState(data.token);
    const me = await api.get("/auth/me");
    setUser(me.data);
    return me.data;
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
