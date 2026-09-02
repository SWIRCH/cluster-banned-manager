import i18n from '@/lib/i18n'
import { AppSettings } from '@/types/app-settings'
import { defaultSettings, loadSettings, saveSettings } from "@/utils/settingsStorage"
import { useCallback, useEffect, useState } from "react"

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    loadSettings()
      .then((loaded) => {
        if (isMounted) {
          setSettings(loaded);
        }
      })
      .catch((err) => console.error("Failed to load settings:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getSetting = useCallback(
    <K extends keyof AppSettings>(key: K): AppSettings[K] => {
      return settings[key];
    },
    [settings]
  );

  const updateSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      let nextSettings: AppSettings | null = null;

      // 1. Атомарно создаем новый объект на основе САМОГО АКТУАЛЬНОГО prev
      setSettings((prev) => {
        nextSettings = { ...prev, [key]: value };
        return nextSettings;
      });

      if (key === "lang" && typeof value === "string") {
        i18n.changeLanguage(value);
      }

      // 2. Отправляем в Rust ТОЧНО сгенерированный объект
      if (nextSettings) {
        try {
          await saveSettings(nextSettings);
        } catch (err) {
          console.error(`Failed to save setting ${String(key)}:`, err);
        }
      }
    },
    []
  );

  const updateSettings = useCallback(
    async (newPartialSettings: Partial<AppSettings>) => {
      let updatedSettings: AppSettings;

      setSettings((prev) => {
        updatedSettings = { ...prev, ...newPartialSettings };
        return updatedSettings;
      });

      if (newPartialSettings.lang) {
        i18n.changeLanguage(newPartialSettings.lang);
      }

      try {
        await saveSettings(updatedSettings!);
      } catch (err) {
        console.error("Failed to save settings batch:", err);
      }
    },
    []
  );

  return { settings, getSetting, updateSetting, updateSettings, loading };
}