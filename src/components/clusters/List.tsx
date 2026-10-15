import { useOverflowScroll } from "@/hooks/useOverflowScroll";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { usePingStore } from "@/store/usePingStore";
import type { Cluster } from "@/types/cluster";
import { Checkbox } from "@headlessui/react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

const listVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09, // 5 карточек ≈ 0.45 с от первой до последней
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1, // уходят в обратном порядке: снизу вверх
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 24,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: -6, // вверх, а не вниз: нижний край не вылезает за контейнер
    scale: 0.98,
    transition: { duration: 0.14, ease: "easeIn" },
  },
};

type ClusterListProps = {
  clusters: Cluster[];
  checkedMap?: Record<string, boolean>;
  topOffset?: number | string;
  isMobile?: boolean;
  hostsMismatch: boolean;
  regionKey?: string; // id региона, если есть
  onToggle?: (domain: string, checked: boolean) => void;
};

const ClusterRow = memo(function ClusterRow({
  cluster,
  isChecked,
  onToggle,
}: {
  cluster: Cluster;
  isChecked: boolean;
  onToggle?: (domain: string, checked: boolean) => void;
}) {
  const { t } = useTranslation();
  const ping = usePingStore((s) => s.pings[cluster.domain]);

  return (
    <motion.div variants={itemVariants} className="cluster w-full mt-2">
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
  regionKey,
}: ClusterListProps) {
  const isMobile = useAppStore((s) => s.isMobile);
  const { ref, hasOverflow } = useOverflowScroll<HTMLDivElement>();

  // Ключ меняется при смене региона, и тогда проигрывается exit → enter
  const listKey = useMemo(
    () => regionKey ?? clusters.map((c) => c.domain).join("|"),
    [regionKey, clusters],
  );

  const spacerHeight =
    typeof topOffset === "number" ? `${topOffset}px` : (topOffset ?? 0);

  return (
    <div className="ban-clusters-2 mt-1 flex-1 min-h-0 flex flex-col">
      <div
        ref={ref}
        className={cn(
          "ban-clusters-2-container scrollbarYAuto flex-1 min-h-0",
          isMobile ? "space-y-2 pb-4" : "",
          hasOverflow ? "is-scrollable" : "",
        )}
      >
        <AnimatePresence mode="wait" initial>
          <motion.div
            key={listKey}
            variants={listVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {clusters.map((c) => (
              <ClusterRow
                key={c.domain}
                cluster={c}
                isChecked={!!checkedMap[c.domain]}
                onToggle={onToggle}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        <div
          aria-hidden
          className="apply-alert-space hidden max-[900px]:block shrink-0 overflow-hidden transition-[height] duration-300 ease-in-out"
          style={{ height: hostsMismatch ? spacerHeight : 0 }}
        />
      </div>
    </div>
  );
}

export default memo(ClusterList);
