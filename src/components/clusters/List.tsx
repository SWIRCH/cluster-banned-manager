import { useOverflowScroll } from "@/hooks/useOverflowScroll";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { usePingStore } from "@/store/usePingStore";
import type { Cluster } from "@/types/cluster";
import { Checkbox } from "@headlessui/react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -12,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.22,
      duration: 0.35,
      ease: "easeOut",
    },
  }),
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.25,
      ease: "easeIn",
    },
  },
};

type ClusterListProps = {
  clusters: Cluster[];
  checkedMap?: Record<string, boolean>;
  topOffset?: number | string;
  isMobile?: boolean;
  hostsMismatch: boolean;
  onToggle?: (domain: string, checked: boolean) => void;
};

const ClusterRow = memo(function ClusterRow({
  cluster,
  index,
  isChecked,
  onToggle,
}: {
  cluster: Cluster;
  index: number;
  isChecked: boolean;
  onToggle?: (domain: string, checked: boolean) => void;
}) {
  const { t } = useTranslation();
  const ping = usePingStore((s) => s.pings[cluster.domain]);

  return (
    <motion.div
      key={cluster.domain}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="cluster w-full mt-2"
    >
      <div
        onClick={() => onToggle && onToggle(cluster.domain, !isChecked)}
        className={cn(
          "block rounded-xl p-6 sm:p-4 relative w-full cursor-pointer select-none transition-colors hover:bg-white/5",
          ping && (ping.status !== "ok" || ping.lossPercent === 100)
            ? "loss"
            : "ok",
        )}
      >
        <div className="flex items-center">
          <span className="font-semibold text-3xl text-white">
            {cluster.id}
          </span>
          <hr className="vertical" />
          <div className="text-sm text-white/50 m-0">
            {t((cluster.location_key as any) ?? "locations.unknown")}
            <br />
            {(() => {
              if (!ping) return "—";
              const avg = ping.avg;
              const display =
                avg !== null && avg !== undefined ? `${avg} ms` : "—";
              const cls =
                avg === null || avg === undefined
                  ? "text-white/50"
                  : avg <= 50
                    ? "text-green-400"
                    : avg >= 105
                      ? "text-red-400"
                      : "text-yellow-400";
              return (
                <span>
                  <span className={cls}>{display}</span>{" "}
                  <span className="text-white/50">
                    ({ping.lossPercent}% loss)
                  </span>
                </span>
              );
            })()}
          </div>
          <div className="absolute right-4">
            <Checkbox
              checked={isChecked}
              onChange={() => {
                /* Клик перехватывается родителем */
              }}
              className="flex size-6 group rounded-md bg-white/10 p-1 ring-white/15 focus:not-data-focus:outline-none data-checked:bg-white data-focus:outline data-focus:outline-offset-2 data-focus:outline-white"
            >
              <svg
                className="stroke-white opacity-0 group-data-checked:opacity-100"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M3 8L6 11L11 3.5"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Checkbox>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

function ClusterList({
  clusters,
  checkedMap = {},
  onToggle,
  topOffset,
  hostsMismatch,
}: ClusterListProps) {
  const isMobile = useAppStore((s) => s.isMobile);
  const { ref, hasOverflow } = useOverflowScroll<HTMLDivElement>();

  return (
    <div className={"ban-clusters-2 mt-1 flex-1 min-h-0 flex flex-col"}>
      <div
        ref={ref}
        className={cn(
          "ban-clusters-2-container scrollbarYAuto flex-1 min-h-0",
          isMobile ? "space-y-2 pb-4" : "",
          hasOverflow ? "is-scrollable" : "",
        )}
      >
        <AnimatePresence>
          {clusters.map((c, index) => (
            <ClusterRow
              key={c.domain}
              cluster={c}
              index={index}
              isChecked={!!checkedMap[c.domain]}
              onToggle={onToggle}
            />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {hostsMismatch && (
            <motion.div
              className="apply-alert-space hidden max-[900px]:block"
              layout
              initial={{ height: 0 }}
              animate={{ height: topOffset + "px" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default memo(ClusterList);
