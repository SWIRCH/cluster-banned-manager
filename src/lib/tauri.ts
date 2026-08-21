import { invoke as tauriInvoke } from "@tauri-apps/api/core";

// 1. Проверяем, запущено ли приложение внутри WebView Tauri
export const isTauri = (): boolean => {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
};

// 2. Универсальный безопасный invoke с поддержкой браузерных заглушек
export async function safeInvoke<T = any>(
  cmd: string,
  args?: Record<string, any>,
): Promise<T> {
  if (typeof window === "undefined") {
    throw new Error("Window is not defined");
  }

  // Если мы внутри Tauri — динамически импортируем родной invoke
  if (isTauri()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke<T>(cmd, args);
    } catch (err) {
      console.error(`[TAURI Error] Command '${cmd}' failed:`, err);
      throw err;
    }
  }

  // Если мы в обычном браузере — возвращаем заглушки (Mock)
  console.warn(`[BROWSER MOCK] Executing '${cmd}'`, args);
  return getMockResponse<T>(cmd, args);
}

// Псевдоним для совместимости
export const directInvoke = safeInvoke;

// 3. Таблица заглушек для браузерной верстки
function getMockResponse<T>(cmd: string, args?: Record<string, any>): T {
  switch (cmd) {
    case "test_tauri":
      return "OK (Browser Mock)" as T;
    case "is_process_running":
      return false as T;
    case "get_firewall_rules":
      return [] as T;
    case "update_firewall_rules":
    case "update_cluster_rules":
    case "clear_firewall_rules":
    case "launch_game":
    case "kill_process":
      return true as T;
    default:
      return null as T;
  }
}

// --- Экспортируемые функции для приложения ---

export async function diagnoseTauri() {
  const result: any = {
    timestamp: new Date().toISOString(),
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    hasWindow: typeof window !== "undefined",
    isTauriEnvironment: isTauri(),
    hasTauriInternals: !!(window as any)?.__TAURI_INTERNALS__,
    hasTauriGlobal: !!(window as any)?.__TAURI__,
  };

  try {
    const testResult = await safeInvoke("test_tauri");
    result.testInvoke = { success: true, result: testResult };
  } catch (error) {
    result.testInvoke = { success: false, error: String(error) };
  }

  return result;
}

export async function launchGame(appid: string | number) {
  return safeInvoke("launch_game", { appid: appid.toString() });
}

export async function isProcessRunning(name: string) {
  return safeInvoke("is_process_running", { name });
}

export async function killProcess(name: string) {
  return safeInvoke("kill_process", { name });
}

export async function updateFirewallRules(
  regionId: string,
  blockedDomains: string[],
  enable: boolean,
) {
  return safeInvoke("update_firewall_rules", {
    regionId,
    blockedDomains,
    enable,
  });
}

export async function updateClusterRules(
  regionId: string,
  blockedDomains: string[],
  enable: boolean,
  useHosts: boolean,
  useFirewall: boolean,
) {
  return safeInvoke("update_cluster_rules", {
    region_id: regionId,
    blocked_domains: blockedDomains,
    enable,
    use_hosts: useHosts,
    use_firewall: useFirewall,
  });
}

export async function getFirewallRules() {
  return safeInvoke("get_firewall_rules");
}

export async function clearFirewallRules() {
  return safeInvoke("clear_firewall_rules");
}
