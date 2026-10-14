import type { PingInfo, PingMap } from "@/types/ping";
import { IDLE_PING } from "@/types/ping";
import { create } from "zustand";

type PingStore = {
  pings: PingMap;
  patchPings: (updates: Record<string, Partial<PingInfo>>) => void;
  mergePings: (updater: (prev: PingMap) => PingMap) => void;
};

export const usePingStore = create<PingStore>((set) => ({
  pings: {},
  patchPings: (updates) =>
    set((s) => {
      const next = { ...s.pings };

      for (const [domain, partial] of Object.entries(updates)) {
        next[domain] = { ...(next[domain] ?? IDLE_PING), ...partial };
      }

      return { pings: next };
    }),
  mergePings: (updater) => set((s) => ({ pings: updater(s.pings) })),
}));
