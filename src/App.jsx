import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/auth/login";
import Setup from "./pages/auth/setup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/dashboard/Dashboard";
import StudentsList from "./pages/students/StudentsList";
import StudentPromotion from "./pages/students/StudentPromotion";
import UsersManagement from "./pages/superadmin/UsersManagement";
import CoursesManagement from "./pages/courses/CoursesManagement";
import AssignmentsTasks from "./pages/academic/AssignmentsTasks";
import LiveAttendance from "./pages/academic/LiveAttendance";
import Grades from "./pages/academic/Grades";
import MezmurMinistry from "./pages/mezmur/MezmurMinistry";
import AppLayout from "./components/layout/AppLayout";
import SectionsManagement from "./pages/sections/SectionsManagement";

const getPrimaryRole = (user) => user?.roles?.[0]?.name || null;

const getDefaultRouteForRole = (role) => {
  const roleRedirects = {
    super_admin: "/dashboard",
    gngnunet_office_admin: "/students",
    young_gngnunet_admin: "/students",
    mezmur_office_admin: "/mezmur",
    tmhrt_office_admin: "/assignments",
    teacher: "/assignments",
    distance_admin: "/students",
    young_tmhrt_admin: "/assignments",
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

          {/* Setup */}
          <Route
            path="/setup"
            element={
              <SetupRoute>
                <Setup />
              </SetupRoute>
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
                    "young_gngnunet_admin",
                    "mezmur_office_admin",
                    "tmhrt_office_admin",
                    "teacher",
                    "distance_admin",
                    "young_tmhrt_admin",
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
                    "young_gngnunet_admin",
                    "mezmur_office_admin",
                    "tmhrt_office_admin",
                    "distance_admin",
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
              path="/sections"
              element={
                <RoleRoute allowedRoles={["super_admin", "tmhrt_office_admin", "distance_admin"]}>
                  <SectionsManagement />
                </RoleRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <RoleRoute allowedRoles={["super_admin", "tmhrt_office_admin", "distance_admin"]}>
                  <CoursesManagement />
                </RoleRoute>
              }
            />
            <Route
              path="/assignments"
              element={
                <RoleRoute allowedRoles={["super_admin", "tmhrt_office_admin", "mezmur_office_admin", "teacher", "distance_admin", "young_tmhrt_admin"]}>
                  <AssignmentsTasks />
                </RoleRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <RoleRoute allowedRoles={["tmhrt_office_admin", "mezmur_office_admin", "teacher", "distance_admin", "young_tmhrt_admin"]}>
                  <LiveAttendance />
                </RoleRoute>
              }
            />
            <Route
              path="/grades"
              element={
                <RoleRoute allowedRoles={["super_admin", "teacher", "tmhrt_office_admin", "distance_admin", "young_tmhrt_admin"]}>
                  <Grades />
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
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
