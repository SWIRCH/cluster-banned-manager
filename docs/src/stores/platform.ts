import { atom } from "nanostores";

export type PlatformKey = "windows" | "android" | "ios" | "macos";

export const activePlatform = atom<PlatformKey>("windows");
