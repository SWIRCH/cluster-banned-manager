import clustersDataLocal from "../data/servers.json";
import { showGlobalError } from "./globalError";
import { config } from "../utils/config";

export const LOCAL_CLUSTERS = clustersDataLocal;

const GITHUB_URL =
  "https://raw.githubusercontent.com/SWIRCH/cluster-banned-manager/refs/heads/main/src/data/servers.json";

export async function loadClustersFromGitHub() {
  try {
    if (config.DEBUG_MODE === true) return null;

    const response = await fetch(GITHUB_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ GitHub load failed:", errorMsg);

    showGlobalError(
      "Ошибка загрузки данных",
      "Не удалось загрузить список серверов с GitHub. Используется локальная версия.",
      errorMsg,
      () => window.location.reload(), // кнопка "Повторить"
    );

    return null;
  }
}

export async function loadClustersFromLocal() {
  try {
    console.log("🔄 Загрузка локальных данных...");
    const module = await import("../data/servers.json");
    console.log("✅ Локальные данные загружены");
    return module.default;
  } catch (error) {
    console.error("❌ Local load failed:", error);
    return LOCAL_CLUSTERS;
  }
}
