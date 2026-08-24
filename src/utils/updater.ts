// updater.ts

import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";

export interface AndroidUpdateInfo {
  version: string;
  notes: string;
  url: string;
}

interface GitHubRelease {
  tag_name: string;
  body: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
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
 * Проверяет наличие обновлений для Android через GitHub API
 */
export async function checkAndroidUpdate(): Promise<AndroidUpdateInfo | null> {
  try {
    const currentVersion = await getVersion();
    console.log("[Updater] Current version:", currentVersion);

    const releaseResponse = await fetch(
      "https://api.github.com/repos/SWIRCH/cluster-banned-manager/releases/latest",
    );

    if (!releaseResponse.ok) {
      console.log("[Updater] GitHub API error:", releaseResponse.status);
      return null;
    }

    const release: GitHubRelease = await releaseResponse.json();
    const latestVersion = release.tag_name.replace(/^v/, "");

    if (!isNewerVersion(latestVersion, currentVersion)) {
      console.log("[Updater] Current version is up to date");
      return null;
    }

    const apkAsset = release.assets.find((asset) =>
      asset.name.endsWith(".apk"),
    );

    if (!apkAsset) {
      console.log("[Updater] No APK found in latest release");
      return null;
    }

    console.log("[Updater] Update available:", latestVersion);

    return {
      version: latestVersion,
      notes: release.body || "Новая версия доступна",
      url: apkAsset.browser_download_url,
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
