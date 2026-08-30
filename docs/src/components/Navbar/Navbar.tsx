import React, { useState } from "react";
import Github from "../Icons/Github";
import { IconDownload, IconSparkle2 } from "@tabler/icons-react";
import Logo from "./Logo";
import ChangeLanguage from "./ChangeLanguage";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

export default function Navbar({ baseUrl = "/" }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <nav className="text-base-content sticky top-0 z-30 flex h-16 w-full transform-[translate3d(0,0,0)] justify-center backdrop-blur-sm transition-shadow duration-100 print:hidden border-b border-white/2">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 w-full">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <Button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="absolute -inset-0.5"></span>
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                  className="size-6"
                >
                  <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                  className="size-6"
                >
                  <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </Button>
          </div>
          <div className="flex flex-1 items-center justify-start sm:items-stretch sm:justify-between">
            <div className="flex shrink-0 items-center gap-3 w-20">
              <Logo />
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                <Button variant="ghost">
                  <IconSparkle2 stroke={2} />
                  {t("nav.features")}
                </Button>
                <Button variant="ghost">
                  <IconDownload stroke={2} />
                  {t("common.download")}
                </Button>
                <Button variant="ghost" rel="noopener noreferrer">
                  <Github variant="dark" className="h-6 w-6" />
                  Github
                </Button>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:block w-20">
              <ChangeLanguage baseUrl={baseUrl} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          className="block sm:hidden absolute top-16 left-0 w-full bg-black/90 backdrop-blur-md border-b border-white/10"
        >
          <div className="space-y-1 px-2 pt-2 pb-3">
            <a
              href="#"
              aria-current="page"
              className="block rounded-md bg-gray-950/50 px-3 py-2 text-base font-medium text-white"
            >
              Dashboard
            </a>
            <a
              href="#"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
            >
              Team
            </a>
            <a
              href="#"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
            >
              Projects
            </a>
            <a
              href="#"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
            >
              Calendar
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
