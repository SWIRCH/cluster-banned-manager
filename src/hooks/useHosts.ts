import { safeInvoke } from "@/lib/tauri";
import type { Cluster } from "@/types/cluster";
import type { Selections } from "@/types/selections";
import { logger } from "@/utils/logger";
import { useCallback, useEffect, useState } from "react";

export function useHosts(
  selectedRegionId: string,
  selections: Selections,
  clusters: Cluster[],
) {
  const [hostsMismatch, setHostsMismatch] = useState(false);
  const [mismatchDomains, setMismatchDomains] = useState<string[]>([]);
  const [tauriAvailable, setTauriAvailable] = useState<boolean | null>(null);
  const [lastTauriError, setLastTauriError] = useState<string | null>(null);

  const checkHostsConsistency = useCallback(async () => {
    try {
      const regionSelections = {
        [selectedRegionId]:
          selections[selectedRegionId] ??
          Object.fromEntries(clusters.map((c) => [c.domain, true])),
      };

      logger.log("check_hosts_consistency -> sending", regionSelections);

      const res: any = await safeInvoke("check_hosts_consistency", {
        selections: regionSelections,
      });

      logger.log("check_hosts_consistency -> result", res);

      setTauriAvailable(true);
      setLastTauriError(null);

      const blockedSet = new Set(
        (res?.blocked || []).map((s: string) => s.toLowerCase()),
      );

      const mismatches: string[] = [];

      for (const c of clusters) {
        const localEnabled = !!(regionSelections[selectedRegionId] || {})[
          c.domain
        ];
        const hostsBlocked = blockedSet.has(c.domain.toLowerCase());
        if (hostsBlocked !== !localEnabled) mismatches.push(c.domain);
      }

      setMismatchDomains(mismatches);
      setHostsMismatch(mismatches.length > 0);
    } catch (e) {
      logger.log("check_hosts_consistency failed", e);

      setTauriAvailable(false);
      setMismatchDomains([]);
      setHostsMismatch(false);
      setLastTauriError(String(e));
    }
  }, [clusters, selectedRegionId, selections]);

  useEffect(() => {
    checkHostsConsistency();
  }, [selections, selectedRegionId, clusters.length]);

  return {
    hostsMismatch,
    mismatchDomains,
    tauriAvailable,
    lastTauriError,
    checkHostsConsistency,
  };
}
