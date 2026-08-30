import { defaultLang, ui, type KnownLanguageCode } from "@/i18n/ui";
import { atom } from "nanostores";

const STORAGE_KEY = "lang";

const getInitialLang = (): KnownLanguageCode => {
  if (typeof window === "undefined") return defaultLang;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved && saved in ui ? (saved as KnownLanguageCode) : defaultLang;
};

export const currentLang = atom<KnownLanguageCode>(defaultLang);

// Функция для установки атрибута на HTML
const updateHtmlLang = (lang: KnownLanguageCode) => {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-lang", lang);
  }
};

export const setLang = (lang: KnownLanguageCode) => {
  currentLang.set(lang);
  localStorage.setItem(STORAGE_KEY, lang);
  updateHtmlLang(lang);
};

export const hydrateLang = () => {
  const lang = getInitialLang();
  currentLang.set(lang);
  updateHtmlLang(lang);
};
