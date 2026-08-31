import ClusterBannedLogo from "@/assets/clusterbanned.png";
import { useTranslation } from "@/hooks/useTranslation";
import { config } from "@/utils/config";
import Android from "./Icons/Android";
import GitHub from "./Icons/Github";
import Windows from "./Icons/Windows";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer w-full border-t text-white py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col justify-between">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <img src={ClusterBannedLogo.src} width={35} alt="Logo" />
              <span className="text-xl font-bold tracking-tight">Cluster Banned Manager</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{t("footer.description")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={config.RELEASE_URL}
              className="flex items-center gap-3 bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 transition-colors"
            >
              <Windows className="size-8" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-gray-400">Download for</div>
                <div className="text-sm font-semibold text-white leading-tight">Windows</div>
              </div>
            </a>
            <a
              href={config.RELEASE_URL}
              className="flex items-center gap-3 bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 transition-colors"
            >
              <Android className="size-8" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-gray-400">Get it on</div>
                <div className="text-sm font-semibold text-white leading-tight">Android</div>
              </div>
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-8 text-sm text-gray-300">
          <a href={config.BASE_URL} className="hover:text-white transition-colors">
            {t("footer.nav.homepage")}
          </a>
          <a href={config.DOCS_URL} className="hover:text-white transition-colors">
            {t("footer.nav.docs")}
          </a>
          <a href={config.GITHUB_URL} className="hover:text-white transition-colors">
            {t("footer.nav.github_repo")}
          </a>
        </div>

        <div className="w-full h-px bg-white/10 mb-8"></div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div>
            <p>Copyright © {new Date().getFullYear()} Cluster Banned Manager. All Rights Reserved.</p>
            <p className="text-gray-400 mt-1">{t("footer.endorsed_sponsored")}</p>
          </div>

          <div className="flex items-center gap-5 text-gray-400">
            <a href={config.GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              <GitHub className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
