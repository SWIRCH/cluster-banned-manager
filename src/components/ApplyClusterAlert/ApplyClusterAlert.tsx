import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Region } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./applyclusteralert.module.scss";

type ApplyClusterAlertProps = {
  selectedRegion: Region | null;
  lastTauriError: string | null;
  hostsMismatch: boolean;
  mismatchDomains: string[];
  onUpdateClick: () => void;
};

// type GamePosterProps = {
//   posterUrl: string;
//   tauriAvailable: boolean | null;
//   hostsMismatch: boolean;
//   gameRunning: boolean;
//   onPlayClick: () => void;
//   onUpdateClick: () => void;
//   selectedRegion: Region | null;
//   lastTauriError: string | null;
//   mismatchDomains: string[];
// };

export default function ApplyClusterAlert({
  hostsMismatch,
  // mismatchDomains,
  // onUpdateClick,
  // lastTauriError,
}: ApplyClusterAlertProps) {
  return (
    <AnimatePresence>
      {/* {tauriAvailable === true && hostsMismatch === false && (
                  <motion.div
                    key="hosts-ok"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1"
                  ></motion.div> */}
      {hostsMismatch && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className={styles["apply-cluster-alert"]}
        >
          <div className="flex justify-between">
            <div>
              <span className="text-amber-300 font-medium">
                Не применено: 1 изменение
              </span>
              <p className="text-gray-300 text-xs">C1 будет заблокирован</p>
            </div>
            <div className="flex gap-2">
              <Button variant={"outline"} className={"p-5"}>
                Отменить
              </Button>
              <Button className={cn(styles["steam-btn-2"], "p-5")}>
                ОБНОВИТЬ БЛОК (RU)
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
