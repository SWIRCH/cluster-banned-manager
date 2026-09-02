import App from "@/App"
import '@/lib/i18n'
import { logger } from '@/utils/logger'
import "@tauri-apps/api"
import React from "react"
import ReactDOM from "react-dom/client"

import("@/styles/primary.scss");

if (import.meta.env.PROD) {
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
}

if (typeof window !== "undefined") {
  logger.log("Window exists, checking Tauri...");
  logger.log("__TAURI__:", (window as any).__TAURI__);
  logger.log("__TAURI_INTERNALS__:", (window as any).__TAURI_INTERNALS__);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
