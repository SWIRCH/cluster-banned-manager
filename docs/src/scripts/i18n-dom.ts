import { defaultLang, ui } from "@/i18n/ui";
import { currentLang, getInitialLang, revealPage } from "@/stores/i18n";

type Languages = keyof typeof ui;
type TranslationKeys = keyof (typeof ui)[typeof defaultLang];

const getTranslation = (lang: string, key: string): string => {
  const targetLang = (lang in ui ? lang : defaultLang) as Languages;
  const targetKey = key as TranslationKeys;

  return ui[targetLang]?.[targetKey] ?? ui[defaultLang][targetKey] ?? key;
};

const applyTranslations = (lang: string) => {
  document.querySelectorAll<HTMLElement>("[data-t]").forEach((el) => {
    const key = el.getAttribute("data-t");
    if (key) {
      el.textContent = getTranslation(lang, key);
    }
  });

  document.querySelectorAll<HTMLElement>("[data-doc-lang]").forEach((el) => {
    el.style.display = el.getAttribute("data-doc-lang") === lang ? "block" : "none";
  });

  document.querySelectorAll<HTMLElement>("[data-sidebar-lang]").forEach((el) => {
    el.style.display = el.getAttribute("data-sidebar-lang") === lang ? "block" : "none";
  });
};

export function initI18nDOM() {
  applyTranslations(getInitialLang());
  currentLang.listen((lang) => {
    applyTranslations(lang);
  });

  window.setTimeout(revealPage, 2000);
}

let started = false;

if (typeof window !== "undefined" && !started) {
  started = true;
  initI18nDOM();
}
