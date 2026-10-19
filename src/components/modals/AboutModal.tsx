import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { config } from "@/utils/config";
import { openAuthorLink, openGithub } from "@/utils/opener";
import {
  getIdentifier,
  getTauriVersion,
  getVersion,
} from "@tauri-apps/api/app";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import {
  arch,
  locale,
  version as osVersion,
  platform,
} from "@tauri-apps/plugin-os";
import {
  Check,
  Code2,
  Copy,
  Cpu,
  ExternalLink,
  Fingerprint,
  GitBranch,
  GitCompare,
  Github,
  Globe,
  Hash,
  Languages,
  Layers,
  Monitor,
  Timer,
  User,
  type LucideIcon,
} from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import Modal from "./Modal";

type RuntimeInfo = {
  appVersion?: string;
  tauriVersion?: string;
  identifier?: string;
  os?: string;
  osVersion?: string;
  arch?: string;
  locale?: string;
  webview?: string;
};

type Row = { icon: LucideIcon; label: string; value?: string };

const PLATFORM_NAMES: Record<string, string> = {
  windows: "Windows",
  android: "Android",
  linux: "Linux",
  macos: "macOS",
  ios: "iOS",
};

async function safe<T>(fn: () => T | Promise<T>): Promise<T | undefined> {
  try {
    return (await fn()) ?? undefined;
  } catch {
    return undefined;
  }
}

async function loadRuntimeInfo(): Promise<RuntimeInfo> {
  const [appVersion, tauriVersion, identifier, os, osVer, cpuArch, lang] =
    await Promise.all([
      safe(getVersion),
      safe(getTauriVersion),
      safe(getIdentifier),
      safe(() => platform()),
      safe(() => osVersion()),
      safe(() => arch()),
      safe(() => locale()),
    ]);

  const webview = /Chrome\/([\d.]+)/.exec(navigator.userAgent)?.[1];

  return {
    appVersion,
    tauriVersion,
    identifier,
    os: os ? (PLATFORM_NAMES[os] ?? os) : undefined,
    osVersion: osVer,
    arch: cpuArch,
    locale: lang ?? "unknown",
    webview,
  };
}

function InfoRow({ icon: Icon, label, value }: Row) {
  return (
    <div className="flex items-center justify-between gap-4 p-3.5 bg-white/5 rounded-xl border border-transparent">
      <div className="flex items-center gap-3 shrink-0">
        <Icon className="size-5 text-zinc-400" />
        <span className="font-medium text-zinc-300">{label}</span>
      </div>
      <span className="text-zinc-300 text-sm text-right break-all select-text">
        {value ?? "—"}
      </span>
    </div>
  );
}

function LinkRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/20 group"
    >
      <div className="flex items-center gap-3">
        <Icon className="size-5 text-zinc-400 group-hover:text-white transition-colors" />
        <span className="font-medium text-white">{label}</span>
      </div>
      <ExternalLink className="size-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 mb-6">
      <h4 className="px-1 text-sm font-medium text-zinc-400">{title}</h4>
      {children}
    </section>
  );
}

export default function AboutModalComponent() {
  const { t } = useTranslation();
  const isOpen = useAppStore((state) => state.isAboutModalOpen);
  const setIsOpen = useAppStore((state) => state.setIsAboutModalOpen);
  const onClose = () => setIsOpen(false);

  const [info, setInfo] = useState<RuntimeInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!isOpen || info) return;
    let cancelled = false;
    loadRuntimeInfo().then((data) => {
      if (!cancelled) setInfo(data);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, info]);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const appVersion = info?.appVersion ?? config.VERSION;
  const tauriVersion = info?.tauriVersion ?? config.TAURI_VERSION;

  const appRows: Row[] = useMemo(
    () => [
      {
        icon: User,
        label: t("modals.about.rows.author"),
        value: config.AUTHOR,
      },
      {
        icon: Code2,
        label: t("modals.about.rows.build"),
        value: `${config.BUILD} (${config.BUNDLE_TYPE})`,
      },
      {
        icon: GitCompare,
        label: t("modals.about.rows.channel"),
        value: __APP_UPDATE_CHANNEL__,
      },
      {
        icon: Hash,
        label: t("modals.about.rows.build_hash"),
        value: __APP_BUILD_HASH__,
      },
      {
        icon: Timer,
        label: t("modals.about.rows.build_date"),
        value: new Date(__APP_BUILD_DATE__).toLocaleString(),
      },
      {
        icon: GitBranch,
        label: t("modals.about.rows.branch"),
        value: config.BREACH,
      },
      {
        icon: Fingerprint,
        label: t("modals.about.rows.identifier"),
        value: info?.identifier,
      },
    ],
    [info?.identifier, t],
  );

  const systemRows: Row[] = useMemo(
    () => [
      {
        icon: Monitor,
        label: t("modals.about.rows.system"),
        value: info?.os
          ? [info.os, info.osVersion].filter(Boolean).join(" ")
          : undefined,
      },
      { icon: Cpu, label: t("modals.about.rows.arch"), value: info?.arch },
      {
        icon: Languages,
        label: t("modals.about.rows.system_language"),
        value: info?.locale,
      },
      {
        icon: Layers,
        label: t("modals.about.rows.tauri"),
        value: tauriVersion,
      },
      {
        icon: Globe,
        label: t("modals.about.rows.webview"),
        value: info?.webview,
      },
    ],
    [info, tauriVersion, t],
  );

  const handleCopy = async () => {
    const lines = [
      `${config.NAME} ${appVersion}`,
      ...[...appRows, ...systemRows]
        .filter((row) => row.value)
        .map((row) => `${row.label}: ${row.value}`),
    ];
    const text = "```\n" + lines.join("\n") + "\n```";

    try {
      await writeText(text);
    } catch {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return;
      }
    }

    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      zIndex="z-[1000]"
      title={t("modals.about.title")}
    >
      {/* <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="sm:hidden mb-4"
      >
        <ChevronLeft />
        <span>{t("buttons.back")}</span>
      </Button> */}

      <div className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-2xl mb-6">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-3">
          <img src="/clusterbanned.png" width={45} alt="" />
        </div>
        <h3 className="text-xl font-bold text-white text-center">
          {config.NAME}
        </h3>
        <span className="text-xs text-zinc-400 mt-1">
          {t("modals.about.version", { version: appVersion })}
        </span>
      </div>

      <Section title={t("modals.about.sections.app")}>
        {appRows.map((row) => (
          <InfoRow key={row.label} {...row} />
        ))}
      </Section>

      <Section title={t("modals.about.sections.environment")}>
        {systemRows
          .filter((row) => row.value || !info)
          .map((row) => (
            <InfoRow key={row.label} {...row} />
          ))}

        <Button
          type="button"
          variant="outline"
          onClick={handleCopy}
          disabled={!info}
          className={cn("mt-1 w-full", copied && "text-green-400")}
        >
          {copied ? <Check /> : <Copy />}
          <span>
            {copied ? t("buttons.is_copy") : t("modals.about.copy_for_report")}
          </span>
        </Button>
      </Section>

      <Section title={t("modals.about.sections.links")}>
        <LinkRow
          icon={Github}
          label={t("modals.about.links.github")}
          onClick={openGithub}
        />
        <LinkRow
          icon={User}
          label={t("modals.about.links.project_page")}
          onClick={openAuthorLink}
        />
      </Section>
    </Modal>
  );
}

export const AboutModal = memo(AboutModalComponent);
