import { useEffect } from "react";
import { useShallow } from "zustand/shallow";

import { safeInvoke } from "@/lib/tauri";
import { useAppStore } from "@/store/useAppStore";
import { bootstrapSettings } from "@/store/useSettingsStore";
import { config } from "@/utils/config";
import { logger } from "@/utils/logger";
import { getSavedRegionId } from "@/utils/regionStorage";

import { syncVpnStatus } from "@/lib/vpn";
import type { Game } from "@/types/cluster";
import { Elevation } from "@/types/system";
import { ensureClusters } from "@/utils/ensureClusters";
import { addPluginListener, PluginListener } from "@tauri-apps/api/core";

interface UseAppBootstrapParams {
  game: Game;
  settingsLoading: boolean;
  settingsIsSetup?: boolean;
  selections: Record<string, unknown>;
  isMobile: boolean;
}

/**
 * Инициализация приложения при старте:
 * - запись game в стор
 * - bootstrap настроек
 * - выбор сохранённого/дефолтного региона
 * - синхронизация isSetup
 * - проверка прав администратора
 * - первичная загрузка VPN-статуса (mobile)
 */
export function useAppBootstrap({
  game,
  settingsLoading,
  settingsIsSetup,
  selections,
  isMobile,
}: UseAppBootstrapParams) {
  const {
    setGame,
    selectedRegionId,
    setSelectedRegionId,
    isSetup,
    setAdminMounts,
    setAdminModalOpen,
    setIsSetup,
    // setVpnStatus,
    // setVpnDomains,
    setIsMobile,
  } = useAppStore(
    useShallow((s) => ({
      setGame: s.setGame,
      selectedRegionId: s.selectedRegionId,
      setSelectedRegionId: s.setSelectedRegionId,
      isSetup: s.isSetup,
      setAdminMounts: s.setAdminMounts,
      setAdminModalOpen: s.setAdminModalOpen,
      setIsSetup: s.setIsSetup,
      setVpnStatus: s.setVpnStatus,
      setVpnDomains: s.setVpnDomains,
      setIsMobile: s.setIsMobile,
    })),
  );

  useEffect(() => {
    // Запись game в store
    setGame(game);

    // Bootstrap настроек
    bootstrapSettings();

    // Устанавливаем глобальный isMobile
    setIsMobile(isMobile);

    // Merge файла кластеров, только для Desktop
    (async () => {
      if (isMobile) return;

      try {
        await ensureClusters();
      } catch (err) {
        logger.error("Не удалось синхронизировать кластеры:", err);
      }
    })();
  }, []);

  // Инициализация выбранного региона
  useEffect(() => {
    if (!game?.regions || selectedRegionId) return;

    const savedRegionId = getSavedRegionId();
    const regionExists = game.regions.some((c) => c.id === savedRegionId);

    if (savedRegionId && regionExists) {
      setSelectedRegionId(savedRegionId);
      return;
    }

    const defaultRegion =
      game.regions.find((c) => c.id === "wot_eu") ?? game.regions[0];
    if (defaultRegion) {
      setSelectedRegionId(defaultRegion.id);
    }
  }, [game, selectedRegionId, setSelectedRegionId]);

  // Синхронизация isSetup из settings
  useEffect(() => {
    if (!settingsLoading && settingsIsSetup !== undefined) {
      setIsSetup(settingsIsSetup);
    }
  }, [settingsLoading, settingsIsSetup, setIsSetup]);

  // Проверка elevation (основная)
  useEffect(() => {
    if (settingsLoading || isMobile) return;

    (async () => {
      try {
        const ev: Elevation = await safeInvoke("check_elevation");

        logger.log("Elevation: ", ev);

        if (ev && ev.isAdmin === false) {
          setAdminMounts(false);
          if (settingsIsSetup || isSetup) {
            setAdminModalOpen(true);
          }
          return;
        }
        setAdminMounts(true);
      } catch (e) {
        console.debug("check_elevation failed", e);
      }
    })();
  }, [
    settingsLoading,
    settingsIsSetup,
    isSetup,
    setAdminMounts,
    setAdminModalOpen,
  ]);

  // 6. Повторная проверка elevation при isSetup
  useEffect(() => {
    if (!isSetup) return;

    safeInvoke("check_elevation").then((ev: any) => {
      if (ev && ev.isAdmin === false) {
        setAdminModalOpen(true);
      }
    });
  }, [isSetup, setAdminModalOpen]);

  // 7. Первичная загрузка VPN-статуса (только mobile)
  // Устанавливаем статус VPN кнопки
  useEffect(() => {
    if (!isMobile) return;

    let last = 0;
    const run = () => {
      const now = Date.now();
      if (now - last < 500) return;
      last = now;
      if (useAppStore.getState().vpnStatus === "Loading") return;
      void syncVpnStatus();
    };

    run();

    // нативное событие из Kotlin
    let listener: PluginListener | undefined;
    let cancelled = false;
    addPluginListener("cluster-vpn", "appResumed", run)
      .then((l) => {
        if (cancelled) void l.unregister();
        else listener = l;
      })
      .catch((e) => logger.error("appResumed listener failed:", e));

    return () => {
      cancelled = true;
      void listener?.unregister();
      window.removeEventListener("focus", run);
    };
  }, [isMobile]);

  // 8. DEBUG-лог готовности данных
  useEffect(() => {
    if (!config.DEBUG_MODE) return;
    if (!settingsLoading && Object.keys(selections).length > 0) {
      logger.log(
        "Данные приложения загружены, ожидаем завершения проверки обновлений",
      );
    }
  }, [settingsLoading, selections]);
}
