import React from "react";
import ReactDOM from "react-dom/client";
import App from "../App/App";
import "../Styles/primary.scss";
import "@tauri-apps/api";
import { config } from "../utils/config";

if (typeof window !== "undefined") {
  if (config.DEBUG_MODE) {
    console.log("Window exists, checking Tauri...");
    console.log("__TAURI__:", (window as any).__TAURI__);
    console.log("__TAURI_INTERNALS__:", (window as any).__TAURI_INTERNALS__);
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
