import { defaultLang, ui } from "@/i18n/ui";
import { currentLang, hydrateLang, setLang } from "@/stores/i18n";
import { useStore } from "@nanostores/react";
import { useEffect } from "react";

export type Translations = (typeof ui)[typeof defaultLang];

export function useTranslation() {
  const lang = useStore(currentLang);

  useEffect(() => {
    hydrateLang();
  }, []);

  const t = (key: keyof Translations): string => {
    return ui[lang]?.[key] ?? ui[defaultLang][key] ?? key;
  };

  return { lang, setLang, t };
}
