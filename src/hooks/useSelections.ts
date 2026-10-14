import type { AppSettings } from "@/types/app-settings";
import type { Cluster, Game } from "@/types/cluster";
import type { Selections } from "@/types/selections";
import { useCallback, useEffect, useState } from "react";

function createDefaultSelections(game: Game): Selections {
  return Object.fromEntries(
    game.regions.map((region) => [
      region.id,
      Object.fromEntries(
        (region.clusters ?? []).map((cluster) => [cluster.domain, true]),
      ),
    ]),
  );
}

function normalizeSelections(game: Game, stored?: Selections): Selections {
  return Object.fromEntries(
    game.regions.map((region) => [
      region.id,
      Object.fromEntries(
        (region.clusters ?? []).map((cluster) => [
          cluster.domain,
          stored?.[region.id]?.[cluster.domain] ?? true,
        ]),
      ),
    ]),
  );
}

export function useSelections(
  game: Game,
  settings: AppSettings,
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>,
  settingsLoading: boolean,
) {
  const [selections, setSelections] = useState<Selections>({});

  useEffect(() => {
    if (settingsLoading) return;

    const next = normalizeSelections(game, settings.clusterSelections);
    setSelections(next);
  }, [game, settings.clusterSelections, settingsLoading]);

  const updateSelection = useCallback(
    (regionId: string, domain: string, checked: boolean) => {
      setSelections((prev) => {
        const prevRegion = prev[regionId] ?? {};
        const newRegion = { ...prevRegion, [domain]: checked };
        return { ...prev, [regionId]: newRegion };
      });
    },
    [],
  );

  const selectCluster = useCallback(
    (regionId: string, domain: string, clusters: Cluster[]) => {
      setSelections((prev) => {
        const newRegion = Object.fromEntries(
          clusters.map((c) => [c.domain, c.domain === domain]),
        );
        return { ...prev, [regionId]: newRegion };
      });
    },
    [],
  );

  const clearAllRegionSelections = useCallback(
    (regionId: string, clusters: Cluster[]) => {
      setSelections((prev) => {
        const newRegion = Object.fromEntries(
          clusters.map((c) => [c.domain, false]),
        );
        return { ...prev, [regionId]: newRegion };
      });
    },
    [],
  );

  const selectAllClustersInRegion = useCallback(
    (regionId: string, clusters: Cluster[]) => {
      setSelections((prev) => {
        const newRegion = Object.fromEntries(
          clusters.map((c) => [c.domain, true]),
        );
        return { ...prev, [regionId]: newRegion };
      });
    },
    [],
  );

  const cancelEditClustersInRegion = useCallback(
    (regionId: string) => {
      if (!settings.clusterSelections) return;

      const next = settings.clusterSelections[regionId];

      setSelections((prev) => ({
        ...prev,
        [regionId]: next,
      }));
    },
    [settings.clusterSelections],
  );

  const clearAllSelections = useCallback(async () => {
    const defaults = createDefaultSelections(game);
    setSelections(defaults);
    return defaults;
  }, [game]);

  const persistSelections = useCallback(
    async (next: Selections) => {
      await updateSettings({ clusterSelections: next });
    },
    [updateSettings],
  );

  return {
    selections,
    setSelections,
    updateSelection,
    selectCluster,
    clearAllRegionSelections,
    selectAllClustersInRegion,
    cancelEditClustersInRegion,
    clearAllSelections,
    persistSelections,
  };
}
