import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Forward API calls to Laravel. Host header is passed through
      // (no changeOrigin) so url() in Laravel returns URLs that route
      // back through this dev server — works on phones via LAN too.
      "/api": {
        target: "http://localhost:8000",
      },
      // Same-origin fallback for legacy /storage URLs during PDF capture
      "/storage": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "vendor";
            }
            if (id.includes("jspdf") || id.includes("html2canvas")) {
              return "pdf";
            }
            if (id.includes("recharts") || id.includes("d3-")) {
              return "charts";
            }
            if (id.includes("lucide-react")) {
              return "icons";
            }
          }
        },
      },
    },
  },
});
