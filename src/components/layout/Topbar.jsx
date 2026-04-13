import { Menu, LogOut, Bell, UserCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-4 z-40 mx-4 lg:mx-8 mb-6">
      <div className="glass-panel px-6 py-4 flex justify-between items-center animate-[slide-up_0.4s_ease-out]">
        
        {/* Left side: Mobile menu & Context Title */}
        <div className="flex items-center gap-4">
          <div className="lg:hidden">
            <button className="p-2.5 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors">
              <Menu className="h-6 w-6" />
            </button>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">
              Overview
            </p>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">
              Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
            </h2>
          </div>
        </div>

        {/* Right side: Actions & User Info */}
        <div className="flex items-center gap-5">
          <button className="relative p-2 text-slate-400 hover:text-brand-600 transition-colors rounded-full hover:bg-brand-50">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
          </button>
          
          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-slate-800">
                {user?.name || "Welcome"}
              </p>
              <p className="text-xs text-brand-600 font-medium">
                {user?.roles?.map((r) => r.name).join(", ") || ""}
              </p>
            </div>
            
            <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-tr from-brand-100 to-brand-300 flex items-center justify-center border border-brand-200">
              <UserCircle className="h-6 w-6 text-brand-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
