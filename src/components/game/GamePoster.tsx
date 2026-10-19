import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Region } from "@/types/cluster";
import { config } from "@/utils/config";
import { openGithub } from "@/utils/opener";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { MismatchLines, useMismatchGroups } from "../clusters/MismatchLines";

type GamePosterProps = {
  posterUrl: string;
  tauriAvailable: boolean | null;
  hostsMismatch: boolean;
  gameRunning: boolean;
  onPlayClick: () => void;
  onUpdateClick: () => void;
  onCancel: () => void;
  selectedRegion: Region | null;
  lastTauriError: string | null;
  mismatchDomains: string[];
  allBlockedDomains: string[] | null;
};

const MAX_DOMAINS_SHOWN = 4;

/**
 * Смена кнопок: только opacity (композитор, без layout).
 * Элементы лежат абсолютно друг на друге, поэтому размеры не меняются.
 */
const swapMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15, ease: "easeOut" as const },
};

function formatDomains(list: string[]) {
  const shown = list.slice(0, MAX_DOMAINS_SHOWN).join(" ");
  const rest = list.length - MAX_DOMAINS_SHOWN;
  return rest > 0 ? `${shown} +${rest}` : shown;
}

/**
 * Одна строка «домены + подпись». Не размонтируется, а плавно сворачивается
 * (grid-template-rows 0fr ↔ 1fr), пока сворачивается — показывает прошлый текст.
 */
function DomainLine({
  domains,
  suffix,
}: {
  domains: string[];
  suffix: (count: number) => string;
}) {
  const open = domains.length > 0;
  const last = useRef(domains);
  if (open) last.current = domains;
  const list = open ? domains : last.current;

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
      aria-hidden={!open}
    >
      <p className="min-h-0 overflow-hidden break-words">
        {formatDomains(list)} {suffix(list.length)}
      </p>
    </div>
  );
}

export default function GamePoster({
  posterUrl,
  tauriAvailable,
  hostsMismatch,
  gameRunning,
  onPlayClick,
  onUpdateClick,
  onCancel,
  selectedRegion,
  lastTauriError,
  mismatchDomains,
  allBlockedDomains,
}: GamePosterProps) {
  const { t } = useTranslation();
  const regionName = selectedRegion?.alias_name ?? selectedRegion?.name;
  const mismatchOpen = tauriAvailable === true && hostsMismatch;

  const groups = useMismatchGroups(
    allBlockedDomains,
    mismatchDomains,
    hostsMismatch,
  );

  return (
    <div className="inGamePoster">
      <div id="poster" style={{ backgroundImage: `url('${posterUrl}')` }}>
        <div className="gameStatus">
          <div className="statusE">
            <div className="text-[12px]">
              <AnimatePresence>
                {tauriAvailable === true && hostsMismatch === false && (
                  <motion.div
                    key="hosts-ok"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1"
                  >
                    <Check
                      size={12}
                      stroke="#05df72"
                      strokeWidth={1.5}
                      absoluteStrokeWidth
                    />
                    <span className="text-green-400">
                      {t("system.hosts.hosts_is_fine")}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="gameButtons rounded-xl bg-bg-sidebar backdrop-blur-sm p-4 relative w-full">
          <div className="relative w-full h-12 mt-1">
            <AnimatePresence initial={false}>
              {hostsMismatch ? (
                <motion.div
                  key="update"
                  className="absolute inset-0 flex items-center gap-2"
                  {...swapMotion}
                >
                  <button
                    className="steam-btn btnposition flex-1 min-w-0"
                    onClick={onUpdateClick}
                    aria-label={`${t("system.hosts.updateFor")} ${regionName}`}
                  >
                    <span className="truncate">
                      {t("system.hosts.updateBlocked")}
                    </span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  className="absolute inset-0 flex items-center"
                  {...swapMotion}
                >
                  <button
                    className={`steam-btn btnposition w-full ${
                      gameRunning ? "bg-red-600 text-white" : ""
                    }`}
                    onClick={onPlayClick}
                  >
                    {gameRunning ? t("buttons.close") : t("buttons.play")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Статус */}
          <div className="mt-3 text-sm text-white/60">
            {tauriAvailable === null && (
              <span>{t("system.hosts.checking")}.</span>
            )}
            {tauriAvailable === false && (
              <span className="text-red-400">
                {t("errors.tauri.unavailable")}
              </span>
            )}

            {/*
              Блок всегда в DOM, раскрывается через grid-template-rows (0fr → 1fr).
              Это обычный CSS-переход: браузер сам плавно меняет высоту в обе
              стороны, без JS-замеров высоты (как у height: "auto" в framer-motion)
              и без размонтирования, из-за которого окно раньше «падало» рывком.
            */}
            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
                mismatchOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
              aria-hidden={!mismatchOpen}
              inert={!mismatchOpen}
            >
              <div className="min-h-0 overflow-hidden">
                <div role="status" className="pt-1">
                  <span className="block font-medium text-amber-300">
                    {t("common.not_applied")}:{" "}
                    {t("common.change", { count: mismatchDomains.length })}
                  </span>
                  <div className="mt-1 text-xs text-gray-300">
                    <MismatchLines
                      className="text-gray-300 text-xs pr-10"
                      blocked={groups.blocked}
                      unBlocked={groups.unBlocked}
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={onCancel}
                    aria-label={t("buttons.cancel")}
                    title={t("buttons.cancel")}
                  >
                    {t("buttons.cancel")}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              {lastTauriError ? (
                <div className="mt-2 select-text whitespace-pre-wrap text-xs">
                  {lastTauriError}
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full cursor-pointer text-center text-xs hover:text-gray-200"
                  onClick={() => openGithub()}
                >
                  GitHub — ClusterBannedManager {config.VERSION}
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          className="posterBlur"
          style={{ backgroundImage: `url('${posterUrl}')` }}
        ></div>
      </div>
    </div>
  );
}
