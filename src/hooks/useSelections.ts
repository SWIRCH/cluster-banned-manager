import type { Game } from '@/types/cluster'
import type { Selections } from '@/types/selections'
import type { AppSettings } from '@/types/app-settings'
import { useEffect, useState } from 'react'

function createDefaultSelections(game: Game): Selections {
	return Object.fromEntries(
		game.regions.map(region => [
			region.id,
			Object.fromEntries(
				(region.clusters ?? []).map(cluster => [cluster.domain, true])
			)
		])
	)
}

function normalizeSelections(game: Game, stored?: Selections): Selections {
	return Object.fromEntries(
		game.regions.map(region => [
			region.id,
			Object.fromEntries(
				(region.clusters ?? []).map(cluster => [
					cluster.domain,
					stored?.[region.id]?.[cluster.domain] ?? true
				])
			)
		])
	)
}

export function useSelections(
	game: Game,
	settings: AppSettings,
	updateSettings: (settings: Partial<AppSettings>) => Promise<void>,
	settingsLoading: boolean
) {
	const [selections, setSelections] = useState<Selections>({})

	useEffect(() => {
		if (settingsLoading) return

		const next = normalizeSelections(game, settings.clusterSelections)
		setSelections(next)
	}, [game, settings.clusterSelections, settingsLoading, updateSettings])

	const updateSelection = (
		regionId: string,
		domain: string,
		checked: boolean
	) => {
		setSelections(prev => {
			const prevRegion = prev[regionId] ?? {}
			const newRegion = { ...prevRegion, [domain]: checked }
			const next = { ...prev, [regionId]: newRegion }
			return next
		})
	}

	const selectCluster = (regionId: string, domain: string, clusters: any[]) => {
		setSelections(prev => {
			const newRegion = Object.fromEntries(
				clusters.map(c => [c.domain, c.domain === domain])
			)
			const next = { ...prev, [regionId]: newRegion }
			return next
		})
	}

	const clearAllSelections = async () => {
		const defaults = createDefaultSelections(game)
		setSelections(defaults)
		return defaults
	}

	const persistSelections = async (next: Selections) => {
		await updateSettings({ clusterSelections: next })
	}

	return {
		selections,
		setSelections,
		updateSelection,
		selectCluster,
		clearAllSelections,
		persistSelections
	}
}
