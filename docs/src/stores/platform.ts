import { atom } from "nanostores";

export type PlatformKey = "windows" | "android" | "ios";

export const activePlatform = atom<PlatformKey>("windows");
