import i18n from '@/lib/i18n'
import { AppSettings } from '@/types/app-settings'
import { defaultSettings, loadSettings, saveSettings } from "@/utils/settingsStorage"
import { useCallback, useEffect, useRef, useState } from "react"

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const settingsRef = useRef(settings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    loadSettings()
      .then((loaded) => {
        if (isMounted) {
          settingsRef.current = loaded;
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

  const updateSettings = useCallback(
    async (newPartialSettings: Partial<AppSettings>) => {
      const updatedSettings = { ...settingsRef.current, ...newPartialSettings };
      settingsRef.current = updatedSettings;
      setSettings(updatedSettings);

      if (newPartialSettings.lang) {
        i18n.changeLanguage(newPartialSettings.lang);
      }

      try {
        await saveSettings(updatedSettings);
      } catch (err) {
        console.error("Failed to save settings batch:", err);
      }
    },
    []
  );

  return { settings, updateSettings, loading };
}