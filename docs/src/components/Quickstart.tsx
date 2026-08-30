import { useTranslation, type Translations } from "@/hooks/useTranslation";
import { activePlatform } from "@/stores/platform";
import { useStore } from "@nanostores/react";
import { Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function Quickstart() {
  const { t } = useTranslation();
  const platform = useStore(activePlatform);

  return (
    <div className="card rounded-2xl mt-20 p-6 sm:p-8 shadow-2xl text-white font-sans">
      <Tabs defaultValue="overview">
        <TabsList className="flex gap-2 text-sm font-medium">
          <TabsTrigger value="windows">Windows</TabsTrigger>
          <TabsTrigger value="android">Android</TabsTrigger>
        </TabsList>
        <TabsContent value="windows">
          <WindowsQuickstart t={t} />
        </TabsContent>
        <TabsContent value="android">
          <AndroidQuickstart t={t} />
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10 text-sm">
        <a href="#" className="text-gray-400 hover:text-white inline-flex items-center gap-1.5 transition-colors">
          {t("quickstart.need_help")}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            ></path>
          </svg>
        </a>
      </div>
    </div>
  );
}

interface PlatformQuickstartProps {
  t: (key: keyof Translations) => string;
}

function WindowsQuickstart({ t }: PlatformQuickstartProps) {
  return (
    <div className="relative pl-8 space-y-8 my-8 before:absolute before:left-2.75 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
      <div className="relative">
        <div className="absolute -left-8 top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold ring-4 ring-[#101015]">
          1
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{t("quickstart.windows.step1.title")}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{t("quickstart.windows.step1.description")}</p>

          <div className="mt-3 relative flex items-center justify-between bg-[#18181f] border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-gray-200">
            <code>{t("quickstart.windows.step1.installer_file_name")}</code>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans text-gray-400 border border-white/10 hover:bg-white/5 hover:text-white transition-colors">
              <Download size={14} />
              <span>{t("common.download")}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -left-8 top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold ring-4 ring-[#101015]">
          2
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{t("quickstart.windows.step2.title")}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{t("quickstart.windows.step2.description")}</p>

          <div className="mt-3 relative flex items-center justify-between bg-[#18181f] border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-gray-200">
            <code>
              <ul className="list-decimal pl-5 text-gray-400">
                <li>{t("quickstart.windows.step2.list.pkm_run_admin")}</li>
                <li>{t("quickstart.windows.step2.list.set_run_admin")}</li>
              </ul>
            </code>
          </div>
          <p className="text-xs text-gray-500 mt-2">{t("quickstart.windows.step2.footer")}</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -left-8 top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold ring-4 ring-[#101015]">
          3
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{t("quickstart.windows.step3.title")}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{t("quickstart.windows.step3.description")}</p>
          <p className="text-xs text-gray-500 mt-2">{t("quickstart.windows.step3.footer")}</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -left-8 top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold ring-4 ring-[#101015]">
          4
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{t("quickstart.windows.step4.title")}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{t("quickstart.windows.step4.description")}</p>
        </div>
      </div>
    </div>
  );
}

function AndroidQuickstart({ t }: PlatformQuickstartProps) {
  return (
    <div className="relative pl-8 space-y-8 my-8 before:absolute before:left-2.75 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
      <div className="relative">
        <div className="absolute -left-8 top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold ring-4 ring-[#101015]">
          1
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{t("quickstart.android.step1.title")}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{t("quickstart.android.step1.description")}</p>

          <div className="mt-3 relative flex items-center justify-between bg-[#18181f] border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-gray-200">
            <code>{t("quickstart.android.step1.installer_file_name")}</code>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans text-gray-400 border border-white/10 hover:bg-white/5 hover:text-white transition-colors">
              <Download size={14} />
              <span>{t("common.download")}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -left-8 top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold ring-4 ring-[#101015]">
          2
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{t("quickstart.android.step2.title")}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{t("quickstart.android.step2.description")}</p>
          <p className="text-xs text-gray-500 mt-2">{t("quickstart.android.step2.footer")}</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -left-8 top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold ring-4 ring-[#101015]">
          3
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{t("quickstart.android.step3.title")}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{t("quickstart.android.step3.description")}</p>
        </div>
      </div>
    </div>
  );
}
