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
import MezmurMinistry from "./pages/mezmur/MezmurMinistry";
import AppLayout from "./components/layout/AppLayout";
import SectionsManagement from "./pages/sections/SectionsManagement";

// Public Route (Login)
function PublicRoute({ children }) {
  const { user, loading, isInitialized } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (isInitialized === false) {
    return <Navigate to="/setup" replace />;
  }

  if (user) {
    const role = user?.roles?.[0]?.name;

    console.log("Role:", role);
    if (role === "super_admin") {
      return <Navigate to="/users" replace />;
    }
    else if (role === "gngnunet_office_admin") {
      return <Navigate to="/students" replace />;
    }
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

          {/* Protected Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* All protected pages go here */}
            <Route path="/users" element={<UsersManagement />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<StudentsList />} />
            <Route path="/promotions" element={<StudentPromotion />} />
            <Route path="/sections" element={<SectionsManagement />} />
            <Route path="/courses" element={<CoursesManagement />} />
            <Route path="/assignments" element={<AssignmentsTasks />} />
            <Route path="/attendance" element={<LiveAttendance />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="/mezmur" element={<MezmurMinistry />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
