import { useAppStore } from '@/store/useAppStore'
import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

import ClusterMenu from './components/ClusterMenu'
import GamePoster from './components/GamePoster'
import LoadingScreen from './components/LoadingScreen'
import SelectiveBlocking from './components/SelectiveBlocking'
import Sidebar from './components/Sidebar'

import {
	AboutModal,
	AdminModal,
	BlockingAllConfirmModal,
	ClearConfirmModal,
	ConfirmModal,
	InfoModal,
	SettingsModal
} from './components/modals'

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
	useSettings
} from './hooks'

import { collectBlockedDomains } from '@/utils/blocking'
import { config } from '@/utils/config'
import { openWarpFixPingLoss } from '@/utils/opener'
import { getSavedRegionId, saveRegionId } from '@/utils/regionStorage'
import {
	diagnoseTauri,
	vpnStatus as getVpnStatus,
	safeInvoke
} from './lib/tauri'

import '@/lib/vpnListener'
import type { Game } from '@/types/cluster'
import { logger } from '@/utils/logger'
import MobileBottomBar from './components/mobile/BottomBar'
import MobileTopBar from './components/mobile/TopBar'
import TurnVpnButton from './components/mobile/TurnVpnButton'
import SetupFirstAppSettings from './components/modals/SetupFirstAppSettings'
import { hideGlobalError, showGlobalError } from './utils/globalError'
import { useTranslation } from 'react-i18next'

// Styles
import('@/styles/mobile.scss')
import('@/styles/desktop.scss')

function AppContent() {
	const { clustersData, isLoading: clustersLoading } = useClustersLoader()
	const [isLoadingScreen, setIsLoadingScreen] = useState(clustersLoading)
	const game = clustersData as Game

	const infoModal = useInfoModal()
	const isMobile = useIsMobile()

	// Zustand Store
	const {
		setGame,
		selectedRegionId,
		setSelectedRegionId,
		adminMounts,
		isSetup,
		setAdminMounts,
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
		setVpnStatus,
		setVpnDomains,
		vpnStatus: currentVpnStatus,
		vpnBaselineDomains,
		setVpnBaselineDomains,
		vpnDirty,
		setVpnDirty
	} = useAppStore()

	document.body.classList.add(isMobile ? 'platform-mobile' : 'platform-desktop')

	useEffect(() => {
		setGame(game)
	}, [])

	// Инициализация выбранного региона при загрузке данных
	useEffect(() => {
		if (!game?.regions || selectedRegionId) return

		const savedRegionId = getSavedRegionId()
		const regionExists = game.regions.some(c => c.id === savedRegionId)

		if (savedRegionId && regionExists) {
			setSelectedRegionId(savedRegionId)
		} else {
			const defaultRegion =
				game.regions.find(c => c.id === 'wot_eu') ?? game.regions[0]
			if (defaultRegion) {
				setSelectedRegionId(defaultRegion.id)
			}
		}
	}, [game, selectedRegionId, setSelectedRegionId])

	const handleRegionChange = (regionId: string) => {
		setSelectedRegionId(regionId)
		saveRegionId(regionId)
	}

	const defaultRegion =
		game?.regions?.find(c => c.id === 'wot_eu') ?? game?.regions?.[0]
	const selectedRegion =
		game?.regions?.find(c => c.id === selectedRegionId) ?? defaultRegion
	const selectedRegionClusters = selectedRegion?.clusters ?? []

	const { settings, updateSetting, loading: settingsLoading } = useSettings()
	const { selections, updateSelection, selectCluster, clearAllSelections } =
		useSelections(game)
	const {
		hostsMismatch,
		mismatchDomains,
		tauriAvailable,
		lastTauriError,
		checkHostsConsistency
	} = useHosts(selectedRegionId, selections, selectedRegionClusters)
	const { pings, pingClusters } = usePing(selectedRegion, isMobile)
	const { gameRunning, checkGameRunning, killGame } = useGameStatus()
	const { applyHostsUpdate, clearCluster, stopVpn, loading } = useHostsActions(
		selectedRegionId,
		selections,
		selectedRegionClusters,
		settings,
		isMobile,
		game
	)
	const posterUrl = useGamePoster(game)

	useEffect(() => {
		if (!isMobile) return

		getVpnStatus()
			.then(status => {
				setVpnStatus(status.state === 'on' ? 'On' : 'Off')
				setVpnDomains(status.domains)
			})
			.catch(() => {
				setVpnStatus('Off')
				setVpnDomains([])
			})
	}, [isMobile, setVpnDomains, setVpnStatus])

	const handleLoadingComplete = () => {
		logger.log('LoadingScreen разрешил закрытие')
		setIsLoadingScreen(false)
	}

	useEffect(() => {
		if (!config.DEBUG_MODE) return
		if (!settingsLoading && Object.keys(selections).length > 0) {
			logger.log(
				'Данные приложения загружены, ожидаем завершения проверки обновлений'
			)
		}
	}, [settingsLoading, selections])

	useEffect(() => {
		if (!settingsLoading && settings.isSetup !== undefined) {
			setIsSetup(settings.isSetup)
		}
	}, [settingsLoading, settings.isSetup, setIsSetup])

	useEffect(() => {
		if (settingsLoading) return
		;(async () => {
			try {
				const ev: any = await safeInvoke('check_elevation')
				if (ev && ev.isAdmin === false) {
					setAdminMounts(false)
					if (settings.isSetup || isSetup) {
						setAdminModalOpen(true)
					}
					return
				}
				setAdminMounts(true)
			} catch (e) {
				console.debug('check_elevation failed', e)
			}
		})()
	}, [
		settingsLoading,
		settings.isSetup,
		isSetup,
		setAdminMounts,
		setAdminModalOpen
	])

	useEffect(() => {
		if (isSetup) {
			safeInvoke('check_elevation').then((ev: any) => {
				if (ev && ev.isAdmin === false) {
					setAdminModalOpen(true)
				}
			})
		}
	}, [isSetup, setAdminModalOpen])

	const regionMap = selections[selectedRegionId] ?? {}
	const allBlockedDomains = collectBlockedDomains(game, selections)
	const allBlockedDomainsKey = JSON.stringify(allBlockedDomains)

	useEffect(() => {
		if (
			!isMobile ||
			Object.keys(selections).length === 0 ||
			vpnBaselineDomains
		) {
			return
		}
		setVpnBaselineDomains(JSON.parse(allBlockedDomainsKey))
	}, [
		allBlockedDomainsKey,
		isMobile,
		selections,
		setVpnBaselineDomains,
		vpnBaselineDomains
	])

	useEffect(() => {
		if (!isMobile || !vpnBaselineDomains) return
		setVpnDirty(allBlockedDomainsKey !== JSON.stringify(vpnBaselineDomains))
	}, [allBlockedDomainsKey, isMobile, setVpnDirty, vpnBaselineDomains])

	const vpnNeedsApply = isMobile && vpnDirty
	const selectedDomain =
		Object.keys(regionMap).find(k => regionMap[k]) ??
		selectedRegionClusters[0]?.domain

	const handleSelectCluster = (domain: string) => {
		selectCluster(selectedRegionId, domain, selectedRegionClusters)
	}

	const handleToggleCluster = (domain: string, checked: boolean) => {
		updateSelection(selectedRegionId, domain, checked)
	}

	const handleApplyHosts = async (domains?: string[]) => {
		const result = await applyHostsUpdate(domains, currentVpnStatus === 'On')
		if (!isMobile || !result.success) {
			showGlobalError(result.title, result.message, result.details)
			if (isMobile) {
				window.setTimeout(hideGlobalError, 3000)
			}
		}
		setConfirmOpen(false)
		if (result.success) {
			await checkHostsConsistency()
		}
	}

	const handleToggleVpn = async () => {
		if (currentVpnStatus === 'On') {
			await stopVpn()
			return
		}

		if (allBlockedDomains.length === 0) {
			showGlobalError(
				'VPN не включён',
				'У вас нет ни одной блокировки кластеров.'
			)
			window.setTimeout(hideGlobalError, 3000)
			return
		}

		const result = await applyHostsUpdate(allBlockedDomains, true)
		if (!result.success) {
			showGlobalError(result.title, result.message, result.details)
			window.setTimeout(hideGlobalError, 3000)
		}
	}

	const handleClearCluster = async () => {
		if (!isMobile && !adminMounts) {
			showGlobalError(
				'Ошибка прав администратора',
				'Для очистки блокировок требуется запуск приложения с правами администратора.',
				'Пожалуйста, закройте приложение и запустите его от имени администратора.'
			)
			return
		}

		const result = await clearCluster()
		setClearConfirmOpen(false)

		if (result.success) {
			await clearAllSelections()
			await checkHostsConsistency()
			await pingClusters(selectedRegionId)
			await checkGameRunning()
		}
	}

	const { handlePlayClick } = useGameLauncher(
		game,
		gameRunning,
		killGame,
		checkGameRunning,
		infoModal
	)

	const handleUpdateClick = () => {
		const rmap =
			selections[selectedRegionId] ??
			Object.fromEntries(selectedRegionClusters.map(c => [c.domain, true]))
		const blockedDomains = selectedRegionClusters
			.filter(c => !rmap[c.domain])
			.map(c => c.domain)

		if (!isMobile) {
			setConfirmOpen(true, blockedDomains)
		} else {
			handleApplyHosts()
		}
	}

	const handleDiagnose = async () => {
		try {
			const res = await diagnoseTauri()
			console.debug('diagnoseTauri -> result', res)
			setDiagnosticInfo(JSON.stringify(res, null, 2))
		} catch (err) {
			console.debug('diagnoseTauri failed', err)
			setDiagnosticInfo(String(err))
		}
	}

	const sidebarProps = {
		game,
		selectedRegion,
		onRegionChange: handleRegionChange,
		onCheckHosts: checkHostsConsistency,
		onSettingsClick: () => setSettingsModalOpen(true),
		onClearClick: () => setClearConfirmOpen(true),
		onRefreshClick: async () => {
			await pingClusters(selectedRegionId)
			await checkGameRunning()
		}
	}

	const { t } = useTranslation()

	return (
		<>
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
			<AnimatePresence>
				{!isLoadingScreen && (
					<main
						id="layer-ingame"
						key="main"
						className={`${isMobile ? 'h-dvh flex flex-col' : undefined}`}
					>
						{isMobile ? <MobileTopBar /> : <Sidebar {...sidebarProps} />}

						<div
							className={`inGameContainer ${isMobile ? 'flex flex-1 min-h-0 flex-col pb-16' : undefined}`}
						>
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

							<div
								className={`inGameOption ${isMobile ? 'flex-1 min-h-0' : undefined}`}
							>
								{!isMobile && (
									<div className="whilecard">
										<div className="whilecard-title flex justify-between items-center space-y-1 rounded-xl bg-white/5 p-1 sm:p-2">
											<h3>{t('common.select_server')}</h3>
											<p className="pe-2 text-[14px] warp-fix-link">
												<a
													onClick={() => openWarpFixPingLoss()}
													target="_blank"
													className="link"
												>
													{t('ads.warp-fix')}
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

								{isMobile && (
									<TurnVpnButton
										hostsMismatch={isMobile ? vpnNeedsApply : hostsMismatch}
										onToggle={isMobile ? handleToggleVpn : undefined}
										onUpdateClick={handleUpdateClick}
									/>
								)}

								<SelectiveBlocking
									clusters={selectedRegionClusters}
									checkedMap={regionMap}
									onToggle={handleToggleCluster}
									pings={pings}
									isMobile={isMobile}
								/>
							</div>
						</div>

						{isMobile ? <MobileBottomBar {...sidebarProps} /> : undefined}

						{/* Начальная настройка при первом входе */}
						<SetupFirstAppSettings />

						{/* Modals */}
						<ConfirmModal
							onConfirm={() => handleApplyHosts(confirmDomains)}
							domains={confirmDomains}
							clusters={selectedRegionClusters}
							regionName={
								selectedRegion?.alias_name ?? selectedRegion?.name ?? ''
							}
							onBlockingAllConfirm={() => setBlockingAllConfirmOpen(true)}
						/>

						<BlockingAllConfirmModal
							onConfirm={async () => {
								setBlockingAllConfirmOpen(false)
								await handleApplyHosts(confirmDomains)
							}}
							regionName={
								selectedRegion?.alias_name ?? selectedRegion?.name ?? ''
							}
						/>

						<ClearConfirmModal
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
							onDiagnose={handleDiagnose}
							diagnosticInfo={diagnosticInfo}
							isMobile={isMobile}
						/>

						<AdminModal
							onShowInstructions={() => {
								setAdminModalOpen(false)
								infoModal.showInfo(
									'Как запустить с правами администратора',
									"Запустите приложение от имени администратора (ПКМ → Запуск от имени администратора) или создайте ярлык, в котором в свойствах выберите запуск от имени администратора. После этого нажмите 'Повторить'.",
									false
								)
							}}
						/>

						{isMobile && <AboutModal />}
					</main>
				)}
			</AnimatePresence>
		</>
	)
}

export default function App() {
	return <AppContent />
}
