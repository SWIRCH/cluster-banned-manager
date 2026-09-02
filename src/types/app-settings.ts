import type { Selections } from './selections'

export interface AppSettings {
	useFirewall: boolean
	useBackup: boolean
	backupCount: number
	isSetup?: boolean
	lang: 'ru' | 'en'
	clusterSelections?: Selections
}
