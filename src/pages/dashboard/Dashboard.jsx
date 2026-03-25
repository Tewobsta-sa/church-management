import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Simple success page for testing
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center">
        <h1 className="text-4xl font-bold text-green-600 mb-4">
          ✅ Login Successful!
        </h1>
        <p className="text-xl text-gray-700 mb-6">
          Welcome to the Church Management Dashboard
        </p>
        <p className="text-gray-500">
          You are now logged in as:{" "}
          <strong>{user.username || user.email}</strong>
        </p>
      </div>
    </div>
  );
}
