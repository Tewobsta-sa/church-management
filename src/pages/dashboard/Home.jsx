import { useAuth } from "../../context/AuthContext";
import {
  Users,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Award,
} from "lucide-react";

export default function Home() {
  const { user, hasRole } = useAuth();

  const isOfficeAdmin =
    hasRole("gngnunet_office_admin") ||
    hasRole("young_gngnunet_admin") ||
    hasRole("mezmur_office_admin") ||
    hasRole("tmhrt_office_admin") ||
    hasRole("distance_admin");

  const isTeacher = hasRole("teacher");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0] || "User"}
        </h1>
        <p className="mt-1 text-gray-600">
          {isOfficeAdmin
            ? "Office Administrator"
            : isTeacher
              ? "Teacher / Trainer"
              : "User"}
        </p>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isOfficeAdmin && (
          <QuickCard
            icon={Users}
            title="Manage Students"
            description="Add, edit, promote students"
            color="blue"
            link="/students"
          />
        )}

        {(isOfficeAdmin || isTeacher) && (
          <QuickCard
            icon={CalendarClock}
            title="Class Assignments"
            description="View & manage scheduled sessions"
            color="indigo"
            link="/assignments"
          />
        )}

        {isTeacher && (
          <>
            <QuickCard
              icon={CheckCircle2}
              title="Take Attendance"
              description="Mark presence for today’s classes"
              color="green"
              link="/attendance"
            />
            <QuickCard
              icon={Award}
              title="Enter Grades"
              description="Input assessment results"
              color="purple"
              link="/grades"
            />
          </>
        )}

        {isOfficeAdmin && (
          <QuickCard
            icon={BookOpen}
            title="Courses & Sections"
            description="Manage curriculum structure"
            color="cyan"
            link="/courses"
          />
        )}
      </div>
    </div>
  );
}

function QuickCard({ icon: Icon, title, description, color, link }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400",
    indigo:
      "bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-400",
    green: "bg-green-50 text-green-700 border-green-200 hover:border-green-400",
    purple:
      "bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-400",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:border-cyan-400",
  };

  return (
    <a
      href={link}
      className={`block p-6 border rounded-xl transition-all hover:shadow-md hover:-translate-y-1 ${colors[color]}`}
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`p-3 rounded-lg ${colors[color].split(" ")[0]} bg-opacity-40`}
        >
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <p className="text-sm opacity-90">{description}</p>
    </a>
  );
}
