import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * UX-only guard. It hides screens the user shouldn't see, but it is NOT
 * security: anyone can bypass the SPA with curl. Real enforcement lives in
 * the Express `authenticate` + `requireRole` middleware on every route.
 */
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-10 text-sm text-slate-500">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to={user.role === "manager" ? "/manager/requests" : "/dashboard"} replace />;
  }
  return children;
}
