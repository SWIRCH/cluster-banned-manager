// Navbar.tsx
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { config } from "@/utils/config";
import { openUrl } from "@/utils/openUrl";
import { IconDownload, IconSparkle2 } from "@tabler/icons-react";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import Github from "../Icons/Github";
import ChangeLanguage from "./ChangeLanguage";
import Logo from "./Logo";

export default function Navbar({ baseUrl = config.BASE_URL, onlyImg = false }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="text-base-content sticky top-0 z-30 flex h-16 w-full transform-[translate3d(0,0,0)] justify-center backdrop-blur-sm transition-shadow duration-100 print:hidden border-b border-white/2">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 w-full">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 right-0 flex items-center sm:hidden">
            <Button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative inline-flex items-center justify-center rounded-md p-2 text-black hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500 min-w-10"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="absolute -inset-0.5 "></span>
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? <Menu /> : <X />}
            </Button>
          </div>
          <div className="flex flex-1 items-center justify-start sm:items-stretch sm:justify-between">
            <div className="flex shrink-0 items-center gap-3 w-20">
              <Logo baseUrl={baseUrl} onlyImg={onlyImg} />
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                <Button variant="ghost" onClick={() => openUrl(config.DOCS_URL)}>
                  <IconSparkle2 stroke={2} />
                  {t("common.docs")}
                </Button>
                <Button variant="ghost" onClick={() => openUrl(config.RELEASE_URL)}>
                  <IconDownload stroke={2} />
                  {t("common.download")}
                </Button>
                <Button variant="ghost" rel="noopener noreferrer" onClick={() => openUrl(config.GITHUB_URL)}>
                  <Github variant="dark" className="h-6 w-6" />
                  Github
                </Button>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:block w-20">{mounted && <ChangeLanguage baseUrl={baseUrl} />}</div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          className="block sm:hidden absolute top-16 right-0 w-full bg-black/90 backdrop-blur-md border-b border-white/10"
        >
          <div className="space-y-1 px-2 pt-2 pb-3">
            <a
              href={config.BASE_URL}
              aria-current="page"
              className="block rounded-md bg-gray-950/50 px-3 py-2 text-base font-medium text-white"
            >
              {t("footer.nav.homepage")}
            </a>
            <a
              href={config.DOCS_URL}
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
            >
              {t("footer.nav.docs")}
            </a>
            <a
              href={config.RELEASE_URL}
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
            >
              {t("common.download")}
            </a>
            <a
              href={config.GITHUB_URL}
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
            >
              {t("footer.nav.github_repo")}
            </a>
            <div className="sm:ml-6 sm:block w-20">{mounted && <ChangeLanguage baseUrl={baseUrl} />}</div>
          </div>
        </div>
      )}
    </nav>
  );
}
