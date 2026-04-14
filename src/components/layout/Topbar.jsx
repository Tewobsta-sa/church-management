import { Menu, LogOut, Bell, UserCircle, Globe } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import ProfileModal from "./ProfileModal";

export default function Topbar() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'am' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <>
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
              {t('Dashboard')}
            </p>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">
              Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
            </h2>
          </div>
        </div>

        {/* Right side: Actions & User Info */}
        <div className="flex items-center gap-5">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors border border-brand-200"
          >
            <Globe className="h-4 w-4" />
            {i18n.language === 'en' ? 'አማርኛ' : 'English'}
          </button>
          
          <button className="relative p-2 text-slate-400 hover:text-brand-600 transition-colors rounded-full hover:bg-brand-50">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
          </button>
          
          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
          
          <div 
             onClick={() => setIsProfileModalOpen(true)}
             className="flex items-center gap-3 cursor-pointer hover:bg-surface-50 p-1.5 rounded-xl transition-colors"
          >
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-slate-800">
                {user?.name || "Welcome"}
              </p>
              <p className="text-xs text-brand-600 font-medium capitalize">
                {user?.roles?.map((r) => r.name.replace(/_/g, ' ')).join(", ") || ""}
              </p>
            </div>
            
            <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-tr from-brand-100 to-brand-300 flex items-center justify-center border border-brand-200">
              <UserCircle className="h-6 w-6 text-brand-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
    <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </>
  );
}
