// Простая версия для Tauri 2.x
export async function safeInvoke<T = any>(
  cmd: string,
  args?: Record<string, any>
): Promise<T> {
  // Verify window
  if (typeof window === "undefined") throw new Error("Window is not defined");

  // Try the modern core API first
  try {
    const core = await import("@tauri-apps/api/core");
    const { invoke } = core as any;
    console.debug(`[TAURI] Invoking (core): ${cmd}`, args);

    // Primary attempt: invoke(cmd, args)
    try {
      return await invoke(cmd, args);
    } catch (invokeErr) {
      // Some runtimes expect the payload wrapped as { args: ... }
      if (typeof args !== "undefined") {
        try {
          console.debug("[TAURI] Retrying invoke with { args }");
          return await invoke(cmd, { args });
        } catch (invokeErr2) {
          // Fall through to surface original error
          console.error("[TAURI] core.invoke retry failed:", invokeErr2);
        }
      }
      // Re-throw the original invoke error to surface it
      throw invokeErr;
    }
  } catch (err) {
    console.warn(
      "[TAURI] core import/invoke failed, falling back to __TAURI_INTERNALS__:",
      err
    );

    // Fallback: try the internal invoke with a couple of shapes
    const internals = (window as any).__TAURI_INTERNALS__;
    if (internals?.invoke) {
      console.debug(`[TAURI] Invoking (internals): ${cmd}`, args);
      try {
        return await internals.invoke(cmd, args);
      } catch (e1) {
        // try wrapper
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

// Упрощенная диагностика
export async function diagnoseTauri() {
  const result: any = {
    timestamp: new Date().toISOString(),
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    hasWindow: typeof window !== "undefined",
    hasTauriInternals: !!(window as any).__TAURI_INTERNALS__,
    hasTauriGlobal: !!(window as any).__TAURI__,
  };

  // Пробуем вызвать тестовую команду
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

// Game launch / process helpers
export async function launchGame(appid: string) {
  return safeInvoke("launch_game", { appid });
}

export async function isProcessRunning(name: string) {
  return safeInvoke("is_process_running", { name });
}

export async function killProcess(name: string) {
  return safeInvoke("kill_process", { name });
}
