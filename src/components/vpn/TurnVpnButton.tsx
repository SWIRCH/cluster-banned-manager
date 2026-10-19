import { syncVpnStatus, withVpnAction } from "@/lib/vpn";
import { useAppStore } from "@/store/useAppStore";
import { logger } from "@/utils/logger";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Power, Save } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

export type VpnStatus = "On" | "Off" | "Loading" | "NeedsApply" | "Error";

type TurnVpnButtonProps = {
  status?: VpnStatus;
  errorMessage?: string;
  hostsMismatch: boolean;
  onToggle?: () => Promise<void> | void;
  onUpdateClick?: () => Promise<void> | void;
};

const STATUS_CONFIG: Record<
  VpnStatus,
  {
    labelKey:
      | "vpn.off"
      | "vpn.needs_apply"
      | "vpn.loading"
      | "vpn.on"
      | "vpn.error";
    className: string;
  }
> = {
  Off: {
    labelKey: "vpn.off",
    className: "text-zinc-400",
  },
  NeedsApply: {
    labelKey: "vpn.needs_apply",
    className: "text-amber-400 font-medium animate-pulse",
  },
  Loading: {
    labelKey: "vpn.loading",
    className: "text-blue-400 animate-pulse",
  },
  On: {
    labelKey: "vpn.on",
    className: "text-emerald-400",
  },
  Error: {
    labelKey: "vpn.error",
    className: "text-rose-500 font-medium",
  },
};

export default function TurnVpnButton({
  status: propStatus,
  errorMessage,
  hostsMismatch,
  onToggle,
  onUpdateClick,
}: TurnVpnButtonProps) {
  const { t } = useTranslation();
  const busyRef = useRef(false);
  const { vpnStatus, setVpnStatus } = useAppStore();
  const baseStatus = propStatus ?? vpnStatus ?? "Off";

  const currentStatus: VpnStatus =
    baseStatus === "Loading"
      ? "Loading"
      : hostsMismatch
        ? "NeedsApply"
        : baseStatus;

  const handleToggle = async () => {
    if (busyRef.current || currentStatus === "Loading") return;
    busyRef.current = true;
    setVpnStatus("Loading");
    try {
      const action =
        currentStatus === "NeedsApply" || currentStatus === "Error"
          ? onUpdateClick
          : onToggle;
      await withVpnAction(async () => {
        await action?.();
      });
    } catch (err) {
      logger.error("VPN action failed:", err);
      setVpnStatus("Error");
    } finally {
      busyRef.current = false;
      if (useAppStore.getState().vpnStatus === "Loading") {
        await syncVpnStatus();
      }
    }
  };

  const statusInfo = STATUS_CONFIG[currentStatus];

  return (
    <div className="turn-vpn-button">
      <div className="flex flex-col items-center">
        <div
          className="container flex w-full items-center justify-center"
          data-state={currentStatus}
        >
          <div className="button-wrapper">
            <AnimatePresence>
              {currentStatus === "Loading" && (
                <motion.div
                  key="loading-ring-wrapper"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="loading-ring-container"
                >
                  <svg className="loading-ring-svg" viewBox="0 0 116 116">
                    <circle
                      className="ring-path"
                      cx="58"
                      cy="58"
                      r="54"
                      fill="none"
                      strokeWidth="4"
                    />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              className="button"
              data-state={currentStatus}
              onClick={handleToggle}
              disabled={currentStatus === "Loading"}
              whileTap={{ scale: currentStatus === "Loading" ? 1 : 0.93 }}
              aria-label="Toggle VPN"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStatus}
                  initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.6, rotate: 15 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStatus === "NeedsApply" ? (
                    <Save size={48} strokeWidth={1.8} />
                  ) : currentStatus === "Error" ? (
                    <AlertCircle size={52} strokeWidth={1.5} />
                  ) : (
                    <Power size={52} strokeWidth={1.5} />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
          <object className="blum-epilis" />
        </div>

        <div className="mt-5 h-6 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentStatus + (errorMessage || "")}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`text-sm tracking-wide ${statusInfo.className}`}
            >
              {currentStatus === "Error" && errorMessage
                ? errorMessage
                : t(statusInfo.labelKey)}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
