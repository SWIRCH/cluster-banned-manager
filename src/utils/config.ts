import { isTauri } from "../lib/tauri";

export const config = {
  AUTHOR: "aysi",
  AUTHOR_LINK: "https://swirch.github.io/cluster-banned-manager/",
  UPDATER_URL:
    "https://github.com/SWIRCH/cluster-banned-manager/releases/latest/download/latest.json",
  GITHUB_URL: "https://github.com/SWIRCH/cluster-banned-manager/",
  BUILD: "release",
  NAME: "Cluster Banned Manager",
  BUNDLE_TYPE: "app",
  VERSION: "1.0.5",
  TAURI_VERSION: "2.0.0",
  BREACH: "main",
  WARP_FIX_LINK: "https://swirch.github.io/cluster-banned-manager/warp-fix/",
  DEBUG_MODE: true,
};

if (isTauri()) {
  import("@tauri-apps/api/app")
    .then(async (app) => {
      config.NAME = await app.getName();
      config.BUNDLE_TYPE = await app.getBundleType();
      config.VERSION = await app.getVersion();
      config.TAURI_VERSION = await app.getTauriVersion();
      console.debug("[CONFIG] Updated from Tauri:", config);
    })
    .catch((err) => {
      console.error("[CONFIG] Failed to load Tauri app metadata:", err);
    });
}
