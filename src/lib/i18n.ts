import { locale } from '@tauri-apps/plugin-os'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@/locales/en.json'
import ru from '@/locales/ru.json'

import { logger } from '@/utils/logger'
import { loadSettings } from '@/utils/settingsStorage'

const resources = {
	en: { translation: en },
	ru: { translation: ru }
}

export async function getInitialLanguage(): Promise<string> {
	// 1. Пробуем загрузить язык из сохраненных настроек приложения
	try {
		const settings = await loadSettings()
		if (settings && settings.lang) {
			logger.log('Язык загружен из настроек:', settings.lang)
			return settings.lang
		}
	} catch (e) {
		logger.error('Ошибка при чтении настроек для i18n:', e)
	}

	// 2. Если языка в настройках нет (первый запуск), определяем системный
	const timeout = new Promise<null>(resolve =>
		setTimeout(() => resolve(null), 300)
	)

	try {
		const systemLocale = await Promise.race([locale(), timeout])
		logger.log('Ответ от @tauri-os::locale():', systemLocale)

		if (systemLocale && systemLocale.toLowerCase().startsWith('ru')) {
			return 'ru'
		}
	} catch (e) {
		logger.error('Ошибка при получении локали из Tauri:', e)
	}

	if (typeof window !== 'undefined' && navigator.language) {
		logger.log(
			'Использование языка из браузерного окружения:',
			navigator.language
		)
		if (navigator.language.toLowerCase().startsWith('ru')) {
			return 'ru'
		}
	}

	return 'en'
}

export async function initI18n() {
	const initialLang = await getInitialLanguage()

	await i18n.use(initReactI18next).init({
		resources,
		lng: initialLang,
		fallbackLng: 'en',
		interpolation: {
			escapeValue: false
		}
	})

	return i18n
}

initI18n()

export default i18n
