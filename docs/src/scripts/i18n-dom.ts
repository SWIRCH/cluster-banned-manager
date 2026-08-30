import { defaultLang, ui } from "@/i18n/ui";
import { currentLang } from "@/stores/i18n";

type Languages = keyof typeof ui;
type TranslationKeys = keyof (typeof ui)[typeof defaultLang];

const getTranslation = (lang: string, key: string): string => {
  const targetLang = (lang in ui ? lang : defaultLang) as Languages;
  const targetKey = key as TranslationKeys;

  return ui[targetLang]?.[targetKey] ?? ui[defaultLang][targetKey] ?? key;
};

export function initI18nDOM() {
  currentLang.subscribe((lang) => {
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

    document.body.classList.add("lang-loaded");
  });
}

if (typeof window !== "undefined") {
  initI18nDOM();
}
