import i18n from "@/lib/i18n";
import { AppSettings } from "@/types/app-settings";
import {
  defaultSettings,
  loadSettings,
  saveSettings,
} from "@/utils/settingsStorage";
import { create } from "zustand";

interface SettingsState {
  settings: AppSettings;
  loading: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  loading: true,

  load: async () => {
    set({ loading: true });
    try {
      const loaded = await loadSettings();
      set({ settings: loaded, loading: false });
      // синхронизируем i18n с загруженным языком
      if (loaded.lang) i18n.changeLanguage(loaded.lang);
    } catch (err) {
      console.error("Failed to load settings:", err);
      set({ loading: false });
    }
  },

  update: async (patch) => {
    const next = { ...get().settings, ...patch };

    // 1) оптимистично применяем локально
    set({ settings: next });

    // 2) язык — сразу, не дожидаясь бэка
    if (patch.lang) i18n.changeLanguage(patch.lang);

    // 3) сохраняем
    try {
      await saveSettings(next);

      // 4) перечитываем, чтобы гарантированно синхронизировать
      const fresh = await loadSettings();
      set({ settings: fresh });
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  },
}));

// Однократная загрузка при старте приложения
let loaded = false;
export function bootstrapSettings() {
  if (loaded) return;
  loaded = true;
  useSettingsStore.getState().load();
}
