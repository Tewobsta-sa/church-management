import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const { user, loading, isInitialized } = useAuth();

  const token = localStorage.getItem("token"); // ✅ FIX

  console.log({
    token,
    loading,
    isInitialized,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // System not initialized → force setup
  // if (!isInitialized) {
  //   return <Navigate to="/setup" replace />;
  // }

  // Not logged in
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="hidden lg:block lg:w-64 lg:shrink-0">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col min-h-screen">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
