import type { Selections } from "./selections";

export type SyncModeType = "hybrid" | "local" | "server";
export type LangType = "ru" | "en";

export interface AppSettings {
  useFirewall: boolean;
  useBackup: boolean;
  backupCount: number;
  syncMode: SyncModeType;
  lang: LangType;
  isSetup?: boolean;
  clusterSelections?: Selections;
}
