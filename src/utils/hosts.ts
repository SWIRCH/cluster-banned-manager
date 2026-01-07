import { safeInvoke } from "./tauriInvoke";

export async function readHostsFile(): Promise<string | null> {
  try {
    const res: any = await safeInvoke("read_blocked_domains");
    if (Array.isArray(res)) return res.join("\n");
  } catch (e) {
    // ignore
  }
  return null;
}

export function parseHostsDomains(content: string): Set<string> {
  const lines = content.split(/\r?\n/);
  const domains = new Set<string>();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    // split by whitespace, first is IP, rest are domains
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      for (let i = 1; i < parts.length; i++) {
        const d = parts[i].toLowerCase();
        // basic validation
        if (d.includes(".")) domains.add(d);
      }
    }
  }
  return domains;
}

export async function getBlockedDomains(): Promise<Set<string>> {
  try {
    const res: any = await safeInvoke("read_blocked_domains");
    if (Array.isArray(res))
      return new Set(res.map((s: string) => s.toLowerCase()));
  } catch (e) {
    // ignore
  }
  return new Set<string>();
}

export async function updateHostsBlock(
  blockedDomains: string[],
  region?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    await safeInvoke("update_hosts_block", {
      blocked_domains: blockedDomains,
      region,
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, message: String(e) };
  }
}
