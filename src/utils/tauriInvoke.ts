export async function safeInvoke<T = any>(
  cmd: string,
  args?: Record<string, any>
): Promise<T> {
  if (typeof window === "undefined") throw new Error("Window is not defined");

  try {
    const core = await import("@tauri-apps/api/core");
    const { invoke } = core as any;
    console.debug(`[TAURI] Invoking (core): ${cmd}`, args);

    try {
      return await invoke(cmd, args);
    } catch (invokeErr) {
      if (typeof args !== "undefined") {
        try {
          console.debug("[TAURI] Retrying invoke with { args }");
          return await invoke(cmd, { args });
        } catch (invokeErr2) {
          console.error("[TAURI] core.invoke retry failed:", invokeErr2);
        }
      }
      throw invokeErr;
    }
  } catch (err) {
    console.warn(
      "[TAURI] core import/invoke failed, falling back to __TAURI_INTERNALS__:",
      err
    );

    const internals = (window as any).__TAURI_INTERNALS__;
    if (internals?.invoke) {
      console.debug(`[TAURI] Invoking (internals): ${cmd}`, args);
      try {
        return await internals.invoke(cmd, args);
      } catch (e1) {
        try {
          console.debug("[TAURI] Retrying internals.invoke with { args }");
          return await internals.invoke(cmd, { args });
        } catch (e2) {
          console.error("[TAURI] internals.invoke retries failed", e1, e2);
          throw e2;
        }
      }
    }

    throw new Error("Tauri API not available");
  }
}

export async function directInvoke<T = any>(
  cmd: string,
  args?: Record<string, any>
): Promise<T> {
  const core = await import("@tauri-apps/api/core");
  const { invoke } = core as any;

  console.debug(`[DIRECT INVOKE] ${cmd}`, args);
  return await invoke(cmd, args);
}

export async function diagnoseTauri() {
  const result: any = {
    timestamp: new Date().toISOString(),
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    hasWindow: typeof window !== "undefined",
    hasTauriInternals: !!(window as any).__TAURI_INTERNALS__,
    hasTauriGlobal: !!(window as any).__TAURI__,
  };

  try {
    const testResult = await safeInvoke("test_tauri");
    result.testInvoke = {
      success: true,
      result: testResult,
    };
  } catch (error) {
    result.testInvoke = {
      success: false,
      error: String(error),
    };
  }

  return result;
}

export async function launchGame(appid: string) {
  return safeInvoke("launch_game", { appid });
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
  enable: boolean
) {
  console.log("[updateFirewallRules] Function called with:", {
    regionId,
    blockedDomains,
    enable,
  });

  try {
    const core = await import("@tauri-apps/api/core");
    const { invoke } = core as any;
    console.log("[updateFirewallRules] Core imported, calling invoke...");

    const result = await invoke("update_firewall_rules", {
      regionId: regionId,
      blockedDomains: blockedDomains,
      enable: enable,
    });

    console.log("[updateFirewallRules] Invoke successful:", result);
    return result;
  } catch (error) {
    console.error("[updateFirewallRules] Invoke failed:", error);
    throw error;
  }
}

export async function updateClusterRules(
  regionId: string,
  blockedDomains: string[],
  enable: boolean,
  useHosts: boolean,
  useFirewall: boolean
) {
  return await directInvoke("update_cluster_rules", {
    region_id: regionId,
    blocked_domains: blockedDomains,
    enable: enable,
    use_hosts: useHosts,
    use_firewall: useFirewall,
  });
}

export async function getFirewallRules() {
  return await directInvoke("get_firewall_rules");
}

export async function clearFirewallRules() {
  return await directInvoke("clear_firewall_rules");
}
