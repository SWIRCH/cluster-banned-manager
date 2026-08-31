// ChangeLanguage.tsx
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/useTranslation";
import { defaultLang, type KnownLanguageCode } from "@/i18n/ui";
import { currentLang, setLang } from "@/stores/i18n";
import { config } from "@/utils/config";
import { openUrl } from "@/utils/openUrl";
import { useStore } from "@nanostores/react";
import { ArrowUpRightIcon } from "lucide-react";
import { useEffect, useState } from "react";

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

const getLanguage = (code: KnownLanguageCode): Language => {
  const found = Languages.find((l) => l.code === code);
  if (!found) {
    console.warn(`Language with code "${code}" not found, falling back to default`);
    return Languages[0]!;
  }
  return found;
};

export default function ChangeLanguage({ baseUrl = config.BASE_URL, onLanguageChange }: ChangeLanguageProps) {
  const [mounted, setMounted] = useState(false);
  const lang = useStore(currentLang);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Находим текущий язык или используем первый как fallback
  const currentLangObj = getLanguage(lang);

  const handleSelectLanguage = (langCode: KnownLanguageCode) => {
    if (langCode !== lang) {
      localStorage.setItem("lang", langCode);
      setLang(langCode);

      if (onLanguageChange) {
        onLanguageChange(langCode);
      }
    }
  };

  // Во время SSR и до гидратации показываем плейсхолдер
  if (!mounted) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="link">
              English <ArrowUpRightIcon />
            </Button>
          }
        />
        <DropdownMenuContent side="bottom">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("nav.languages")}</DropdownMenuLabel>
            {Languages.map((lang) => (
              <DropdownMenuCheckboxItem key={lang.code} checked={lang.code === defaultLang}>
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="link">
            {currentLangObj.label} <ArrowUpRightIcon />
          </Button>
        }
      />

      <DropdownMenuContent side="bottom">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("nav.languages")}</DropdownMenuLabel>

          {Languages.map((langItem) => (
            <DropdownMenuCheckboxItem
              key={langItem.code}
              checked={currentLangObj.code === langItem.code}
              onClick={() => handleSelectLanguage(langItem.code)}
            >
              {langItem.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <Button variant="link" onClick={() => openUrl(config.GITHUB_URL + "/issues")}>
            {t("nav.found_error")}
          </Button>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
