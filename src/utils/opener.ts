import { openUrl } from "@tauri-apps/plugin-opener";
import { config } from "./config";

export async function openAuthorLink() {
  await openUrl(config.AUTHOR_LINK);
}

export async function openWarpFixPingLoss() {
  await openUrl(config.WARP_FIX_LINK);
}

export async function openGithub() {
  await openUrl(config.GITHUB_URL);
}
