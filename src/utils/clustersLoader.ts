import clustersDataLocal from '@/data/servers.json'
import { config } from '@/utils/config'
import { showGlobalError } from './globalError'
import { logger } from './logger'

export function normalizeClustersData(data: unknown): GameData {
	if (!data || typeof data !== 'object') return EMPTY_GAME

	const value = data as Record<string, unknown>
	const regions = Array.isArray(value.regions)
		? value.regions
		: Array.isArray(value.clusters)
			? value.clusters
			: []

	return {
		appId: Number(value.appId ?? value.id ?? 444200),
		alias_name: String(value.alias_name ?? 'wot_blitz'),
		name: String(value.name ?? 'World of Tanks Blitz'),
		name_key: typeof value.name_key === 'string' ? value.name_key : undefined,
		icon: String(value.icon ?? '/Games/444200/mini.png'),
		posters: Array.isArray(value.posters) ? value.posters.map(String) : [],
		regions: regions.filter(isObject).map(region => ({
			id: String(region.id ?? ''),
			name: String(region.name ?? region.id ?? ''),
			name_key:
				typeof region.name_key === 'string' ? region.name_key : undefined,
			alias_name:
				typeof region.alias_name === 'string' ? region.alias_name : undefined,
			icon: String(region.icon ?? '/Games/444200/356.png'),
			flag_icon: String(region.flag_icon ?? ''),
			clusters: Array.isArray(region.clusters)
				? region.clusters.filter(isObject).map(cluster => ({
						id: String(cluster.id ?? ''),
						domain: String(cluster.domain ?? ''),
						location:
							typeof cluster.location === 'string'
								? cluster.location
								: undefined,
						location_key:
							typeof cluster.location_key === 'string'
								? cluster.location_key
								: undefined,
						ips: Array.isArray(cluster.ips) ? cluster.ips.map(String) : []
					}))
				: []
		}))
	}
}

type GameData = {
	appId: number
	alias_name: string
	name: string
	name_key?: string
	icon: string
	posters: string[]
	regions: Array<{
		id: string
		name: string
		name_key?: string
		alias_name?: string
		icon: string
		flag_icon: string
		clusters: Array<{
			id: string
			domain: string
			location?: string
			location_key?: string
			ips: string[]
		}>
	}>
}

const EMPTY_GAME: GameData = {
	appId: 444200,
	alias_name: 'wot_blitz',
	name: 'World of Tanks Blitz',
	icon: '/Games/444200/mini.png',
	posters: [],
	regions: []
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

export const LOCAL_CLUSTERS = normalizeClustersData(clustersDataLocal)

const GITHUB_URL =
	'https://raw.githubusercontent.com/SWIRCH/cluster-banned-manager/refs/heads/main/src/data/servers.json'

export async function loadClustersFromGitHub() {
	try {
		if (config.DEBUG_MODE === true) return

		const response = await fetch(GITHUB_URL)

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		const data = await response.json()
		return normalizeClustersData(data)
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error)
		logger.error('❌ GitHub load failed:', errorMsg)

		showGlobalError(
			'Ошибка загрузки данных',
			'Не удалось загрузить список серверов с GitHub. Используется локальная версия.',
			errorMsg,
			() => window.location.reload()
		)

		return null
	}
}

export async function loadClustersFromLocal() {
	try {
		logger.log('🔄 Загрузка локальных данных...')
		logger.log('✅ Локальные данные загружены')
		return LOCAL_CLUSTERS
	} catch (error) {
		logger.error('❌ Local load failed:', error)
		return LOCAL_CLUSTERS
	}
}
