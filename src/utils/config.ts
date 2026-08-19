import {
  getVersion,
  getTauriVersion,
  getName,
  getBundleType,
} from "@tauri-apps/api/app";

export const config = {
  AUTHOR: "aysi",
  AUTHOR_LINK:
    "https://github.com/SWIRCH/https://swirch.github.io/cluster-banned-manager/",
  BUILD: "release",
  NAME: await getName(),
  BUNDLE_TYPE: await getBundleType(),
  VERSION: await getVersion(),
  TAURI_VERSION: await getTauriVersion(),
  BREACH: "clusterbannedmanager",
  WARP_FIX_LINK: "https://swirch.github.io/cluster-banned-manager/warp-fix/",
};
