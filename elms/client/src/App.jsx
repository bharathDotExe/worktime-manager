import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/employee/Dashboard.jsx";
import ApplyLeave from "./pages/employee/ApplyLeave.jsx";
import LeaveHistory from "./pages/employee/LeaveHistory.jsx";
import Employees from "./pages/manager/Employees.jsx";
import LeaveRequests from "./pages/manager/LeaveRequests.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={<ProtectedRoute role="employee"><Dashboard /></ProtectedRoute>}
      />
      <Route
        path="/apply"
        element={<ProtectedRoute role="employee"><ApplyLeave /></ProtectedRoute>}
      />
      <Route
        path="/history"
        element={<ProtectedRoute role="employee"><LeaveHistory /></ProtectedRoute>}
      />

      <Route
        path="/manager/requests"
        element={<ProtectedRoute role="manager"><LeaveRequests /></ProtectedRoute>}
      />
      <Route
        path="/manager/employees"
        element={<ProtectedRoute role="manager"><Employees /></ProtectedRoute>}
      />

      <Route path="/" element={<Landing />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
