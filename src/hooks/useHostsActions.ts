import { useState } from "react";
import {
  updateFirewallRules,
  clearFirewallRules,
  safeInvoke,
} from "../lib/tauri";
import type { AppSettings } from "../utils/settingsStorage";
import type { Cluster } from "../types/cluster";
import type { Selections } from "../types/selections";

export function useHostsActions(
  selectedRegionId: string,
  selections: Selections,
  clusters: Cluster[],
  settings: AppSettings,
) {
  const [loading, setLoading] = useState(false);

  const applyHostsUpdate = async (blockedDomains?: string[]) => {
    let domains =
      blockedDomains ??
      (() => {
        const rmap =
          selections[selectedRegionId] ??
          Object.fromEntries(clusters.map((c) => [c.domain, true]));
        return clusters.filter((c) => !rmap[c.domain]).map((c) => c.domain);
      })();

    let isRemoval = false;
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

  return { applyHostsUpdate, clearCluster, loading };
}
