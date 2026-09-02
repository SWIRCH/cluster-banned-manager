const langs = {
  ru: {
    label: "Русский (Russian)",
  },
  en: {
    label: "English (Английский)",
  },
};

export function langFormat( lang: "ru" | "en" | string): string {
  if (lang in langs) {
    return langs[lang as keyof typeof langs].label;
  }

  return lang;
}