import { useAppStore } from "@/store/useAppStore";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { useShallow } from "zustand/shallow";
import GamePoster from "./components/game/GamePoster";
import Sidebar from "./components/layout/Sidebar";
import LoadingScreen from "./components/system/LoadingScreen";

import {
  AboutModal,
  AdminModal,
  BlockingAllConfirmModal,
  ClearConfirmModal,
  ConfirmModal,
  InfoModal,
  SettingsModal,
} from "./components/modals";

import {
  useClustersLoader,
  useGameLauncher,
  useGamePoster,
  useGameStatus,
  useHosts,
  useHostsActions,
  useInfoModal,
  useIsMobile,
  usePing,
  useSelections,
  useSettings,
} from "./hooks";

import { collectBlockedDomains } from "@/utils/blocking";
import { config } from "@/utils/config";
import { saveRegionId } from "@/utils/regionStorage";
import { diagnoseTauri } from "./lib/tauri";

import "@/lib/vpnListener";
import type { Cluster, Game } from "@/types/cluster";
import { logger } from "@/utils/logger";
import { cn } from "cn";
import { useTranslation } from "react-i18next";
import { ClusterBlockingPanel } from "./components/clusters";
import MobileBottomBar from "./components/layout/mobile/BottomBar";
import MobileTopBar from "./components/layout/mobile/TopBar";
import SetupFirstAppSettings from "./components/modals/SetupFirstAppSettings";
import { showGlobalError } from "./components/system/GlobalError";
import TurnVpnButton from "./components/vpn/TurnVpnButton";
import { useAppBootstrap } from "./hooks/useAppBootstrap";

// Styles
import("@/styles/mobile.scss");
import("@/styles/desktop.scss");

const EMPTY_CLUSTERS: Cluster[] = [];
const EMPTY_REGION_MAP: Record<string, boolean> = {};

function AppContent() {
  const { clustersData, isLoading: clustersLoading } = useClustersLoader();
  const [isLoadingScreen, setIsLoadingScreen] = useState(clustersLoading);
  // const [viewApplyClusterAlert, setViewApplyClusterAlert] = useState(false);
  const game = clustersData as Game;

  const isMobile = useIsMobile();
  const infoModal = useInfoModal();

  logger.log("Render AppContent");

  // Zustand Store
  const {
    selectedRegionId,
    setSelectedRegionId,
    adminMounts,
    diagnosticInfo,
    setDiagnosticInfo,
    confirmDomains,
    setConfirmOpen,
    setClearConfirmOpen,
    setBlockingAllConfirmOpen,
    settingsModalOpen,
    setSettingsModalOpen,
    setAdminModalOpen,
    setIsSetup,
    vpnStatus: currentVpnStatus,
    vpnBaselineDomains,
    setVpnBaselineDomains,
    vpnDirty,
    setVpnDirty,
  } = useAppStore(
    useShallow((s) => ({
      selectedRegionId: s.selectedRegionId,
      setSelectedRegionId: s.setSelectedRegionId,
      adminMounts: s.adminMounts,
      diagnosticInfo: s.diagnosticInfo,
      setDiagnosticInfo: s.setDiagnosticInfo,
      confirmDomains: s.confirmDomains,
      setConfirmOpen: s.setConfirmOpen,
      setClearConfirmOpen: s.setClearConfirmOpen,
      setBlockingAllConfirmOpen: s.setBlockingAllConfirmOpen,
      settingsModalOpen: s.settingsModalOpen,
      setSettingsModalOpen: s.setSettingsModalOpen,
      setAdminModalOpen: s.setAdminModalOpen,
      setIsSetup: s.setIsSetup,
      vpnStatus: s.vpnStatus,
      vpnBaselineDomains: s.vpnBaselineDomains,
      setVpnBaselineDomains: s.setVpnBaselineDomains,
      vpnDirty: s.vpnDirty,
      setVpnDirty: s.setVpnDirty,
    })),
  );

  const defaultRegion =
    game?.regions?.find((c) => c.id === "wot_eu") ?? game?.regions?.[0];
  const selectedRegion =
    game?.regions?.find((c) => c.id === selectedRegionId) ?? defaultRegion;
  const selectedRegionClusters = selectedRegion?.clusters ?? EMPTY_CLUSTERS;

  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  const {
    selections,
    updateSelection,
    selectCluster,
    clearAllSelections,
    persistSelections,
    clearAllRegionSelections,
    selectAllClustersInRegion,
    cancelEditClustersInRegion,
  } = useSelections(game, settings, updateSettings, settingsLoading);
  const {
    hostsMismatch,
    mismatchDomains,
    tauriAvailable,
    lastTauriError,
    checkHostsConsistency,
  } = useHosts(selectedRegionId, selections, selectedRegionClusters);
  const { pingClusters } = usePing(selectedRegion, isMobile);
  const { gameRunning, checkGameRunning, killGame } = useGameStatus();
  const { applyHostsUpdate, clearCluster, stopVpn, loading } = useHostsActions(
    selectedRegionId,
    selections,
    selectedRegionClusters,
    settings,
    isMobile,
    game,
  );
  const posterUrl = useGamePoster(game);

  useAppBootstrap({
    game,
    settingsLoading,
    settingsIsSetup: settings.isSetup,
    selections,
    isMobile,
  });

  useEffect(() => {
    document.body.classList.add(
      isMobile ? "platform-mobile" : "platform-desktop",
    );
    return () => {
      document.body.classList.remove("platform-mobile", "platform-desktop");
    };
  }, [isMobile]);

  useEffect(() => {
    if (!config.DEBUG_MODE) return;
    if (!settingsLoading && Object.keys(selections).length > 0) {
      logger.log(
        "Данные приложения загружены, ожидаем завершения проверки обновлений",
      );
      logger.log("Selections: ", selections);
    }
  }, [settingsLoading, selections]);

  useEffect(() => {
    if (!settingsLoading && settings.isSetup !== undefined) {
      setIsSetup(settings.isSetup);
    }
  }, [settingsLoading, settings.isSetup, setIsSetup]);

  const regionMap = selections[selectedRegionId] ?? EMPTY_REGION_MAP;
  const allBlockedDomains = collectBlockedDomains(game, selections);
  const allBlockedDomainsKey = JSON.stringify(allBlockedDomains);

  useEffect(() => {
    if (
      !isMobile ||
      Object.keys(selections).length === 0 ||
      vpnBaselineDomains
    ) {
      return;
    }
    setVpnBaselineDomains(JSON.parse(allBlockedDomainsKey));
  }, [
    allBlockedDomainsKey,
    isMobile,
    selections,
    setVpnBaselineDomains,
    vpnBaselineDomains,
  ]);

  useEffect(() => {
    if (!isMobile || !vpnBaselineDomains) return;
    setVpnDirty(allBlockedDomainsKey !== JSON.stringify(vpnBaselineDomains));
  }, [allBlockedDomainsKey, isMobile, setVpnDirty, vpnBaselineDomains]);

  const vpnNeedsApply = isMobile && vpnDirty;

  const handleLoadingComplete = useCallback(() => {
    setIsLoadingScreen(false);
  }, []);

  const handleSelectCluster = useCallback(
    (domain: string) => {
      selectCluster(selectedRegionId, domain, selectedRegionClusters);
    },
    [selectCluster, selectedRegionId, selectedRegionClusters],
  );

  const handleDisableClusters = useCallback(() => {
    clearAllRegionSelections(selectedRegionId, selectedRegionClusters);
  }, [clearAllRegionSelections, selectedRegionId]);

  const handleEnableClusters = useCallback(() => {
    selectAllClustersInRegion(selectedRegionId, selectedRegionClusters);
  }, [selectAllClustersInRegion, selectedRegionId, selectedRegionClusters]);

  const handleCancelEditClusters = useCallback(() => {
    if (settings.clusterSelections)
      cancelEditClustersInRegion(selectedRegionId);
  }, [
    cancelEditClustersInRegion,
    selectedRegionId,
    settings.clusterSelections,
  ]);

  const handleToggleCluster = useCallback(
    (domain: string, checked: boolean) => {
      updateSelection(selectedRegionId, domain, checked);
    },
    [selectedRegionId, updateSelection],
  );

  const handleApplyHosts = useCallback(
    async (domains?: string[]) => {
      if (settings.useFirewall && !isMobile && !adminMounts) {
        setConfirmOpen(false);
        showGlobalError(
          t("errors.admin_mounts.title"),
          t("errors.admin_mounts.description"),
          t("errors.admin_mounts.details"),
        );
        return;
      }

      const result = await applyHostsUpdate(domains, currentVpnStatus === "On");
      if (result.success) {
        // infoModal.showInfo(result.title, result.message);
      } else {
        showGlobalError(result.title, result.message, result.details);
      }
      setConfirmOpen(false);
      if (result.success) {
        await persistSelections(selections);
        await checkHostsConsistency();
      }
    },
    [
      applyHostsUpdate,
      checkHostsConsistency,
      currentVpnStatus,
      infoModal,
      persistSelections,
      selections,
      setConfirmOpen,
    ],
  );

  const handleToggleVpn = async () => {
    if (currentVpnStatus === "On") {
      await stopVpn();
      return;
    }

    if (allBlockedDomains.length === 0) {
      showGlobalError(
        "VPN не включён",
        "У вас нет ни одной блокировки кластеров.",
      );
      return;
    }

    const result = await applyHostsUpdate(allBlockedDomains, true);
    if (!result.success) {
      showGlobalError(result.title, result.message, result.details);
    }
  };

  const handleClearCluster = async () => {
    if (!isMobile && !adminMounts) {
      showGlobalError(
        t("errors.admin_mounts.title"),
        t("errors.admin_mounts.description"),
        t("errors.admin_mounts.details"),
      );
      return;
    }

    const result = await clearCluster();
    setClearConfirmOpen(false);

    if (result.success) {
      const defaults = await clearAllSelections();
      await persistSelections(defaults);
      await checkHostsConsistency();
      await pingClusters(selectedRegionId);
      await checkGameRunning();
    }
  };

  const handleUpdateClick = useCallback(async () => {
    const rmap =
      selections[selectedRegionId] ??
      Object.fromEntries(selectedRegionClusters.map((c) => [c.domain, true]));
    const blockedDomains = selectedRegionClusters
      .filter((c) => !rmap[c.domain])
      .map((c) => c.domain);

    if (!isMobile) {
      setConfirmOpen(true, blockedDomains);
      return;
    }

    await handleApplyHosts();
  }, [
    handleApplyHosts,
    isMobile,
    selectedRegionClusters,
    selectedRegionId,
    selections,
    setConfirmOpen,
  ]);

  const handleDiagnose = async () => {
    try {
      const res = await diagnoseTauri();
      console.debug("diagnoseTauri -> result", res);
      setDiagnosticInfo(JSON.stringify(res, null, 2));
    } catch (err) {
      console.debug("diagnoseTauri failed", err);
      setDiagnosticInfo(String(err));
    }
  };

  const handleRegionChange = useCallback(
    (regionId: string) => {
      setSelectedRegionId(regionId);
      saveRegionId(regionId);
    },
    [setSelectedRegionId],
  );

  const handleOpenSettings = useCallback(() => {
    setSettingsModalOpen(true);
  }, [setSettingsModalOpen]);

  const handleOpenClear = useCallback(() => {
    setClearConfirmOpen(true);
  }, [setClearConfirmOpen]);

  const handleRefresh = useCallback(async () => {
    await pingClusters(selectedRegionId);
    await checkGameRunning();
  }, [selectedRegionId, pingClusters, checkGameRunning]);

  const { handlePlayClick } = useGameLauncher(
    game,
    gameRunning,
    killGame,
    checkGameRunning,
    infoModal,
  );

  const sidebarProps = useMemo(
    () => ({
      game,
      selectedRegion,
      onRegionChange: handleRegionChange,
      onCheckHosts: checkHostsConsistency,
      onSettingsClick: handleOpenSettings,
      onClearClick: handleOpenClear,
      onRefreshClick: handleRefresh,
    }),
    [
      game,
      selectedRegion,
      handleRegionChange,
      checkHostsConsistency,
      handleOpenSettings,
      handleOpenClear,
      handleRefresh,
    ],
  );

  const { t } = useTranslation();

  if (isLoadingScreen) {
    return (
      <AnimatePresence mode="wait">
        {isLoadingScreen && (
          <LoadingScreen
            key="loading"
            visible={isLoadingScreen}
            onLoadingComplete={handleLoadingComplete}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>
    );
  }

  return (
    <>
      <AnimatePresence>
        <main
          key="main"
          className={cn("cbm", isMobile && "h-dvh flex flex-col")}
        >
          {isMobile ? <MobileTopBar /> : <Sidebar {...sidebarProps} />}

          <div
            className={cn(
              "inGameContainer",
              isMobile && "flex flex-1 min-h-0 flex-col pb-16",
            )}
          >
            {!isMobile && (
              <>
                <GamePoster
                  posterUrl={posterUrl}
                  tauriAvailable={tauriAvailable}
                  hostsMismatch={hostsMismatch}
                  allBlockedDomains={allBlockedDomains}
                  gameRunning={gameRunning}
                  onCancel={handleCancelEditClusters}
                  onPlayClick={handlePlayClick}
                  onUpdateClick={handleUpdateClick}
                  selectedRegion={selectedRegion}
                  lastTauriError={lastTauriError}
                  mismatchDomains={mismatchDomains}
                />
              </>
            )}

            <div className={cn("inGameOption", isMobile && "flex-1 min-h-0")}>
              {isMobile && (
                <TurnVpnButton
                  hostsMismatch={isMobile ? vpnNeedsApply : hostsMismatch}
                  onToggle={isMobile ? handleToggleVpn : undefined}
                  onUpdateClick={handleUpdateClick}
                />
              )}

              <ClusterBlockingPanel
                clusters={selectedRegionClusters}
                checkedMap={regionMap}
                allBlockedDomains={allBlockedDomains}
                hostsMismatch={hostsMismatch}
                onCancel={handleCancelEditClusters}
                onToggle={handleToggleCluster}
                onSelect={handleSelectCluster}
                onDisableAll={handleDisableClusters}
                onEnableAll={handleEnableClusters}
                selectedRegion={selectedRegion}
                lastTauriError={lastTauriError}
                mismatchDomains={mismatchDomains}
                onUpdate={handleUpdateClick}
              />
            </div>
          </div>

          {isMobile ? <MobileBottomBar {...sidebarProps} /> : undefined}

          {/* Начальная настройка при первом входе */}
          <SetupFirstAppSettings />

          {/* Modals */}

          <InfoModal
            open={infoModal.open}
            onClose={infoModal.closeInfo}
            title={infoModal.title}
            message={infoModal.message}
            isError={infoModal.isError}
          />

          <SettingsModal
            open={settingsModalOpen}
            onClose={() => setSettingsModalOpen(false)}
            onDiagnose={handleDiagnose}
            diagnosticInfo={diagnosticInfo}
          />

          {!isMobile && (
            <>
              <ConfirmModal
                onConfirm={() => handleApplyHosts(confirmDomains)}
                domains={confirmDomains}
                clusters={selectedRegionClusters}
                regionName={
                  selectedRegion?.alias_name ?? selectedRegion?.name ?? ""
                }
                onBlockingAllConfirm={() => setBlockingAllConfirmOpen(true)}
              />

              <BlockingAllConfirmModal
                onConfirm={async () => {
                  setBlockingAllConfirmOpen(false);
                  await handleApplyHosts(confirmDomains);
                }}
                regionName={
                  selectedRegion?.alias_name ?? selectedRegion?.name ?? ""
                }
              />

              <ClearConfirmModal
                onConfirm={handleClearCluster}
                useFirewall={settings.useFirewall}
                useBackup={settings.useBackup}
                loading={loading}
              />

              <AdminModal
                onShowInstructions={() => {
                  setAdminModalOpen(false);
                  infoModal.showInfo(
                    t("modals.how_to_open_app_admin_privilege.title"),
                    t("modals.how_to_open_app_admin_privilege.description"),
                    false,
                  );
                }}
              />
            </>
          )}

          <AboutModal />
        </main>
      </AnimatePresence>
    </>
  );
}

export function AppLayout() {
  return (
    <>
      <TooltipProvider />
      <AppContent />
    </>
  );
}

export default function App() {
  return <AppLayout />;
}
