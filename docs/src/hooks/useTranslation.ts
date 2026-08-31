import { defaultLang, ui } from "@/i18n/ui";
import { currentLang, hydrateLang, revealPage, setLang } from "@/stores/i18n";
import { useStore } from "@nanostores/react";
import { useLayoutEffect, useState } from "react";

export type Translations = (typeof ui)[typeof defaultLang];

export function useTranslation() {
  const lang = useStore(currentLang);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    hydrateLang();
    setReady(true);
  }, []);

  useLayoutEffect(() => {
    if (ready) revealPage();
  }, [ready, lang]);

  const t = (key: keyof Translations): string => {
    return ui[lang]?.[key] ?? ui[defaultLang][key] ?? key;
  };

  return { lang, setLang, t };
}
