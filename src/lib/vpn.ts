import { isTauri, vpnStatus } from "@/lib/tauri";
import { useAppStore } from "@/store/useAppStore";
import { logger } from "@/utils/logger";

let actionsInFlight = 0;

/** Оборачиваем start/stop/apply, чтобы sync не мешал им. */
export async function withVpnAction<T>(fn: () => Promise<T>): Promise<T> {
  actionsInFlight++;
  try {
    return await fn();
  } finally {
    actionsInFlight--;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const syncVpnStatus = async () => {
  if (!isTauri() || actionsInFlight > 0) return;

  const { setVpnStatus, setVpnDomains } = useAppStore.getState();

  try {
    let s = await vpnStatus();

    for (
      let i = 0;
      (s.state === "starting" || s.state === "stopping") && i < 10;
      i++
    ) {
      await sleep(300);
      s = await vpnStatus();
    }

    if (actionsInFlight > 0) return;

    switch (s.state) {
      case "on":
        setVpnStatus("On");
        setVpnDomains(s.domains);
        break;
      case "off":
      case "unsupported":
        setVpnStatus("Off");
        setVpnDomains([]);
        break;
      case "needsPermission":
        setVpnStatus("NeedsApply");
        break;
      default:
        setVpnStatus("Error");
    }
  } catch (e) {
    logger.error("syncVpnStatus failed:", e);
    setVpnStatus("Error");
  }
};
