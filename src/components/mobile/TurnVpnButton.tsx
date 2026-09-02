import { useAppStore } from "@/store/useAppStore"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, Power, Save } from "lucide-react"

export type VpnStatus = "On" | "Off" | "Loading" | "NeedsApply" | "Error";

type TurnVpnButtonProps = {
  status?: VpnStatus;
  errorMessage?: string;
  hostsMismatch: boolean;
  onToggle?: () => Promise<void> | void;
  onUpdateClick?: () => Promise<void> | void;
};

const STATUS_CONFIG: Record<VpnStatus, { label: string; className: string }> = {
  Off: {
    label: "Блокировка выключена",
    className: "text-zinc-400",
  },
  NeedsApply: {
    label: "Нажмите для применения изменений",
    className: "text-amber-400 font-medium animate-pulse",
  },
  Loading: {
    label: "Подключение...",
    className: "text-blue-400 animate-pulse",
  },
  On: {
    label: "Блокировка включена",
    className: "text-emerald-400",
  },
  Error: {
    label: "Ошибка подключения",
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
  const { vpnStatus, setVpnStatus } = useAppStore();
  const baseStatus = propStatus ?? vpnStatus ?? "Off";
  const currentStatus = hostsMismatch ? "NeedsApply" : baseStatus;

  const handleToggle = async () => {
    if (currentStatus === "Loading") return;

    if (hostsMismatch || currentStatus === "Error") {
      setVpnStatus("Loading");
      try {
        if (onUpdateClick) {
          await onUpdateClick();
        }
        setVpnStatus("Off");
      } catch (err) {
        console.error("Update failed:", err);
        setVpnStatus("Error");
      }
      return;
    }

    if (onToggle) {
      setVpnStatus("Loading");
      try {
        await onToggle();
        // После успешного toggle - проверяем статус
        // Если статус не изменился в onToggle, сбрасываем в Off
        const current = useAppStore.getState().vpnStatus;
        if (current === "Loading") {
          setVpnStatus("Off");
        }
      } catch (err) {
        console.error("Toggle failed:", err);
        setVpnStatus("Error");
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

        {/* Анимированная плашка с текстом */}
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
                : statusInfo.label}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
