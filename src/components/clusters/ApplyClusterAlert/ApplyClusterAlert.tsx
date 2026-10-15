import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks";
import { cn } from "@/lib/utils";
import { Region } from "@/types";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, X } from "lucide-react";
import { Ref, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.scss";

type ApplyClusterAlertProps = {
  ref?: Ref<HTMLDivElement>;
  selectedRegion?: Region | null;
  lastTauriError: string | null;
  allBlockedDomains: string[] | null;
  hostsMismatch: boolean;
  mismatchDomains: string[];
  onUpdate: () => void;
  onCancel: () => void;
};

export default function ApplyClusterAlert({
  ref,
  hostsMismatch,
  mismatchDomains,
  selectedRegion,
  allBlockedDomains,
  lastTauriError,
  onUpdate,
  onCancel,
}: ApplyClusterAlertProps) {
  const { t } = useTranslation();
  const [copiedError, setCopiedError] = useState<boolean>(false);
  const isMobile = useIsMobile();
  const showAlert = hostsMismatch && !isMobile;

  const { blocked, unBlocked } = useMemo(() => {
    const allBlockedSet = new Set(allBlockedDomains);
    return {
      blocked: mismatchDomains.filter((d) => allBlockedSet.has(d)),
      unBlocked: mismatchDomains.filter((d) => !allBlockedSet.has(d)),
    };
  }, [allBlockedDomains, mismatchDomains]);

  const handleCopyError = async () => {
    if (!lastTauriError) return;

    await writeText(
      typeof lastTauriError === "string"
        ? lastTauriError
        : JSON.stringify(lastTauriError, null, 2),
    );

    setCopiedError(true);
    setTimeout(() => setCopiedError(false), 2000);
  };

  const onCloseError = () => {
    onCancel();
  };

  return (
    <AnimatePresence>
      {showAlert && selectedRegion && hostsMismatch && (
        <motion.div
          key="apply-alert"
          ref={ref}
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{
            opacity: 0,
            y: 12,
            scale: 0.97,
            transition: { duration: 0.15, ease: "easeIn" },
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn(styles["apply-cluster-alert"])}
        >
          {!lastTauriError ? (
            <div className="flex justify-between">
              <div>
                <span className="text-amber-300 font-medium">
                  {t("common.not_applied")}:{" "}
                  {t("common.change", { count: mismatchDomains.length })}
                </span>
                <p className="text-gray-300 text-xs pr-10">
                  {blocked.length > 0 && (
                    <>
                      {blocked.join(" ")}{" "}
                      {t("system.hosts.will_be_blocked", {
                        count: blocked.length,
                      })}
                    </>
                  )}
                  {unBlocked.length > 0 && (
                    <>
                      {blocked.length > 0 && <br />}
                      {unBlocked.join(" ")}{" "}
                      {t("system.hosts.will_be_unblocked", {
                        count: unBlocked.length,
                      })}
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={"outline"}
                  className={"p-5"}
                  onClick={onCancel}
                >
                  {t("buttons.cancel")}
                </Button>
                <Button
                  className={cn(styles["steam-btn-2"], "p-5")}
                  onClick={onUpdate}
                >
                  {t("system.hosts.updateBlocked")} (
                  {selectedRegion?.alias_name})
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between">
              <div className="w-full">
                <div className="flex justify-between">
                  <span className="font-medium">{t("errors.default")}</span>
                  <div className="space-x-1.5">
                    <Button
                      size={"xs"}
                      onClick={handleCopyError}
                      variant={"outline"}
                      className={"font-normal"}
                      disabled={copiedError}
                    >
                      {!copiedError ? <Copy /> : <Check />}
                      {t("buttons.copy")}
                    </Button>
                    <Button
                      size={"icon-xs"}
                      onClick={onCloseError}
                      variant={"outline"}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
                <pre className="mt-1.5 text-danger-ring select-text max-h-[75vh] overflow-auto text-xs font-mono">
                  {lastTauriError}
                </pre>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
