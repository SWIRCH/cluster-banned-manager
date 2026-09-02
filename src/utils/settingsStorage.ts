import { safeInvoke } from '@/lib/tauri'
import { AppSettings } from '@/types/app-settings'

export const defaultSettings: AppSettings = {
	useFirewall: true,
	useBackup: false,
	backupCount: 5,
	isSetup: false,
	lang: 'ru' as 'ru' | 'en'
}

export async function loadSettings(): Promise<AppSettings> {
	try {
		const settings = await safeInvoke<AppSettings>('get_settings')
		return {
			...defaultSettings,
			...settings
		}
	} catch (error) {
		console.error('Failed to load settings:', error)
		return defaultSettings
	}
}

export async function saveSettings(settings: AppSettings): Promise<void> {
	try {
		await safeInvoke('save_settings', { settings })
	} catch (error) {
		console.error('Failed to save settings:', error)
		throw error
	}
}
