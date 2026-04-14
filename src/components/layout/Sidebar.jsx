import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  LogOut,
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  CheckSquare,
  Award,
  Music,
  Settings,
  FileDown,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";

const navItems = [
  {
    path: "/users",
    label: "Admin",
    icon: Settings,
    roles: ["super_admin"],
  },
  {
    path: "/students",
    label: "Students",
    icon: Users,
    roles: [
      "gngnunet_office_admin",
      "mezmur_office_admin",
      "tmhrt_office_admin",
      "super_admin"
    ],
  },
  {
    path: "/promotions",
    label: "Promotions",
    icon: Award,
    roles: [
      "gngnunet_office_admin",
      "tmhrt_office_admin",
      "super_admin"
    ],
  },
  {
    path: "/courses",
    label: "Courses",
    icon: BookOpen,
    roles: ["tmhrt_office_admin", "super_admin"],
  },
  {
    path: "/assignments",
    label: "Schedules",
    icon: Calendar,
    roles: [
      "tmhrt_office_admin",
      "mezmur_office_admin",
      "teacher",
      "super_admin"
    ],
  },
  {
    path: "/attendance",
    label: "Attendance",
    icon: CheckSquare,
    roles: [
      "teacher",
      "tmhrt_office_admin",
      "mezmur_office_admin",
      "super_admin"
    ],
  },
  {
    path: "/grades",
    label: "Grading",
    icon: CheckSquare,
    roles: ["teacher", "tmhrt_office_admin", "super_admin"],
  },
  {
    path: "/results",
    label: "Results",
    icon: Award,
    roles: ["tmhrt_office_admin", "super_admin"],
  },
  {
    path: "/mezmur",
    label: "Mezmur Ministry",
    icon: Music,
    roles: ["mezmur_office_admin", "super_admin"],
  },
  {
    path: "/reports",
    label: "Reports",
    icon: FileDown,
    roles: ["super_admin", "tmhrt_office_admin", "gngnunet_office_admin"],
  },
  {
    path: "/security",
    label: "Security",
    icon: ShieldCheck,
    roles: ["*"],
  },
];

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const { t } = useTranslation();

  const visibleItems = navItems.filter(
    (item) =>
      item.roles.includes("*") || item.roles.some((role) => hasRole(role)) || hasRole("super_admin"),
  );

  return (
    <div className="w-72 h-full py-4 pl-4 pr-1">
      <div className="h-full w-full glass-dark rounded-3xl text-white flex flex-col shadow-2xl border border-white/5 overflow-hidden animate-[fade-in_0.5s_ease-out]">
        {/* Logo / Brand */}
        <div className="px-8 py-8 flex items-center gap-4 border-b border-brand-800/50">
          <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-400 to-brand-600 shadow-lg shadow-brand-500/30">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand-50 font-sans">MGT System</h1>
            <p className="text-brand-300 text-[11px] uppercase tracking-wider font-semibold mt-0.5 opacity-80">Administration</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                  isActive
                    ? "bg-brand-600/30 font-medium text-white shadow-inner border border-brand-500/30"
                    : "text-brand-200/80 hover:bg-brand-800/40 hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={clsx("absolute inset-y-0 left-0 w-1 rounded-r-full transition-all duration-300", isActive ? "bg-brand-400 scale-y-100 opacity-100" : "scale-y-0 opacity-0 group-hover:scale-y-50 group-hover:opacity-50 bg-brand-500")} />
                  <item.icon className={clsx("w-5 h-5 mr-3 transition-colors", isActive ? "text-brand-300" : "text-brand-400/50 group-hover:text-brand-300")} />
                  <span className="tracking-wide text-sm">{t(item.label)}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section + logout */}
        <div className="p-4 mx-4 mb-4 rounded-2xl bg-surface-900/30 border border-brand-800/30 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-brand-800 flex items-center justify-center font-bold shadow-inner">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{user?.name || "Administrator"}</p>
              <p className="text-xs text-brand-400 truncate opacity-80">
                {user?.roles?.map((r) => r.name).join(" • ") || "No active role"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all duration-200 text-sm font-medium border border-red-500/20 hover:border-red-500/30"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
