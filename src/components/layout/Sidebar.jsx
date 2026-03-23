import { useAuth } from "../../context/AuthContext";
import {
  LogOut,
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  CheckSquare,
  Award,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["*"] },
  {
    path: "/students",
    label: "Students",
    icon: Users,
    roles: [
      "gngnunet_office_admin",
      "young_gngnunet_admin",
      "mezmur_office_admin",
      "tmhrt_office_admin",
      "distance_admin",
    ],
  },
  {
    path: "/courses",
    label: "Courses & Sections",
    icon: BookOpen,
    roles: ["distance_admin", "tmhrt_office_admin"],
  },
  {
    path: "/assignments",
    label: "Assignments",
    icon: Calendar,
    roles: [
      "distance_admin",
      "tmhrt_office_admin",
      "mezmur_office_admin",
      "teacher",
    ],
  },
  {
    path: "/attendance",
    label: "Attendance",
    icon: CheckSquare,
    roles: [
      "teacher",
      "distance_admin",
      "tmhrt_office_admin",
      "mezmur_office_admin",
    ],
  },
  {
    path: "/grades",
    label: "Grades",
    icon: Award,
    roles: ["teacher", "distance_admin", "tmhrt_office_admin"],
  },
  // mezmur specific items will come later
];

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth();

  const visibleItems = navItems.filter(
    (item) =>
      item.roles.includes("*") || item.roles.some((role) => hasRole(role)),
  );

  return (
    <div className="h-screen bg-linear-to-b from-blue-800 to-blue-950 text-white flex flex-col">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-2xl font-bold">Church Admin</h1>
        <p className="text-blue-300 text-sm mt-1">Management System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-700 text-white"
                  : "text-blue-100 hover:bg-blue-800 hover:text-white"
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section + logout */}
      <div className="p-4 border-t border-blue-700">
        <div className="mb-3">
          <p className="font-medium">{user?.name || "User"}</p>
          <p className="text-sm text-blue-300">
            {user?.roles?.map((r) => r.name).join(" • ") || "No role"}
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-2 bg-red-600/80 hover:bg-red-700 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
