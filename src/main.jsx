import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/inter";
import "./index.css"; 
import "./i18n.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);

// Register PWA service worker for mobile installation
if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.log("SW registration error: ", err));
  });
}

