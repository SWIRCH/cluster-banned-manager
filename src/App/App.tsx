import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useAppStore } from "../store/useAppStore";

import ClusterMenu from "./components/ClusterMenu";
import GamePoster from "./components/GamePoster";
import SelectiveBlocking from "./components/SelectiveBlocking";
import LoadingScreen from "./components/LoadingScreen";
import Sidebar from "./components/Sidebar";

import {
  ConfirmModal,
  BlockingAllConfirmModal,
  ClearConfirmModal,
  InfoModal,
  SettingsModal,
  AdminModal,
} from "./components/Modals";

import {
  useSettings,
  useSelections,
  useHosts,
  usePing,
  useGameStatus,
  useHostsActions,
  useGamePoster,
  useGameLauncher,
  useInfoModal,
  useClustersLoader,
  useIsMobile,
} from "../hooks";

import { safeInvoke, diagnoseTauri } from "../lib/tauri";
import { getSavedRegionId, saveRegionId } from "../utils/regionStorage";
import { openWarpFixPingLoss } from "../utils/opener";
import { config } from "../utils/config";

import type { Game } from "../types/cluster";
import { showGlobalError } from "../utils/globalError";
import MobileBottomBar from "./components/Mobile/MobileBottomBar";
import MobileTopBar from "./components/Mobile/MobileTopBar";
import TurnVpnButton from "./components/Mobile/TurnVpnButton";

function AppContent() {
  const { clustersData, isLoading: clustersLoading } = useClustersLoader();
  const [isLoadingScreen, setIsLoadingScreen] = useState(clustersLoading);
  const game = clustersData as Game;

  const infoModal = useInfoModal();
  const isMobile = useIsMobile();

  // Zustand Store
  const {
    setGame,
    selectedRegionId,
    setSelectedRegionId,
    adminMounts,
    setAdminMounts,
    diagnosticInfo,
    setDiagnosticInfo,
    confirmOpen,
    confirmDomains,
    setConfirmOpen,
    clearConfirmOpen,
    setClearConfirmOpen,
    blockingAllConfirmOpen,
    setBlockingAllConfirmOpen,
    settingsModalOpen,
    setSettingsModalOpen,
    adminModalOpen,
    setAdminModalOpen,
  } = useAppStore();

  // setGame(game);

  document.body.classList.add(
    isMobile ? "platform-mobile" : "platform-desktop",
  );

  if (isMobile) {
    import("../Styles/mobile.scss");
  } else {
    import("../Styles/desktop.scss");
  }

  useEffect(() => {
    setGame(game);
  }, []);

  // Инициализация выбранного региона при загрузке данных
  useEffect(() => {
    if (!game?.regions || selectedRegionId) return;

    const savedRegionId = getSavedRegionId();
    const regionExists = game.regions.some((c) => c.id === savedRegionId);

    if (savedRegionId && regionExists) {
      setSelectedRegionId(savedRegionId);
    } else {
      const defaultRegion =
        game.regions.find((c) => c.id === "wot_eu") ?? game.regions[0];
      if (defaultRegion) {
        setSelectedRegionId(defaultRegion.id);
      }
    }
  }, [game, selectedRegionId, setSelectedRegionId]);

  const handleRegionChange = (regionId: string) => {
    setSelectedRegionId(regionId);
    saveRegionId(regionId);
  };

  const defaultRegion =
    game?.regions?.find((c) => c.id === "wot_eu") ?? game?.regions?.[0];
  const selectedRegion =
    game?.regions?.find((c) => c.id === selectedRegionId) ?? defaultRegion;
  const selectedRegionClusters = selectedRegion?.clusters ?? [];

  const { settings, updateSetting, loading: settingsLoading } = useSettings();
  const { selections, updateSelection, selectCluster, clearAllSelections } =
    useSelections(game);
  const {
    hostsMismatch,
    mismatchDomains,
    tauriAvailable,
    lastTauriError,
    checkHostsConsistency,
  } = useHosts(selectedRegionId, selections, selectedRegionClusters);
  const { pings, pingClusters } = usePing(selectedRegion);
  const { gameRunning, checkGameRunning, killGame } = useGameStatus();
  const { applyHostsUpdate, clearCluster, loading } = useHostsActions(
    selectedRegionId,
    selections,
    selectedRegionClusters,
    settings,
  );
  const posterUrl = useGamePoster(game);

  const handleLoadingComplete = () => {
    if (config.DEBUG_MODE) {
      console.log("LoadingScreen разрешил закрытие");
    }
    setIsLoadingScreen(false);
  };

  useEffect(() => {
    if (!config.DEBUG_MODE) return undefined;
    if (!settingsLoading && Object.keys(selections).length > 0) {
      console.log(
        "Данные приложения загружены, ожидаем завершения проверки обновлений",
      );
    }
  }, [settingsLoading, selections]);

  // Проверка прав администратора
  useEffect(() => {
    (async () => {
      try {
        const ev: any = await safeInvoke("check_elevation");
        if (ev && ev.isAdmin === false) {
          setAdminMounts(false);
          setAdminModalOpen(true);
          return;
        }
        setAdminMounts(true);
      } catch (e) {
        console.debug("check_elevation failed", e);
      }
    })();
  }, [setAdminMounts, setAdminModalOpen]);

  const regionMap = selections[selectedRegionId] ?? {};
  const selectedDomain =
    Object.keys(regionMap).find((k) => regionMap[k]) ??
    selectedRegionClusters[0]?.domain;

  const handleSelectCluster = (domain: string) => {
    selectCluster(selectedRegionId, domain, selectedRegionClusters);
  };

  const handleToggleCluster = (domain: string, checked: boolean) => {
    updateSelection(selectedRegionId, domain, checked);
  };

  const handleApplyHosts = async (domains?: string[]) => {
    const result = await applyHostsUpdate(domains);
    showGlobalError(result.title, result.message, result.details);
    setConfirmOpen(false);
    if (result.success) {
      await checkHostsConsistency();
    }
  };

  const handleClearCluster = async () => {
    if (!adminMounts) {
      showGlobalError(
        "Ошибка прав администратора",
        "Для очистки блокировок требуется запуск приложения с правами администратора.",
        "Пожалуйста, закройте приложение и запустите его от имени администратора.",
      );
      return;
    }

    const result = await clearCluster();
    setClearConfirmOpen(false);

    if (result.success) {
      await clearAllSelections();
      await checkHostsConsistency();
      await pingClusters(selectedRegionId);
      await checkGameRunning();
    }
  };

  const { handlePlayClick } = useGameLauncher(
    game,
    gameRunning,
    killGame,
    checkGameRunning,
    infoModal,
  );

  const handleUpdateClick = () => {
    const rmap =
      selections[selectedRegionId] ??
      Object.fromEntries(selectedRegionClusters.map((c) => [c.domain, true]));
    const blockedDomains = selectedRegionClusters
      .filter((c) => !rmap[c.domain])
      .map((c) => c.domain);

    setConfirmOpen(true, blockedDomains);
  };

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

  const sidebarProps = {
    game,
    selectedRegion,
    onRegionChange: handleRegionChange,
    onCheckHosts: checkHostsConsistency,
    onSettingsClick: () => setSettingsModalOpen(true),
    onClearClick: () => setClearConfirmOpen(true),
    onRefreshClick: async () => {
      await pingClusters(selectedRegionId);
      await checkGameRunning();
    },
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoadingScreen && (
          <LoadingScreen
            key="loading"
            visible={isLoadingScreen}
            onLoadingComplete={handleLoadingComplete}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!isLoadingScreen && (
          <main id="layer-ingame" key="main">
            {isMobile ? (
              <>
                <MobileTopBar />
                <MobileBottomBar
                  game={game}
                  selectedRegion={selectedRegion}
                  onRegionChange={handleRegionChange}
                />
              </>
            ) : (
              <Sidebar {...sidebarProps} />
            )}
            <div className="inGameContainer">
              {!isMobile && (
                <GamePoster
                  posterUrl={posterUrl}
                  tauriAvailable={tauriAvailable}
                  hostsMismatch={hostsMismatch}
                  gameRunning={gameRunning}
                  onPlayClick={handlePlayClick}
                  onUpdateClick={handleUpdateClick}
                  selectedRegion={selectedRegion}
                  lastTauriError={lastTauriError}
                  mismatchDomains={mismatchDomains}
                />
              )}

              <div className="inGameOption">
                {!isMobile && (
                  <div className="whilecard">
                    <div className="whilecard-title flex justify-between items-center space-y-1 rounded-xl bg-white/5 p-1 sm:p-2">
                      <h3>Выбрать сервер</h3>
                      <p className="pe-2 text-[14px] warp-fix-link">
                        <a
                          onClick={() => openWarpFixPingLoss()}
                          target="_blank"
                          className="link"
                        >
                          Высокий пинг или loss?
                        </a>
                      </p>
                    </div>
                    <div className="content">
                      <div className="ban-clusters-1 mt-1">
                        <ClusterMenu
                          clusters={selectedRegionClusters}
                          selectedDomain={selectedDomain}
                          onSelect={handleSelectCluster}
                          pings={pings}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isMobile && <TurnVpnButton />}

                <SelectiveBlocking
                  clusters={selectedRegionClusters}
                  checkedMap={regionMap}
                  onToggle={handleToggleCluster}
                  pings={pings}
                  isMobile={isMobile}
                />
              </div>
            </div>

            {/* Modals */}
            <ConfirmModal
              open={confirmOpen}
              onClose={() => setConfirmOpen(false)}
              onConfirm={() => handleApplyHosts(confirmDomains)}
              domains={confirmDomains}
              clusters={selectedRegionClusters}
              regionName={
                selectedRegion?.alias_name ?? selectedRegion?.name ?? ""
              }
              onBlockingAllConfirm={() => setBlockingAllConfirmOpen(true)}
            />

            <BlockingAllConfirmModal
              open={blockingAllConfirmOpen}
              onClose={() => setBlockingAllConfirmOpen(false)}
              onConfirm={async () => {
                setBlockingAllConfirmOpen(false);
                await handleApplyHosts(confirmDomains);
              }}
              regionName={
                selectedRegion?.alias_name ?? selectedRegion?.name ?? ""
              }
            />

            <ClearConfirmModal
              open={clearConfirmOpen}
              onClose={() => setClearConfirmOpen(false)}
              onConfirm={handleClearCluster}
              useFirewall={settings.useFirewall}
              useBackup={settings.useBackup}
              loading={loading}
            />

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
              settings={settings}
              onUpdateSetting={updateSetting}
              onDiagnose={handleDiagnose}
              diagnosticInfo={diagnosticInfo}
            />

            <AdminModal
              open={adminModalOpen}
              onShowInstructions={() => {
                setAdminModalOpen(false);
                infoModal.showInfo(
                  "Как запустить с правами администратора",
                  "Запустите приложение от имени администратора (ПКМ → Запуск от имени администратора) или создайте ярлык, в котором в свойствах выберите запуск от имени администратора. После этого нажмите 'Повторить'.",
                  false,
                );
              }}
            />
          </main>
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return <AppContent />;
}
