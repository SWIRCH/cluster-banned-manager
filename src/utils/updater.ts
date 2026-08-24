// updater.ts

import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";

export interface AndroidUpdateInfo {
  version: string;
  notes: string;
  url: string;
}

interface LatestJson {
  version: string;
  notes: string;
  pub_date: string;
  platforms: Record<string, any>;
  android?: {
    url: string;
  };
}

function isNewerVersion(versionA: string, versionB: string): boolean {
  const partsA = versionA.split(".").map((n) => parseInt(n, 10) || 0);
  const partsB = versionB.split(".").map((n) => parseInt(n, 10) || 0);
  const maxLength = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLength; i++) {
    const valA = partsA[i] || 0;
    const valB = partsB[i] || 0;
    if (valA > valB) return true;
    if (valA < valB) return false;
  }
  return false;
}

/**
 * Проверяет наличие обновлений для Android через latest.json
 */
export async function checkAndroidUpdate(): Promise<AndroidUpdateInfo | null> {
  try {
    const currentVersion = await getVersion();
    console.log("[Updater] Current version:", currentVersion);

    const response = await fetch(
      "https://raw.githubusercontent.com/SWIRCH/cluster-banned-manager/main/latest.json",
    );

    if (!response.ok) {
      console.log("[Updater] Failed to fetch latest.json:", response.status);
      return null;
    }

    const data: LatestJson = await response.json();

    if (!data.android || !data.android.url) {
      console.log("[Updater] No Android version in this release");
      return null;
    }

    const latestVersion = data.version.replace(/^v/, "");

    if (!isNewerVersion(latestVersion, currentVersion)) {
      console.log("[Updater] Current version is up to date");
      return null;
    }

    console.log("[Updater] Update available:", latestVersion);

    return {
      version: latestVersion,
      notes: data.notes || "Новая версия доступна",
      url: data.android.url,
    };
  } catch (error) {
    console.error("[Updater] Error checking update:", error);
    return null;
  }
}

/**
 * Открывает ссылку для скачивания обновления
 */
export async function downloadAndroidUpdate(url: string) {
  try {
    await openUrl(url);
  } catch (error) {
    console.error("[Updater] Failed to open download URL:", error);
    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
  }
}
