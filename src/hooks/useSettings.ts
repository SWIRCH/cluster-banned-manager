import { useSettingsStore } from "@/store/useSettingsStore";

export function useSettings() {
  const settings = useSettingsStore((s) => s.settings);
  const loading = useSettingsStore((s) => s.loading);
  const update = useSettingsStore((s) => s.update);
  return { settings, updateSettings: update, loading };
}
