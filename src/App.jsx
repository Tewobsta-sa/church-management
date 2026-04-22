import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/auth/login";
import Setup from "./pages/auth/setup";
import Dashboard from "./pages/dashboard/Dashboard";
import StudentsList from "./pages/students/StudentsList";
import StudentPromotion from "./pages/students/StudentPromotion";
import UsersManagement from "./pages/superadmin/UsersManagement";
import CoursesManagement from "./pages/courses/CoursesManagement";
import AssignmentsTasks from "./pages/academic/AssignmentsTasks";
import LiveAttendance from "./pages/academic/LiveAttendance";
import Grades from "./pages/academic/Grades";
import ResultsDashboard from "./pages/academic/ResultsDashboard";
import ReportsHub from "./pages/academic/ReportsHub";
import MezmurMinistry from "./pages/mezmur/MezmurMinistry";
import AppLayout from "./components/layout/AppLayout";
import SectionsManagement from "./pages/sections/SectionsManagement";
import SecuritySettings from "./pages/admin/SecuritySettings";
import ForgotPassword from "./pages/auth/ForgotPassword";
import TeachersManagement from "./pages/academic/TeachersManagement";

const getPrimaryRole = (user) => user?.roles?.[0]?.name || null;

const getDefaultRouteForRole = (role) => {
  const roleRedirects = {
    super_admin: "/dashboard",
    gngnunet_office_admin: "/students",
    mezmur_office_admin: "/mezmur",
    tmhrt_office_admin: "/students",
    distance_admin: "/students",
    teacher: "/assignments",
  };

  return roleRedirects[role] || "/dashboard";
};

const hasAnyAllowedRole = (user, allowedRoles) => {
  if (!user) return false;
  if (user?.roles?.some((r) => r.name === "super_admin")) return true;
  return user?.roles?.some((r) => allowedRoles.includes(r.name));
};

// Public Route (Login)
function PublicRoute({ children }) {
  const { user, loading, isInitialized } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (isInitialized === false) {
    return <Navigate to="/setup" replace />;
  }

  if (user) {
    return <Navigate to={getDefaultRouteForRole(getPrimaryRole(user))} replace />;
  }

  return children;
}

// Protected Route
function ProtectedRoute({ children }) {
  const { user, loading, isInitialized } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (isInitialized === false) {
    return <Navigate to="/setup" replace />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Role-Specific Route
function RoleRoute({ children, allowedRoles }) {
  const { user, loading, isInitialized } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (isInitialized === false) {
    return <Navigate to="/setup" replace />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!hasAnyAllowedRole(user, allowedRoles)) {
    return <Navigate to={getDefaultRouteForRole(getPrimaryRole(user))} replace />;
  }

  return children;
}

// Setup Route
function SetupRoute({ children }) {
  const { isInitialized, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (isInitialized) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />

          {/* Setup */}
          <Route
            path="/setup"
            element={
              <SetupRoute>
                <Setup />
              </SetupRoute>
            }
          />

          {/* Protected Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* All protected pages go here */}
            <Route
              path="/users"
              element={
                <RoleRoute allowedRoles={["super_admin"]}>
                  <UsersManagement />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RoleRoute
                  allowedRoles={[
                    "super_admin",
                    "gngnunet_office_admin",
                    "mezmur_office_admin",
                    "tmhrt_office_admin",
                    "teacher",
                  ]}
                >
                  <Dashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/students"
              element={
                <RoleRoute
                  allowedRoles={[
                    "super_admin",
                    "gngnunet_office_admin",
                    "mezmur_office_admin",
                    "tmhrt_office_admin",
                  ]}
                >
                  <StudentsList />
                </RoleRoute>
              }
            />
            <Route
              path="/promotions"
              element={
                <RoleRoute allowedRoles={["super_admin", "gngnunet_office_admin", "tmhrt_office_admin"]}>
                  <StudentPromotion />
                </RoleRoute>
              }
            />
            <Route
              path="/teachers"
              element={
                <RoleRoute allowedRoles={["super_admin", "tmhrt_office_admin"]}>
                  <TeachersManagement />
                </RoleRoute>
              }
            />
            <Route
              path="/sections"
              element={
                <RoleRoute allowedRoles={["super_admin", "tmhrt_office_admin"]}>
                  <SectionsManagement />
                </RoleRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <RoleRoute allowedRoles={["super_admin", "tmhrt_office_admin"]}>
                  <CoursesManagement />
                </RoleRoute>
              }
            />
            <Route
              path="/assignments"
              element={
                <RoleRoute allowedRoles={["super_admin", "tmhrt_office_admin", "mezmur_office_admin", "teacher"]}>
                  <AssignmentsTasks />
                </RoleRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <RoleRoute allowedRoles={["super_admin", "tmhrt_office_admin", "mezmur_office_admin", "teacher"]}>
                  <LiveAttendance />
                </RoleRoute>
              }
            />
            <Route
              path="/grades"
              element={
                <RoleRoute allowedRoles={["super_admin", "teacher", "tmhrt_office_admin"]}>
                  <Grades />
                </RoleRoute>
              }
            />
            <Route
              path="/results"
              element={
                <RoleRoute allowedRoles={["super_admin", "tmhrt_office_admin"]}>
                  <ResultsDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/mezmur"
              element={
                <RoleRoute allowedRoles={["super_admin", "mezmur_office_admin"]}>
                  <MezmurMinistry />
                </RoleRoute>
              }
            />
            <Route
              path="/security"
              element={
                <ProtectedRoute>
                  <SecuritySettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <RoleRoute allowedRoles={["super_admin", "tmhrt_office_admin", "gngnunet_office_admin"]}>
                  <ReportsHub />
                </RoleRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
