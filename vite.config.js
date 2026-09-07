import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Same-origin fallback for legacy /storage URLs during PDF capture
      "/storage": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
