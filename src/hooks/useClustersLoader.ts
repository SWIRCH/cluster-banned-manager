import { useState, useEffect } from "react";
import {
  LOCAL_CLUSTERS,
  loadClustersFromGitHub,
  loadClustersFromLocal,
} from "../utils/clustersLoader";
import type { Game } from "../types/cluster";

export function useClustersLoader() {
  const [clustersData, setClustersData] = useState<Game>(LOCAL_CLUSTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function loadClusters() {
      setIsLoading(true);
      setLoadError(undefined);

      try {
        // Пробуем загрузить с GitHub
        const data = await loadClustersFromGitHub();
        if (data) {
          setClustersData(data);
          return;
        }
      } catch (err) {
        console.warn("GitHub load failed:", err);
      }

      // Если GitHub не доступен - пробуем локальный динамический импорт
      try {
        const localData = await loadClustersFromLocal();
        if (localData) {
          setClustersData(localData);
          return;
        }
      } catch (err) {
        console.warn("Local load failed:", err);
      }

      // Если всё плохо - оставляем начальные LOCAL_CLUSTERS
      setLoadError("Failed to load clusters data, using fallback");
    }

    loadClusters().finally(() => setIsLoading(false));
  }, []);

  return { clustersData, isLoading, loadError };
}
