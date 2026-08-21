import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// process.env.TAURI_DEV_HOST
const host = "127.0.0.1";

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: "192.168.0.100",
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "tauri-api": ["@tauri-apps/api"],
          "tauri-plugins": [
            "@tauri-apps/plugin-opener",
            "@tauri-apps/plugin-process",
            "@tauri-apps/plugin-updater",
          ],
          vendor: ["react", "react-dom", "framer-motion"],
        },
      },
    },
  },
  chunkSizeWarningLimit: 800,
}));
