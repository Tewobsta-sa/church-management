import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/inter";
import "./index.css"; 
import "./i18n.js";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register PWA service worker for mobile installation
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.log("SW registration error: ", err));
  });
}

