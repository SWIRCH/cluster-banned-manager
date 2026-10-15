import type { Game } from "@/types/cluster";
import { LOCAL_CLUSTERS } from "@/utils/clustersLoader";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useSettings } from "./useSettings";

export function useClustersLoader() {
  const [clustersData, setClustersData] = useState<Game>(LOCAL_CLUSTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const { settings } = useSettings();

  useEffect(() => {
    let cancelled = false;

    async function loadClusters() {
      setIsLoading(true);
      setLoadError(undefined);

      try {
        const data = await invoke<Game>("get_clusters");

        // Rust при полном провале вернёт {} — это не валидные данные
        if (!Array.isArray(data?.regions)) {
          throw new Error("invalid clusters data");
        }
        if (!cancelled) setClustersData(data);
      } catch (err) {
        console.warn("Clusters load failed:", err);
        // Остаются начальные LOCAL_CLUSTERS
        if (!cancelled) {
          setLoadError("Failed to load clusters data, using fallback");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadClusters();
    return () => {
      cancelled = true;
    };
  }, [settings.syncMode]);

  return { clustersData, isLoading, loadError };
}
