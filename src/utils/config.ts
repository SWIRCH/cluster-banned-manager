import {
  getVersion,
  getTauriVersion,
  getName,
  getBundleType,
} from "@tauri-apps/api/app";

export const config = {
  AUTHOR: "aysi",
  AUTHOR_LINK: "https://github.com/SWIRCH/cluster-banned-manager",
  BUILD: "release",
  NAME: await getName(),
  BUNDLE_TYPE: await getBundleType(),
  VERSION: await getVersion(),
  TAURI_VERSION: await getTauriVersion(),
  BREACH: "clusterbannedmanager",
};
