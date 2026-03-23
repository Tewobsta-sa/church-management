import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/auth/Login";
// import Setup from './pages/auth/Setup';   // ← we'll add this next

import AppLayout from "./components/layout/AppLayout";
import Home from "./pages/dashboard/Home";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          {/* <Route path="/setup" element={<Setup />} /> */}

          {/* Protected – everything inside AppLayout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            {/* More routes will be added here later:
                /students
                /assignments
                /attendance
                /grades
                /mezmur/...
            */}
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
