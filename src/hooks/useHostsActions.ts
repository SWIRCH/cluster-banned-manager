import { useState } from "react";
import {
  updateFirewallRules,
  clearFirewallRules,
  safeInvoke,
  vpnStart,
  vpnStop,
} from "../lib/tauri";
import { useAppStore } from "../store/useAppStore";
import type { AppSettings } from "../utils/settingsStorage";
import type { Cluster } from "../types/cluster";
import type { Selections } from "../types/selections";

export function useHostsActions(
  selectedRegionId: string,
  selections: Selections,
  clusters: Cluster[],
  settings: AppSettings,
  isMobile = false,
) {
  const [loading, setLoading] = useState(false);
  const { setVpnStatus, setVpnDomains, setVpnBaselineDomains, setVpnDirty } =
    useAppStore();

  const getBlockedDomains = () => {
    const regionMap =
      selections[selectedRegionId] ??
      Object.fromEntries(clusters.map((cluster) => [cluster.domain, true]));
    return clusters
      .filter((cluster) => regionMap[cluster.domain] === false)
      .map((cluster) => cluster.domain)
      .sort();
  };

  const applyHostsUpdate = async (
    blockedDomains?: string[],
    keepVpnRunning = true,
  ) => {
    let domains =
      blockedDomains ??
      (() => {
        const rmap =
          selections[selectedRegionId] ??
          Object.fromEntries(clusters.map((c) => [c.domain, true]));
        return clusters.filter((c) => !rmap[c.domain]).map((c) => c.domain);
      })();

    let isRemoval = false;

    if (isMobile) {
      if (domains.length === 0) {
        setVpnStatus("Off");
        setVpnDirty(false);
        return {
          success: false,
          title: "VPN не включён",
          message: "У вас нет ни одной блокировки кластеров.",
          details: undefined,
        };
      }

      setLoading(true);
      try {
        const response =
          domains.length && keepVpnRunning
            ? await vpnStart(domains)
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

    if (domains.length === 0) {
      try {
        const allBlocked: any = await safeInvoke("read_blocked_domains");
        const blockedSet = new Set(
          (allBlocked || []).map((s: string) => s.toLowerCase()),
        );
        const toRemove = clusters
          .filter((c) => blockedSet.has(c.domain.toLowerCase()))
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
      let updateRes: any;
      let firewallRes: any = null;

      // Настройки теперь читаются из файла в Rust-коде, но передаем для явности
      updateRes = isRemoval
        ? await safeInvoke("update_hosts_block", {
            blocked_domains: domains,
            remove: true,
            region: selectedRegionId,
          })
        : await safeInvoke("update_hosts_block", {
            blocked_domains: domains,
            region: selectedRegionId,
          });

      if (settings.useFirewall) {
        try {
          firewallRes = await updateFirewallRules(
            selectedRegionId,
            domains,
            !isRemoval,
          );
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
