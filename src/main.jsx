import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Let's test the CSS first
import { AuthProvider } from "./context/AuthContext.jsx"; // Keep this commented for now
import App from "./App.jsx"; // Keep this commented for now

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
