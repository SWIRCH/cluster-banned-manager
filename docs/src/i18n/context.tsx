import React, { createContext, useContext, useEffect, useState } from "react";
import { ui, defaultLang, type KnownLanguageCode } from "./ui";

type Translations = (typeof ui)[typeof defaultLang];

interface I18nContextType {
  lang: KnownLanguageCode;
  setLang: (lang: KnownLanguageCode) => void;
  t: (key: keyof Translations) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<KnownLanguageCode>(defaultLang);

  useEffect(() => {
    const saved = localStorage.getItem("lang") as KnownLanguageCode;
    if (saved && ui[saved]) {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: KnownLanguageCode) => {
    setLangState(newLang);
    localStorage.setItem("lang", newLang);
  };

  const t = (key: keyof Translations): string => {
    return ui[lang]?.[key] || ui[defaultLang][key] || key;
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
