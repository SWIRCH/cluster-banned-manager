import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { config } from "./config";

interface PlatformUpdate {
  signature?: string;
  url: string;
}

interface LatestJson {
  version: string;
  notes: string;
  platforms: Record<string, PlatformUpdate>;
}

export interface AndroidUpdateInfo {
  version: string;
  notes: string;
  url: string;
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
  Проверяет наличие обновлений для Android.
  @returns {Promise<AndroidUpdateInfo | null>} Возвращает данные об обновлении или null, если обновлений нет.
 */
// export async function checkAndroidUpdate(): Promise<AndroidUpdateInfo | null> {
//   try {
//     const currentVersion = await getVersion();
//     const response = await fetch(config.UPDATER_URL);

//     if (!response.ok) return null;

//     const data: LatestJson = await response.json();
//     const latestVersion = data.version.replace(/^v/, "");

//     if (!isNewerVersion(latestVersion, currentVersion)) {
//       return null;
//     }

//     const androidPlatform =
//       data.platforms["android"] || data.platforms["android-apk"];

//     if (!androidPlatform || !androidPlatform.url) {
//       console.log(
//         `Версия ${data.version} выпущена только для Desktop. Пропускаем.`,
//       );
//       return null;
//     }

//     return {
//       version: latestVersion,
//       notes: data.notes,
//       url: androidPlatform.url,
//     };
//   } catch (error) {
//     console.error("Ошибка проверки обновлений:", error);
//     return null;
//   }
// }

export async function checkAndroidUpdate(): Promise<AndroidUpdateInfo | null> {
  // 🧪 ТЕСТОВЫЙ РЕЖИМ: Раскомментируй для проверки экрана обновления
  return {
    version: "9.9.9",
    notes:
      "• Добавлена секретная фича\n• Исправлены вылеты при запуске\n• Улучшена производительность",
    url: "https://example.com/build.apk",
  };

  /* Оригинальный код снизу временно не исполняется
  try {
    const currentVersion = await getVersion();
    ...
  */
}

export async function downloadAndroidUpdate(url: string) {
  await openUrl(url);
}
