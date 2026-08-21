import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

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
} from "../hooks";

import { safeInvoke, diagnoseTauri } from "../lib/tauri";
import { getSavedRegionId, saveRegionId } from "../utils/regionStorage";
import { openWarpFixPingLoss } from "../utils/opener";
import { config } from "../utils/config";

import type { Game } from "../types/cluster";
import { showGlobalError } from "../utils/globalError";
import { useIsMobile } from "../hooks/useIsMobile";
import MobileBottomBar from "./components/MobileBottomBar";
import MobileTopBar from "./components/MobileTopBar";

function AppContent() {
  const { clustersData, isLoading: clustersLoading } = useClustersLoader();
  const [isLoadingScreen, setIsLoadingScreen] = useState(clustersLoading);
  const game = clustersData as Game;

  const infoModal = useInfoModal();
  const isMobile = useIsMobile();

  document.body.classList.add(
    isMobile ? "platform-mobile" : "platform-desktop",
  );

  if (isMobile) {
    import("../Styles/mobile.scss");
  } else {
    import("../Styles/desktop.scss");
  }

  const getInitialRegionId = (): string => {
    const savedRegionId = getSavedRegionId();
    if (savedRegionId && game?.clusters) {
      const regionExists = game.clusters.some((c) => c.id === savedRegionId);
      if (regionExists) {
        return savedRegionId;
      }
    }

    const defaultRegion =
      game?.clusters?.find((c) => c.id === "wot_eu") ?? game?.clusters?.[0];

    return defaultRegion?.id ?? "";
  };

  const [selectedRegionId, setSelectedRegionId] =
    useState<string>(getInitialRegionId());

  const handleRegionChange = (regionId: string) => {
    setSelectedRegionId(regionId);
    saveRegionId(regionId);
  };

  const [adminMounts, setAdminMounts] = useState<boolean>(false);

  const defaultRegion =
    game?.clusters?.find((c) => c.id === "wot_eu") ?? game?.clusters?.[0];
  const selectedRegion =
    game?.clusters?.find((c) => c.id === selectedRegionId) ?? defaultRegion;
  const clusters = selectedRegion?.clusters ?? [];

  const { settings, updateSetting, loading: settingsLoading } = useSettings();
  const { selections, updateSelection, selectCluster, clearAllSelections } =
    useSelections(game);
  const {
    hostsMismatch,
    mismatchDomains,
    tauriAvailable,
    lastTauriError,
    checkHostsConsistency,
  } = useHosts(selectedRegionId, selections, clusters);
  const { pings, pingClusters } = usePing(selectedRegion);
  const { gameRunning, checkGameRunning, killGame } = useGameStatus();
  const { applyHostsUpdate, clearCluster, loading } = useHostsActions(
    selectedRegionId,
    selections,
    clusters,
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

  // Check for admin rights on mount
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
  }, []);

  const regionMap = selections[selectedRegionId] ?? {};
  const selectedDomain =
    Object.keys(regionMap).find((k) => regionMap[k]) ?? clusters[0]?.domain;

  // Modal states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDomains, setConfirmDomains] = useState<string[]>([]);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [blockingAllConfirmOpen, setBlockingAllConfirmOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<string | null>(null);

  const handleSelectCluster = (domain: string) => {
    selectCluster(selectedRegionId, domain, clusters);
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
      Object.fromEntries(clusters.map((c) => [c.domain, true]));
    const blockedDomains = clusters
      .filter((c) => !rmap[c.domain])
      .map((c) => c.domain);
    setConfirmDomains(blockedDomains);
    setConfirmOpen(true);
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
                <MobileTopBar {...sidebarProps} />
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
                        clusters={clusters}
                        selectedDomain={selectedDomain}
                        onSelect={handleSelectCluster}
                        pings={pings}
                      />
                    </div>
                  </div>
                </div>
                <SelectiveBlocking
                  clusters={clusters}
                  checkedMap={regionMap}
                  onToggle={handleToggleCluster}
                  pings={pings}
                />
              </div>
            </div>

            {/* Modals */}
            <ConfirmModal
              open={confirmOpen}
              onClose={() => setConfirmOpen(false)}
              onConfirm={() => handleApplyHosts(confirmDomains)}
              domains={confirmDomains}
              clusters={clusters}
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
