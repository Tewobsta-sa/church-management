import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import AppLayout from "./components/layout/AppLayout";
import PwaInstallPrompt from "./components/common/PwaInstallPrompt";

// Lazy-loaded pages for optimal performance and chunk splitting
const Login = lazy(() => import("./pages/auth/login"));
const Setup = lazy(() => import("./pages/auth/setup"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const StudentsList = lazy(() => import("./pages/students/StudentsList"));
const StudentPromotion = lazy(() => import("./pages/students/StudentPromotion"));
const UsersManagement = lazy(() => import("./pages/superadmin/UsersManagement"));
const SystemLogsViewer = lazy(() => import("./pages/superadmin/SystemLogsViewer"));
const CoursesManagement = lazy(() => import("./pages/courses/CoursesManagement"));
const AssignmentsTasks = lazy(() => import("./pages/academic/AssignmentsTasks"));
const LiveAttendance = lazy(() => import("./pages/academic/LiveAttendance"));
const Grades = lazy(() => import("./pages/academic/Grades"));
const ResultsDashboard = lazy(() => import("./pages/academic/ResultsDashboard"));
const ReportsHub = lazy(() => import("./pages/academic/ReportsHub"));
const MezmurMinistry = lazy(() => import("./pages/mezmur/MezmurMinistry"));
const SectionsManagement = lazy(() => import("./pages/sections/SectionsManagement"));
const SecuritySettings = lazy(() => import("./pages/admin/SecuritySettings"));
const TeachersManagement = lazy(() => import("./pages/academic/TeachersManagement"));
const MobileAttendanceScanner = lazy(() => import("./pages/academic/MobileAttendanceScanner"));
const MobileAttendanceViewer = lazy(() => import("./pages/academic/MobileAttendanceViewer"));

// Page Loading Spinner Fallback
const PageLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
    <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-3"></div>
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
      እባክዎ ይጠብቁ... (Loading...)
    </p>
  </div>
);

export const getPrimaryRole = (user) => {
  if (user?.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    return typeof user.roles[0] === "string"
      ? user.roles[0]
      : user.roles[0]?.name;
  }
  return user?.role || null;
};

export const getDefaultRouteForRole = (role) => {
  const roleRedirects = {
    super_admin: "/dashboard",
    yesew_habt: "/students",
    tmhrt_kfl: "/students",
    mezmur_kfl: "/mezmur",
    mereja_kfl: "/dashboard",
  };

  return roleRedirects[role] || "/dashboard";
};

const hasAnyAllowedRole = (user, allowedRoles) => {
  if (!user) return false;
  const userRoles = [];
  if (user.roles && Array.isArray(user.roles)) {
    user.roles.forEach((r) => {
      userRoles.push(typeof r === "string" ? r : r?.name);
    });
  }
  if (user.role && !userRoles.includes(user.role)) {
    userRoles.push(user.role);
  }
  if (userRoles.includes("super_admin")) return true;
  return userRoles.some((r) => allowedRoles.includes(r));
};

// Public Route (Login, Forgot Password)
function PublicRoute({ children }) {
  const { user, loading, isInitialized } = useAuth();

  if (loading) return <PageLoader />;

  if (isInitialized === false) {
    return <Navigate to="/setup" replace />;
  }

  if (user) {
    return (
      <Navigate to={getDefaultRouteForRole(getPrimaryRole(user))} replace />
    );
  }

  return children;
}

// Protected Route
function ProtectedRoute({ children }) {
  const { user, loading, isInitialized } = useAuth();

  if (loading) return <PageLoader />;

  if (isInitialized === false) {
    return <Navigate to="/setup" replace />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Role-Specific Route (Strictly enforces canonical 5 roles)
function RoleRoute({ children, allowedRoles }) {
  const { user, loading, isInitialized } = useAuth();

  if (loading) return <PageLoader />;

  if (isInitialized === false) {
    return <Navigate to="/setup" replace />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!hasAnyAllowedRole(user, allowedRoles)) {
    return (
      <Navigate to={getDefaultRouteForRole(getPrimaryRole(user))} replace />
    );
  }

  return children;
}

// Setup Route
function SetupRoute({ children }) {
  const { isInitialized, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (isInitialized) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/login"
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

              {/* Initial Setup Route */}
              <Route
                path="/setup"
                element={
                  <SetupRoute>
                    <Setup />
                  </SetupRoute>
                }
              />

              {/* Protected App Layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* 1. Dashboard (Available to all 5 roles) */}
                <Route
                  path="/dashboard"
                  element={
                    <RoleRoute
                      allowedRoles={[
                        "super_admin",
                        "yesew_habt",
                        "tmhrt_kfl",
                        "mezmur_kfl",
                        "mereja_kfl",
                      ]}
                    >
                      <Dashboard />
                    </RoleRoute>
                  }
                />

                {/* 2. User Administration & Audit Logs (Super Admin Only) */}
                <Route
                  path="/users"
                  element={
                    <RoleRoute allowedRoles={["super_admin"]}>
                      <UsersManagement />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/logs"
                  element={
                    <RoleRoute allowedRoles={["super_admin"]}>
                      <SystemLogsViewer />
                    </RoleRoute>
                  }
                />

                {/* 3. Students Management (All 5 roles) */}
                <Route
                  path="/students"
                  element={
                    <RoleRoute
                      allowedRoles={[
                        "super_admin",
                        "yesew_habt",
                        "tmhrt_kfl",
                        "mezmur_kfl",
                        "mereja_kfl",
                      ]}
                    >
                      <StudentsList />
                    </RoleRoute>
                  }
                />

                {/* 4. Student Promotions Workflow (super_admin, yesew_habt, tmhrt_kfl, mereja_kfl) */}
                <Route
                  path="/promotions"
                  element={
                    <RoleRoute
                      allowedRoles={[
                        "super_admin",
                        "yesew_habt",
                        "tmhrt_kfl",
                        "mereja_kfl",
                      ]}
                    >
                      <StudentPromotion />
                    </RoleRoute>
                  }
                />

                {/* 5. Teachers Management */}
                <Route
                  path="/teachers"
                  element={
                    <RoleRoute
                      allowedRoles={[
                        "super_admin",
                        "yesew_habt",
                        "tmhrt_kfl",
                        "mereja_kfl",
                      ]}
                    >
                      <TeachersManagement />
                    </RoleRoute>
                  }
                />

                {/* 6. Sections Management */}
                <Route
                  path="/sections"
                  element={
                    <RoleRoute
                      allowedRoles={["super_admin", "tmhrt_kfl", "mereja_kfl"]}
                    >
                      <SectionsManagement />
                    </RoleRoute>
                  }
                />

                {/* 7. Courses Management */}
                <Route
                  path="/courses"
                  element={
                    <RoleRoute
                      allowedRoles={["super_admin", "tmhrt_kfl", "mereja_kfl"]}
                    >
                      <CoursesManagement />
                    </RoleRoute>
                  }
                />

                {/* 8. Schedules & Tasks */}
                <Route
                  path="/assignments"
                  element={
                    <RoleRoute
                      allowedRoles={[
                        "super_admin",
                        "yesew_habt",
                        "tmhrt_kfl",
                        "mezmur_kfl",
                        "mereja_kfl",
                      ]}
                    >
                      <AssignmentsTasks />
                    </RoleRoute>
                  }
                />

                {/* 9. Attendance */}
                <Route
                  path="/attendance"
                  element={
                    <RoleRoute
                      allowedRoles={[
                        "super_admin",
                        "yesew_habt",
                        "tmhrt_kfl",
                        "mezmur_kfl",
                        "mereja_kfl",
                      ]}
                    >
                      <LiveAttendance />
                    </RoleRoute>
                  }
                />

                {/* 10. Grading */}
                <Route
                  path="/grades"
                  element={
                    <RoleRoute
                      allowedRoles={["super_admin", "tmhrt_kfl", "mereja_kfl"]}
                    >
                      <Grades />
                    </RoleRoute>
                  }
                />

                {/* 11. Academic Results Dashboard */}
                <Route
                  path="/results"
                  element={
                    <RoleRoute
                      allowedRoles={["super_admin", "tmhrt_kfl", "mereja_kfl"]}
                    >
                      <ResultsDashboard />
                    </RoleRoute>
                  }
                />

                {/* 12. Mezmur Ministry */}
                <Route
                  path="/mezmur"
                  element={
                    <RoleRoute
                      allowedRoles={[
                        "super_admin",
                        "mezmur_kfl",
                        "yesew_habt",
                        "mereja_kfl",
                      ]}
                    >
                      <MezmurMinistry />
                    </RoleRoute>
                  }
                />

                {/* 13. Reports Hub */}
                <Route
                  path="/reports"
                  element={
                    <RoleRoute
                      allowedRoles={[
                        "super_admin",
                        "tmhrt_kfl",
                        "yesew_habt",
                        "mezmur_kfl",
                        "mereja_kfl",
                      ]}
                    >
                      <ReportsHub />
                    </RoleRoute>
                  }
                />

                {/* 14. Attendance QR Scanner */}
                <Route
                  path="/attendance/scanner"
                  element={
                    <RoleRoute
                      allowedRoles={[
                        "super_admin",
                        "yesew_habt",
                        "tmhrt_kfl",
                        "mezmur_kfl",
                        "mereja_kfl",
                      ]}
                    >
                      <MobileAttendanceScanner />
                    </RoleRoute>
                  }
                />

                {/* 15. Mobile Attendance Viewer */}
                <Route
                  path="/attendance/mobile-viewer"
                  element={
                    <RoleRoute
                      allowedRoles={[
                        "super_admin",
                        "yesew_habt",
                        "tmhrt_kfl",
                        "mezmur_kfl",
                        "mereja_kfl",
                      ]}
                    >
                      <MobileAttendanceViewer />
                    </RoleRoute>
                  }
                />

                {/* 16. Security Settings (All Authenticated Users) */}
                <Route
                  path="/security"
                  element={
                    <ProtectedRoute>
                      <SecuritySettings />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Standalone Fullscreen Mobile PWA Routes */}
              <Route
                path="/mobile/scanner"
                element={
                  <ProtectedRoute>
                    <MobileAttendanceScanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mobile/viewer"
                element={
                  <ProtectedRoute>
                    <MobileAttendanceViewer />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <PwaInstallPrompt />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
