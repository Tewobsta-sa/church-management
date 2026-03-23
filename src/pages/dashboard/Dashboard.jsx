import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  // Quick role-based landing page redirection
  if (!user) return <Navigate to="/login" replace />;

  // You can later decide different landing pages per major role group
  return <Outlet />;
}
