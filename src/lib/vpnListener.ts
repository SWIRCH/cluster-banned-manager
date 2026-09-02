import { logger } from '@/utils/logger'
import { useAppStore } from "../store/useAppStore"
import { isTauri, safeInvoke } from "./tauri"

export const syncVpnStatus = async () => {
  if (!isTauri()) return;

  try {
    const res = await safeInvoke<{ state: string; domains?: string[] }>(
      "plugin:cluster-vpn|status",
    );

    if (res?.state === "off") {
      useAppStore.getState().setVpnStatus("Off");
      useAppStore.getState().setVpnDomains([]);
    } else if (res?.state === "on") {
      useAppStore.getState().setVpnStatus("On");
      if (res.domains) useAppStore.getState().setVpnDomains(res.domains);
    } else if (res?.state === "error") {
      useAppStore.getState().setVpnStatus("Error");
    }
  } catch (e) {}
};

if (typeof window !== "undefined" && isTauri()) {
  syncVpnStatus();

  window.addEventListener("focus", () => {
    logger.log("[VPN] Window focused, syncing...");
    syncVpnStatus();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      console.log("[VPN] Page visible, syncing...");
      syncVpnStatus();
    }
  });

  setInterval(() => {
    syncVpnStatus();
  }, 3000);
}
