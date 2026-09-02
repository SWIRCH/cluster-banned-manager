import { safeInvoke } from "@/lib/tauri"
import type { Region } from "@/types/cluster"
import type { PingInfo, PingMap } from "@/types/ping"
import { useEffect, useRef, useState } from "react"

const PING_TIMEOUT_MS = 2000;
const PING_ATTEMPT_DELAY_MS = 120;
const PING_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const PING_BUDGET_MS = 20_000;

export function usePing(selectedRegion: Region | null, isMobile = false) {
  const [pings, setPings] = useState<PingMap>({});
  const pingRunIdRef = useRef(0);

  const updateStats = (domain: string, infoPartial: Partial<PingInfo>) => {
    setPings((prev) => {
      const prevInfo = prev[domain] ?? {
        last: null,
        avg: null,
        attempts: 0,
        successes: 0,
        lossPercent: 0,
        status: "idle",
      };
      const next: PingInfo = {
        last: infoPartial.last !== undefined ? infoPartial.last : prevInfo.last,
        avg: infoPartial.avg !== undefined ? infoPartial.avg : prevInfo.avg,
        attempts:
          infoPartial.attempts !== undefined
            ? infoPartial.attempts
            : prevInfo.attempts,
        successes:
          infoPartial.successes !== undefined
            ? infoPartial.successes
            : prevInfo.successes,
        lossPercent:
          infoPartial.lossPercent !== undefined
            ? infoPartial.lossPercent
            : prevInfo.lossPercent,
        status: infoPartial.status ?? prevInfo.status,
        lastError:
          infoPartial.lastError !== undefined
            ? infoPartial.lastError
            : prevInfo.lastError,
      };
      return { ...prev, [domain]: next };
    });
  };

  const pingClusters = async (regionId?: string) => {
    const runId = ++pingRunIdRef.current;
    // Используем переданный regionId или текущий selectedRegion
    const region = regionId
      ? selectedRegion // Если передан regionId, используем текущий selectedRegion
      : selectedRegion;

    if (!region) {
      console.warn("[usePing] No region selected");
      return;
    }

    const targets = region.clusters ?? [];
    if (targets.length === 0) {
      console.warn("[usePing] No clusters in region");
      return;
    }

    const attempts = isMobile ? 2 : 3;
    const concurrency = isMobile
      ? Math.min(8, Math.max(1, targets.length))
      : Math.min(4, Math.max(1, targets.length));
    const attemptDelay = isMobile ? 0 : PING_ATTEMPT_DELAY_MS;
    const budgetDeadline = Date.now() + PING_BUDGET_MS;

    // Сбрасываем состояние перед новым пингом
    targets.forEach((cluster) => {
      if (runId === pingRunIdRef.current) {
        updateStats(cluster.domain, { status: "loading" });
      }
    });

    const tasks = targets.map((cluster) => async () => {
      if (runId !== pingRunIdRef.current) return;

      const domain = cluster.domain;
      updateStats(domain, { status: "running" });

      if (Date.now() >= budgetDeadline || runId !== pingRunIdRef.current) {
        updateStats(domain, { status: "timeout" });
        return;
      }

      let successes = 0;
      let totalMs = 0;

      // Получаем IP-адреса кластера для пинга
      const addresses = cluster.ips?.filter((ip) => ip && ip.trim()) ?? [];

      for (let i = 0; i < attempts; i++) {
        if (runId !== pingRunIdRef.current) {
          updateStats(domain, { status: "cancelled" });
          return;
        }
        if (Date.now() >= budgetDeadline) {
          updateStats(domain, {
            avg: successes ? Math.round(totalMs / successes) : null,
            attempts: i,
            successes,
            lossPercent: Math.round(((i - successes) / Math.max(i, 1)) * 100),
            status: successes ? "ok" : "timeout",
          });
          return;
        }
        try {
          const remaining = Math.max(200, budgetDeadline - Date.now());
          const res: any = await safeInvoke("ping_server", {
            hostname: domain,
            timeout_ms: Math.min(PING_TIMEOUT_MS, remaining),
            addresses: addresses.length > 0 ? addresses : undefined,
          });

          const ms = readPingMs(res);
          if (ms !== null) {
            successes++;
            totalMs += ms;
          }

          const avg = successes ? Math.round(totalMs / successes) : null;
          const lossPercent = Math.round(((i + 1 - successes) / (i + 1)) * 100);

          updateStats(domain, {
            last: ms,
            avg,
            attempts: i + 1,
            successes,
            lossPercent,
            status: ms !== null ? "ok" : (res?.status ?? "error"),
            lastError: typeof res?.error === "string" ? res.error : undefined,
          });
        } catch (e) {
          const lossPercent = Math.round(((i + 1 - successes) / (i + 1)) * 100);
          updateStats(domain, {
            last: null,
            avg: successes ? Math.round(totalMs / successes) : null,
            attempts: i + 1,
            successes,
            lossPercent,
            status: "error",
            lastError: String(e),
          });
        }
        if (attemptDelay) {
          await new Promise((r) => setTimeout(r, attemptDelay));
        }
      }

      const finalAvg = successes ? Math.round(totalMs / successes) : null;
      const finalLoss = Math.round(((attempts - successes) / attempts) * 100);
      updateStats(domain, {
        avg: finalAvg,
        lossPercent: finalLoss,
        status: successes ? "ok" : "failed",
      });
    });

    let idx = 0;
    const workers: Promise<void>[] = new Array(concurrency)
      .fill(null)
      .map(async () => {
        while (idx < tasks.length) {
          if (runId !== pingRunIdRef.current) return;
          const i = idx++;
          await tasks[i]();
        }
      });

    await Promise.all(workers);
  };

  useEffect(() => {
    if (!selectedRegion) return;

    // Запускаем пинг сразу
    pingClusters();

    // И каждые PING_REFRESH_INTERVAL_MS
    const id = setInterval(() => pingClusters(), PING_REFRESH_INTERVAL_MS);

    return () => {
      pingRunIdRef.current++;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion?.id, isMobile]);

  return { pings, pingClusters };
}

function readPingMs(res: any): number | null {
  if (typeof res?.ping !== "number" || !Number.isFinite(res.ping)) return null;
  if (res.method === "dns" || res.status === "ok_dns") return null;
  if (res.status && res.status !== "ok" && res.status !== "ok_no_time") {
    return null;
  }
  return Math.max(1, Math.round(res.ping));
}
