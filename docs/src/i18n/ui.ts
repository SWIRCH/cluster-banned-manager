import ruMessages from "./messages/ru.json";
import enMessages from "./messages/en.json";

export const languages = {
  ru: "Русский",
  en: "English",
} as const;

export const defaultLang = "ru";
export type KnownLanguageCode = keyof typeof languages;

export const ui = {
  ru: ruMessages,
  en: enMessages,
} as const;
