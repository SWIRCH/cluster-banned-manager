import {
  clearFirewallRules,
  safeInvoke,
  updateFirewallRules,
  vpnStart,
  vpnStop,
} from "@/lib/tauri"
import { useAppStore } from "@/store/useAppStore"
import type { Cluster, Game } from "@/types/cluster"
import type { Selections } from "@/types/selections"
import type { AppSettings } from "@/types/app-settings"
import {
  allGameClusters,
  collectBlockedDomains,
  collectBlockedIps,
} from "@/utils/blocking"
import { useState } from "react"

export function useHostsActions(
  selectedRegionId: string,
  selections: Selections,
  clusters: Cluster[],
  settings: AppSettings,
  isMobile = false,
  game?: Game | null,
) {
  const [loading, setLoading] = useState(false);
  const { setVpnStatus, setVpnDomains, setVpnBaselineDomains, setVpnDirty } =
    useAppStore();

  const getBlockedDomains = () => {
    if (isMobile) {
      return collectBlockedDomains(game, selections);
    }
    const regionMap =
      selections[selectedRegionId] ??
      Object.fromEntries(clusters.map((cluster) => [cluster.domain, true]));
    return clusters
      .filter((cluster) => regionMap[cluster.domain] === false)
      .map((cluster) => cluster.domain)
      .sort();
  };

  const getIpsForDomains = (blockedDomains: string[]) =>
    collectBlockedIps(
      isMobile ? allGameClusters(game) : clusters,
      blockedDomains,
    );

  const applyHostsUpdate = async (
    blockedDomains?: string[],
    keepVpnRunning = true,
  ) => {
    let domains = blockedDomains ?? getBlockedDomains();

    let isRemoval = false;

    if (isMobile) {
      if (domains.length === 0) {
        setLoading(true);
        try {
          const response = await vpnStop();
          setVpnStatus("Off");
          setVpnDomains(response.domains);
          setVpnBaselineDomains([]);
          setVpnDirty(false);
          return {
            success: true,
            title: "VPN выключен",
            message: "Нет кластеров для блокировки — VPN остановлен.",
            details: undefined,
          };
        } catch (error) {
          setVpnStatus("Error");
          return {
            success: false,
            title: "Ошибка VPN",
            message: "Не удалось остановить VPN.",
            details: String(error),
          };
        } finally {
          setLoading(false);
        }
      }

      setLoading(true);
      try {
        const response =
          domains.length && keepVpnRunning
            ? await vpnStart(domains, getIpsForDomains(domains))
            : await vpnStop();

        if (response.state === "needsPermission") {
          setVpnStatus("NeedsApply");
          return {
            success: false,
            title: "Требуется разрешение VPN",
            message: "Разрешите VPN-доступ Android и повторите применение.",
            details: undefined,
          };
        }

        if (response.state !== "on" && response.state !== "off") {
          throw new Error(`VPN returned state: ${response.state}`);
        }

        setVpnStatus(response.state === "on" ? "On" : "Off");
        setVpnDomains(response.domains);
        setVpnBaselineDomains(getBlockedDomains());
        setVpnDirty(false);
        return {
          success: true,
          title: response.state === "on" ? "VPN включён" : "VPN выключен",
          message:
            response.state === "on"
              ? `DNS-блокировка применена для ${response.domains.length} доменов.`
              : "DNS-блокировка остановлена.",
          details: undefined,
        };
      } catch (error) {
        setVpnStatus("Error");
        return {
          success: false,
          title: "Ошибка VPN",
          message: "Не удалось применить DNS-блокировку Android.",
          details: String(error),
        };
      } finally {
        setLoading(false);
      }
    }

    if (domains.length === 0 && clusters.length > 0) {
      const regionMap = selections[selectedRegionId] ?? {};
      const allServersUnchecked = clusters.every(
        (cluster) => regionMap[cluster.domain] === false,
      );
      if (allServersUnchecked) {
        domains = clusters.map((cluster) => cluster.domain);
      }
    }

    if (domains.length === 0) {
      try {
        const persistedRegion = settings.clusterSelections?.[selectedRegionId] ?? {};
        const toRemove = clusters
          .filter((c) => persistedRegion[c.domain] === false)
          .map((c) => c.domain);
        if (toRemove.length === 0) {
          return {
            success: false,
            title: "Нет доменов для обновления",
            message: "В текущем регионе нет доменов для обновления.",
            details: undefined,
          };
        }
        domains = toRemove;
        isRemoval = true;
      } catch (e) {
        return {
          success: false,
          title: "Не удалось проверить hosts",
          message:
            "Не удалось прочитать текущие заблокированные домены из hosts файла.",
          details: String(e),
        };
      }
    }

    try {
      setLoading(true);
      const persistedRegion = settings.clusterSelections?.[selectedRegionId] ?? {};
      const currentRegionBlocked = clusters
        .filter((cluster) => persistedRegion[cluster.domain] === false)
        .map((cluster) => cluster.domain);
      let updateRes: any;
      let firewallRes: any = null;

      // Настройки теперь читаются из файла в Rust-коде, но передаем для явности
      updateRes = isRemoval
        ? await safeInvoke("update_hosts_block", {
            blockedDomains: domains,
            remove: true,
            region: selectedRegionId,
          })
        : await safeInvoke("update_hosts_block", {
            blockedDomains: domains,
            region: selectedRegionId,
          });

      if (settings.useFirewall) {
        try {
          const desiredBlocked = isRemoval ? [] : domains;
          const desiredSet = new Set(
            desiredBlocked.map((domain) => domain.toLowerCase()),
          );
          const domainsToRemove = currentRegionBlocked.filter(
            (domain) => !desiredSet.has(domain.toLowerCase()),
          );
          const messages: string[] = [];

          if (domainsToRemove.length > 0) {
            messages.push(
              await updateFirewallRules(
                selectedRegionId,
                domainsToRemove,
                false,
              ),
            );
          }
          if (desiredBlocked.length > 0) {
            messages.push(
              await updateFirewallRules(selectedRegionId, desiredBlocked, true),
            );
          }
          firewallRes = messages.join("\n");
        } catch (firewallError) {
          console.error("Firewall update failed:", firewallError);
          firewallRes = `Предупреждение: не удалось обновить брандмауэр: ${firewallError}`;
        }
      }

      let successMessage = "";
      if (settings.useFirewall && firewallRes) {
        successMessage = `
✅ Hosts файл обновлен:
${updateRes}
        
✅ Правила брандмауэра ${isRemoval ? "удалены" : "добавлены"}:
${firewallRes}
        
Изменения применены на уровне сети (блокировка по IP).
      `;
      } else {
        successMessage = `
✅ Hosts файл обновлен:
${updateRes}
        
ℹ️ Брандмауэр не использовался.
${
  settings.useFirewall
    ? "(не удалось применить правила брандмауэра)"
    : "(отключен в настройках)"
}
      `;
      }

      return {
        success: true,
        title: isRemoval ? "Разблокировано" : "Заблокировано",
        message: successMessage.trim(),
        details: undefined,
      };
    } catch (e) {
      let errorMessage = String(e);
      let errorTitle = "Ошибка обновления";

      if (settings.useFirewall) {
        errorTitle = "Ошибка обновления правил";
        errorMessage = `
        ❌ Не удалось применить изменения:
        
        ${errorMessage}
        
        Возможно, требуются права администратора для изменения правил брандмауэра.
        Попробуйте запустить приложение от имени администратора.
      `;
      }

      return {
        success: false,
        title: errorTitle,
        message: "Не удалось применить изменения в hosts файле.",
        details: errorMessage.trim(),
      };
    } finally {
      setLoading(false);
    }
  };

  const clearCluster = async () => {
    try {
      setLoading(true);

      if (isMobile) {
        const response = await vpnStop();
        setVpnStatus("Off");
        setVpnDomains(response.domains);
        setVpnBaselineDomains(getBlockedDomains());
        setVpnDirty(false);
        return {
          success: true,
          title: "VPN выключен",
          message: "DNS-блокировка очищена.",
          details: undefined,
        };
      }

      let messages = [];

      const hostsRes: any = await safeInvoke("clear_cluster_blocks");
      messages.push(hostsRes);

      if (settings.useFirewall) {
        try {
          const fwRes = await clearFirewallRules();
          messages.push(`Брандмауэр: ${fwRes}`);
        } catch (fwError) {
          messages.push(`Ошибка очистки брандмауэра: ${fwError}`);
        }
      }
      return {
        success: true,
        title: "Всё очищено",
        message: messages.join("\n\n"),
        details: undefined,
      };
    } catch (e) {
      return {
        success: false,
        title: "Ошибка очистки",
        message: "Не удалось очистить блокировки.",
        details: String(e),
      };
    } finally {
      setLoading(false);
    }
  };

  const stopVpn = async () => {
    if (!isMobile) return;
    try {
      setVpnStatus("Loading");
      const response = await vpnStop();
      setVpnStatus("Off");
      setVpnDomains(response.domains);
      setVpnBaselineDomains(getBlockedDomains());
      setVpnDirty(false);
    } catch (error) {
      setVpnStatus("Error");
      throw error;
    }
  };

  return { applyHostsUpdate, clearCluster, stopVpn, loading };
}
