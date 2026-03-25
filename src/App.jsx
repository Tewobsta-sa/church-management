import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/auth/login";
import Setup from "./pages/auth/setup"; // now imported
import Dashboard from "./pages/dashboard/Dashboard";
import AppLayout from "./components/layout/AppLayout";

// Wrapper for public routes
function PublicRoute({ children }) {
  const { user, loading, isInitialized } = useAuth();

  if (loading) return <p>Loading...</p>;

  // If system not initialized → redirect to setup
  if (isInitialized === false) return <Navigate to="/setup" replace />;

  // If logged in → redirect to dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  return children;
}

// Wrapper for protected routes
function ProtectedRoute({ children }) {
  const { user, loading, isInitialized } = useAuth();

  if (loading) return <p>Loading...</p>;

  // System not initialized → force setup
  if (isInitialized === false) return <Navigate to="/setup" replace />;

  // Not logged in → redirect to login
  if (!user) return <Navigate to="/" replace />;

  return children;
}

// Setup route wrapper
function SetupRoute({ children }) {
  const { isInitialized, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  // If system already initialized → go to login/dashboard
  if (isInitialized) return <Navigate to="/" replace />;

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Setup page */}
          <Route
            path="/setup"
            element={
              <SetupRoute>
                <Setup />
              </SetupRoute>
            }
          />

          {/* Protected – everything inside AppLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Add more protected routes here */}
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
