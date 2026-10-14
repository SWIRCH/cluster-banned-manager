import { safeInvoke } from "@/lib/tauri";
import { usePingStore } from "@/store/usePingStore";
import type { Region } from "@/types/cluster";
import type { PingInfo } from "@/types/ping";
import { IDLE_PING } from "@/types/ping";
import { useCallback, useEffect, useRef } from "react";

const PING_TIMEOUT_MS = 2000;
const PING_ATTEMPT_DELAY_MS = 120;
const PING_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const PING_BUDGET_MS = 20_000;

export function usePing(selectedRegion: Region | null, isMobile = false) {
  const patchPings = usePingStore((s) => s.patchPings);
  const mergePings = usePingStore((s) => s.mergePings);
  const pingRunIdRef = useRef(0);
  const pendingRef = useRef<Record<string, Partial<PingInfo>>>({});
  const rafRef = useRef<number | null>(null);
  const selectedRegionRef = useRef(selectedRegion);
  const isMobileRef = useRef(isMobile);

  selectedRegionRef.current = selectedRegion;
  isMobileRef.current = isMobile;

  const flushPingUpdates = useCallback(() => {
    rafRef.current = null;
    const pending = pendingRef.current;
    pendingRef.current = {};
    if (Object.keys(pending).length === 0) return;
    patchPings(pending);
  }, [patchPings]);

  const updateStats = useCallback(
    (domain: string, infoPartial: Partial<PingInfo>) => {
      pendingRef.current[domain] = {
        ...pendingRef.current[domain],
        ...infoPartial,
      };
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(flushPingUpdates);
      }
    },
    [flushPingUpdates],
  );

  const pingClusters = useCallback(async (_regionId?: string) => {
    const runId = ++pingRunIdRef.current;
    const region = selectedRegionRef.current;
    const mobile = isMobileRef.current;

    if (!region) {
      console.warn("[usePing] No region selected");
      return;
    }

    const targets = region.clusters ?? [];
    if (targets.length === 0) {
      console.warn("[usePing] No clusters in region");
      return;
    }

    const attempts = mobile ? 2 : 3;
    const concurrency = mobile
      ? Math.min(8, Math.max(1, targets.length))
      : Math.min(4, Math.max(1, targets.length));
    const attemptDelay = mobile ? 0 : PING_ATTEMPT_DELAY_MS;
    const budgetDeadline = Date.now() + PING_BUDGET_MS;

    mergePings((prev) => {
      const next = { ...prev };
      for (const cluster of targets) {
        next[cluster.domain] = {
          ...(next[cluster.domain] ?? IDLE_PING),
          status: "loading",
        };
      }
      return next;
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
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      flushPingUpdates();
    }
  }, [flushPingUpdates, mergePings, updateStats]);

  useEffect(() => {
    if (!selectedRegion) return;

    pingClusters();

    const id = setInterval(() => pingClusters(), PING_REFRESH_INTERVAL_MS);

    return () => {
      pingRunIdRef.current++;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pendingRef.current = {};
      clearInterval(id);
    };
  }, [selectedRegion?.id, isMobile, pingClusters]);

  return { pingClusters };
}

function readPingMs(res: any): number | null {
  if (typeof res?.ping !== "number" || !Number.isFinite(res.ping)) return null;
  if (res.method === "dns" || res.status === "ok_dns") return null;
  if (res.status && res.status !== "ok" && res.status !== "ok_no_time") {
    return null;
  }
  return Math.max(1, Math.round(res.ping));
}
