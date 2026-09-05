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
  Layers,
  UserCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";

const navItems = [
  {
    path: "/users",
    labelKey: "nav.Admin",
    icon: Settings,
    roles: ["super_admin"],
  },
  {
    path: "/students",
    labelKey: "nav.Students",
    icon: Users,
    roles: [
      "yesew_habt",
      "mereja_kfl",
      "mezmur_kfl",
      "tmhrt_kfl",
      "gngnunet_office_admin",
      "mezmur_office_admin",
      "tmhrt_office_admin",
      "super_admin",
    ],
  },
  {
    path: "/teachers",
    labelKey: "nav.Teachers",
    icon: UserCheck,
    roles: ["tmhrt_kfl", "tmhrt_office_admin", "mereja_kfl", "super_admin"],
  },
  {
    path: "/promotions",
    labelKey: "nav.Promotions",
    icon: Award,
    roles: [
      "yesew_habt",
      "tmhrt_kfl",
      "mereja_kfl",
      "gngnunet_office_admin",
      "tmhrt_office_admin",
      "super_admin",
    ],
  },
  {
    path: "/courses",
    labelKey: "nav.Courses",
    icon: BookOpen,
    roles: ["tmhrt_kfl", "tmhrt_office_admin", "mereja_kfl", "super_admin"],
  },
  {
    path: "/sections",
    labelKey: "nav.Sections",
    icon: Layers,
    roles: ["tmhrt_kfl", "tmhrt_office_admin", "mereja_kfl", "super_admin"],
  },
  {
    path: "/assignments",
    labelKey: "nav.Schedules",
    icon: Calendar,
    roles: [
      "tmhrt_kfl",
      "mezmur_kfl",
      "mereja_kfl",
      "tmhrt_office_admin",
      "mezmur_office_admin",
      "teacher",
      "super_admin",
    ],
  },
  {
    path: "/attendance",
    labelKey: "nav.Attendance",
    icon: CheckSquare,
    roles: [
      "yesew_habt",
      "tmhrt_kfl",
      "mezmur_kfl",
      "mereja_kfl",
      "teacher",
      "tmhrt_office_admin",
      "mezmur_office_admin",
      "gngnunet_office_admin",
      "super_admin",
    ],
  },
  {
    path: "/grades",
    labelKey: "nav.Grading",
    icon: CheckSquare,
    roles: ["teacher", "tmhrt_kfl", "tmhrt_office_admin", "mereja_kfl", "super_admin"],
  },
  {
    path: "/results",
    labelKey: "nav.Results",
    icon: Award,
    roles: ["tmhrt_kfl", "tmhrt_office_admin", "mereja_kfl", "super_admin"],
  },
  {
    path: "/mezmur",
    labelKey: "nav.Mezmur Ministry",
    icon: Music,
    roles: [
      "mezmur_kfl",
      "yesew_habt",
      "mereja_kfl",
      "mezmur_office_admin",
      "gngnunet_office_admin",
      "super_admin",
    ],
  },
  {
    path: "/reports",
    labelKey: "nav.Reports",
    icon: FileDown,
    roles: [
      "super_admin",
      "tmhrt_kfl",
      "yesew_habt",
      "mereja_kfl",
      "tmhrt_office_admin",
      "gngnunet_office_admin",
    ],
  },
  {
    path: "/security",
    labelKey: "nav.Security",
    icon: ShieldCheck,
    roles: ["*"],
  },
];

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const { t } = useTranslation();

  const visibleItems = navItems.filter(
    (item) =>
      item.roles.includes("*") ||
      item.roles.some((role) => hasRole(role)) ||
      hasRole("super_admin"),
  );

  const defaultRoutes = {
    super_admin: "/dashboard",
    yesew_habt: "/students",
    mereja_kfl: "/dashboard",
    mezmur_kfl: "/mezmur",
    tmhrt_kfl: "/students",
    tmhrt_office_admin: "/students",
    teacher: "/assignments",
    mezmur_office_admin: "/mezmur",
    gngnunet_office_admin: "/students",
  };

  const getDefaultRoute = () => {
    const roles = user?.roles?.map((r) => (typeof r === "string" ? r : r?.name)) || [];
    if (user?.role && !roles.includes(user.role)) roles.push(user.role);

    for (const role of roles) {
      if (defaultRoutes[role]) {
        return defaultRoutes[role];
      }
    }

    return "/dashboard";
  };

  const logoPath = getDefaultRoute();
  return (
    <div className="w-72 h-full py-4 pl-4 pr-1">
      <div className="h-full w-full glass-dark rounded-3xl text-white flex flex-col shadow-2xl border border-white/5 overflow-hidden animate-[fade-in_0.5s_ease-out]">
        {/* Logo / Brand */}
        <NavLink
          to={logoPath}
          className="px-5 py-6 flex items-center gap-3.5 border-b border-white/10 hover:bg-white/5 transition-all group"
        >
          <div className="h-12 w-12 flex shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md p-1 border border-amber-400/40 shadow-lg shadow-brand-950/40 group-hover:scale-105 group-hover:border-amber-400 transition-all">
            <img
              src="/logo.png"
              alt="Finote Semaetat Logo"
              className="h-full w-full object-contain filter drop-shadow-md"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tight text-white font-sans truncate leading-tight group-hover:text-amber-300 transition-colors">
              {t("app.name")}
            </h1>
            <p className="text-amber-200/90 text-[10px] uppercase tracking-wider font-bold mt-0.5 truncate">
              {t("app.subtitle")}
            </p>
          </div>
        </NavLink>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "flex items-center px-4 py-3 rounded-2xl transition-all duration-300 group relative font-semibold text-sm",
                  isActive
                    ? "bg-gradient-to-r from-brand-800/80 to-brand-900/60 text-white shadow-lg shadow-brand-950/30 border border-amber-500/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={clsx(
                      "absolute inset-y-1.5 left-0 w-1 rounded-r-full transition-all duration-300",
                      isActive
                        ? "bg-amber-400 scale-y-100 opacity-100 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                        : "scale-y-0 opacity-0 group-hover:scale-y-75 group-hover:opacity-60 bg-amber-400/60",
                    )}
                  />
                  <item.icon
                    className={clsx(
                      "w-4 h-4 mr-3 shrink-0 transition-all duration-200",
                      isActive
                        ? "text-amber-400 group-hover:scale-110"
                        : "text-slate-400 group-hover:text-amber-300 group-hover:scale-110",
                    )}
                  />
                  <span className="tracking-wide truncate">
                    {t(item.labelKey)}
                  </span>
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
              <p className="font-medium text-sm truncate">
                {user?.name || t("nav.Admin")}
              </p>
              <p className="text-xs text-brand-400 truncate opacity-80">
                {user?.roles?.map((r) => r.name).join(" • ") || ""}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-3 text-sm font-medium rounded-xl bg-red-900/20 text-red-300 border border-red-800/20 hover:bg-red-900/40 hover:text-red-200 transition-all group"
          >
            <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
            {t("nav.Logout")}
          </button>
        </div>
      </div>
    </div>
  );
}
