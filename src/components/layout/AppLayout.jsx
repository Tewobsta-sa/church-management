import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const { user, loading, isInitialized } = useAuth();
  const token = localStorage.getItem("token");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4 animate-[fade-in_0.3s_ease-out]">
          <div className="h-12 w-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin"></div>
          <div className="text-lg font-medium text-brand-900 tracking-wide">Loading Workspace...</div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-surface-50 text-slate-800 font-sans selection:bg-brand-200 selection:text-brand-900 overflow-hidden relative">
      
      {/* Decorative background blurs */}
      <div className="absolute top-0 right-0 -mr-40 w-96 h-96 bg-brand-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-40 mb-20 w-80 h-80 bg-brand-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 pointer-events-none"></div>

      <div className="flex h-screen relative z-10">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:shrink-0">
          <Sidebar />
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-12 custom-scrollbar">
            <div className="mx-auto max-w-7xl animate-[fade-in_0.4s_ease-out]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
