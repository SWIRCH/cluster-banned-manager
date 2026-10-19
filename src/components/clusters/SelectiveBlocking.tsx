import { useIsMobile } from "@/hooks";
import { usePingStore } from "@/store/usePingStore";
import type { Cluster } from "@/types/cluster";
import { cn } from "cn";
import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ClusterActionBar } from ".";
import ClusterList from "./List";
import { BestPingObject } from "./type/ping.type";

type SelectiveBlockingProps = {
  clusters: Cluster[];
  checkedMap: Record<string, boolean>;
  hostsMismatch: boolean;
  topOffset?: number;
  onToggle: (domain: string, checked: boolean) => void;
  onSelect: (domain: string) => void;
  onDisableAll: () => void;
  onEnableAll: () => void;
};

function SelectiveBlocking({
  clusters,
  checkedMap,
  hostsMismatch,
  topOffset = 0,
  onToggle,
  onSelect,
  onDisableAll,
  onEnableAll,
}: SelectiveBlockingProps) {
  const isMobile = useIsMobile();
  const pings = usePingStore((s) => s.pings);
  const [stableBestPing, setStableBestPing] = useState<BestPingObject | null>(
    null,
  );
  const domainSet = useMemo(
    () => new Set(clusters.map((c) => c.domain)),
    [clusters],
  );
  const regionPings = Object.entries(pings)
    .filter(([k]) => domainSet.has(k))
    .map(([, v]) => v);

  const best = useMemo<BestPingObject | null>(() => {
    let bestDomain: Cluster | null = null;
    let bestPing: number | null = null;

    for (const cluster of clusters) {
      const avg = pings[cluster.domain]?.avg;
      if (avg == null) continue;

      if (bestPing === null || avg < bestPing) {
        bestPing = avg;
        bestDomain = cluster;
      }
    }

    return bestDomain && bestPing !== null ? { bestDomain, bestPing } : null;
  }, [clusters, pings]);

  useEffect(() => {
    setStableBestPing(null);
    const id = setTimeout(() => setStableBestPing(best), 1000);
    return () => clearTimeout(id);
  }, [best]);

  const vals = regionPings.filter((p) => p.avg !== null);
  const avg = vals.length
    ? Math.round(vals.reduce((s, x) => s + (x.avg || 0), 0) / vals.length)
    : null;
  const ok = regionPings.filter((p) => p.status === "ok").length;
  const total = clusters.length;

  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "whilecard",
        isMobile && "mt-0 flex-1 min-h-0 flex flex-col",
      )}
    >
      {!isMobile && (
        <div className="px-2">
          <div className="title mb-2">
            <h3>{t("common.selective_blocking")}</h3>

            {clusters.length > 0 && (
              <div className="text-xs text-white/60 avg-ping">
                <span>
                  {t("common.avg_ping")}:{" "}
                  {avg ? `${avg} ${t("common.ms")}` : "—"} ({ok}/{total} ok)
                </span>
              </div>
            )}
          </div>

          <ClusterActionBar
            bestPing={stableBestPing}
            onSelect={onSelect}
            onEnableAll={onEnableAll}
            onDisableAll={onDisableAll}
          />
        </div>
      )}
      <div
        className={cn(
          `content p-0 relative`,
          isMobile && "flex-1 min-h-0 flex flex-col",
        )}
      >
        <ClusterList
          clusters={clusters}
          checkedMap={checkedMap}
          onToggle={onToggle}
          topOffset={topOffset}
          isMobile={isMobile}
          hostsMismatch={hostsMismatch}
        />
      </div>
    </div>
  );
}

export default memo(SelectiveBlocking);
