import { create } from "zustand";
import { Game } from "../types";

interface AppState {
  // Region & System
  game: Game | null;
  selectedRegionId: string;
  adminMounts: boolean;
  diagnosticInfo: string | null;

  // Mobile & Vpn
  vpnStatus: "On" | "Off" | "Loading" | "Error" | "NeedsApply";
  vpnDomains: string[];
  vpnBaselineDomains: string[] | null;
  vpnDirty: boolean;

  // Modals state
  confirmOpen: boolean;
  confirmDomains: string[];
  clearConfirmOpen: boolean;
  blockingAllConfirmOpen: boolean;
  settingsModalOpen: boolean;
  adminModalOpen: boolean;
  regionModalOpen: boolean;

  // Actions
  setGame: (game: Game) => void;
  setSelectedRegionId: (id: string) => void;
  setAdminMounts: (isAdmin: boolean) => void;
  setDiagnosticInfo: (info: string | null) => void;

  setVpnStatus: (
    status: "On" | "Off" | "Loading" | "Error" | "NeedsApply",
  ) => void;
  setVpnDomains: (domains: string[]) => void;
  setVpnBaselineDomains: (domains: string[]) => void;
  setVpnDirty: (dirty: boolean) => void;

  // Modal actions
  setConfirmOpen: (open: boolean, domains?: string[]) => void;
  setClearConfirmOpen: (open: boolean) => void;
  setBlockingAllConfirmOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setAdminModalOpen: (open: boolean) => void;
  setRegionModalOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  game: null,
  selectedRegionId: "",
  adminMounts: false,
  diagnosticInfo: null,

  vpnStatus: "Off",
  vpnDomains: [],
  vpnBaselineDomains: null,
  vpnDirty: false,

  confirmOpen: false,
  confirmDomains: [],
  clearConfirmOpen: false,
  blockingAllConfirmOpen: false,
  settingsModalOpen: false,
  adminModalOpen: false,
  regionModalOpen: false,

  setGame: (game) => set({ game, selectedRegionId: game.regions[0]?.id }),
  setSelectedRegionId: (id) => set({ selectedRegionId: id }),
  setAdminMounts: (isAdmin) => set({ adminMounts: isAdmin }),
  setDiagnosticInfo: (info) => set({ diagnosticInfo: info }),

  setVpnStatus: (status) => set({ vpnStatus: status }),
  setVpnDomains: (domains) => set({ vpnDomains: domains }),
  setVpnBaselineDomains: (domains) => set({ vpnBaselineDomains: domains }),
  setVpnDirty: (dirty) => set({ vpnDirty: dirty }),

  setConfirmOpen: (open, domains = []) =>
    set({ confirmOpen: open, confirmDomains: domains }),
  setClearConfirmOpen: (open) => set({ clearConfirmOpen: open }),
  setBlockingAllConfirmOpen: (open) => set({ blockingAllConfirmOpen: open }),
  setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
  setAdminModalOpen: (open) => set({ adminModalOpen: open }),
  setRegionModalOpen: (open) => set({ regionModalOpen: open }),
}));
