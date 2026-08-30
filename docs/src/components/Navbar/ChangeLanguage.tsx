import React, { useEffect, useState } from "react";
import { ui, defaultLang, type KnownLanguageCode } from "@/i18n/ui";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ArrowUpRightIcon } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface Language {
  code: KnownLanguageCode;
  label: string;
  flag: string;
}

interface ChangeLanguageProps {
  baseUrl?: string;
  onLanguageChange?: (code: string) => void;
}

const Languages: Language[] = [
  { code: "ru", label: "Русский", flag: "RU.svg" },
  { code: "en", label: "English", flag: "US.svg" },
];

export default function ChangeLanguage({ baseUrl = "", onLanguageChange }: ChangeLanguageProps) {
  const [currentLang, setCurrentLang] = useState<Language | null>(null);
  const currentCode = currentLang?.code || defaultLang;
  const { lang, setLang, t } = useTranslation();

  useEffect(() => {
    const savedLangCode = (localStorage.getItem("lang") as KnownLanguageCode) || defaultLang;
    const foundLang = Languages.find((lang) => lang.code === savedLangCode) || Languages[0];

    if (foundLang) {
      setCurrentLang(foundLang);
      setLang(foundLang.code);
    }
  }, []);

  const handleSelectLanguage = (lang: Language) => {
    if (lang.code !== currentCode) {
      setCurrentLang(lang);
      localStorage.setItem("lang", lang.code);

      if (onLanguageChange) {
        onLanguageChange(lang.code);
      }

      window.location.reload();
    }
  };

  return (
    <DropdownMenu>
      {currentLang === null ? (
        <div className="h-full w-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <DropdownMenuTrigger render={<Button variant="link" />}>
          {currentLang.label} <ArrowUpRightIcon />
        </DropdownMenuTrigger>
      )}

      <DropdownMenuContent side="bottom">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("nav.languages")}</DropdownMenuLabel>

          {Languages.map((lang) => (
            <DropdownMenuCheckboxItem
              key={lang.code}
              checked={currentLang?.code === lang.code}
              onClick={() => handleSelectLanguage(lang)}
            >
              {lang.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <Button variant="link">{t("nav.found_error")}</Button>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
