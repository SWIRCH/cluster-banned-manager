import { Button } from "@/components/ui/button";
import type { Cluster } from "@/types/cluster";
import type { PingMap } from "@/types/ping";
import { logger } from "@/utils/logger";
import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ClusterList from "./ClusterList";
import { Spinner } from "./ui/spinner";
// import type { Selections } from "@/types/selections";

type SelectiveBlockingProps = {
  clusters: Cluster[];
  checkedMap: Record<string, boolean>;
  pings: PingMap;
  isMobile: boolean;
  hostsMismatch: boolean;
  onToggle: (domain: string, checked: boolean) => void;
  onSelect: (domain: string) => void;
  onDisableAll: () => void;
  onEnableAll: () => void;
};

type BestPingObject = {
  bestDomain: Cluster;
  bestPing: number;
};

export default function SelectiveBlocking({
  clusters,
  checkedMap,
  pings,
  isMobile,
  hostsMismatch,
  onToggle,
  onSelect,
  onDisableAll,
  onEnableAll,
}: SelectiveBlockingProps) {
  const [stableBestPing, setStableBestPing] = useState<BestPingObject | null>(
    null,
  );
  const domainSet = new Set(clusters.map((c) => c.domain));
  const pingsObject = Object.entries(pings);
  const regionPings = pingsObject
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

  logger.log(best);

  return (
    <div
      className={`whilecard ${isMobile && "mt-0 flex-1 min-h-0 flex flex-col"}`}
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
          <div className="action-bar">
            <Button
              variant={"outline"}
              className={"rounded-full px-3"}
              onClick={() => onEnableAll()}
            >
              {t("buttons.allow_all")}
            </Button>
            <Button
              variant={"outline"}
              className={"rounded-full px-3"}
              onClick={() => onDisableAll()}
            >
              {t("buttons.disallow_all")}
            </Button>

            {stableBestPing?.bestDomain ? (
              <Button
                variant={"outline"}
                className={
                  "group rounded-full border-blue-400! text-blue-400 hover:border-blue-300! hover:text-blue-300"
                }
                onClick={() => onSelect(stableBestPing.bestDomain.domain)}
              >
                <Check className="text-blue-400 group-hover:text-blue-300" />
                {t("buttons.best_ping")}: {stableBestPing.bestDomain.id}
              </Button>
            ) : (
              <Button
                variant={"outline"}
                className={"rounded-full "}
                disabled={true}
              >
                <Spinner />
                {t("loading.search_best_ping")}
              </Button>
            )}
          </div>
        </div>
      )}
      <div
        className={`content p-0 relative ${isMobile && "flex-1 min-h-0 flex flex-col"}`}
      >
        <ClusterList
          clusters={clusters}
          checkedMap={checkedMap}
          onToggle={onToggle}
          pings={pings}
          isMobile={isMobile}
          hostsMismatch={hostsMismatch}
        />
      </div>
    </div>
  );
}
