import type { Cluster, Game } from "../types/cluster"
import type { Selections } from "../types/selections"

export function collectBlockedDomains(
  game: Game | null | undefined,
  selections: Selections,
): string[] {
  if (!game?.regions) return [];
  const domains = new Set<string>();

  for (const region of game.regions) {
    const regionMap = selections[region.id] || {};
    for (const cluster of region.clusters ?? []) {
      const enabled =
        regionMap[cluster.domain] !== undefined
          ? regionMap[cluster.domain]
          : true;
      if (!enabled) {
        domains.add(cluster.domain);
      }
    }
  }

  const result = Array.from(domains).sort();
  // console.log("[blocking] Total blocked domains:", result);
  return result;
}

export function collectBlockedIps(
  clusters: Cluster[],
  blockedDomains: string[],
): string[] {
  const blocked = new Set(blockedDomains.map((domain) => domain.toLowerCase()));
  const ips = new Set<string>();
  for (const cluster of clusters) {
    if (!blocked.has(cluster.domain.toLowerCase())) continue;
    for (const ip of cluster.ips ?? []) {
      const trimmed = ip.trim();
      if (isIpv4(trimmed)) ips.add(trimmed);
    }
  }
  return Array.from(ips).sort();
}

export function allGameClusters(game: Game | null | undefined): Cluster[] {
  return game?.regions?.flatMap((region) => region.clusters ?? []) ?? [];
}

function isIpv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const octet = Number(part);
    return octet >= 0 && octet <= 255;
  });
}
