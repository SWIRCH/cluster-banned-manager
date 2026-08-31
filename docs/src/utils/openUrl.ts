export type TargetType = "_blank" | "_self" | "_parent" | "_top" | (string & {});

interface OpenUrlOptions {
  target?: TargetType;
  rel?: string;
}

/**
 * Безопасно открывает URL в браузере с поддержкой SSR и разных способов навигации.
 */
export function openUrl(url: string, options: OpenUrlOptions = {}): void {
  // Защита от вызова на сервере (Astro SSG/SSR)
  if (typeof window === "undefined" || !url) {
    return;
  }

  const { target = "_self", rel = "noopener,noreferrer" } = options;

  if (target === "_self") {
    window.location.href = url;
    return;
  }

  const newWindow = window.open(url, target, target === "_blank" ? rel : undefined);

  if (newWindow && target === "_blank") {
    newWindow.opener = null;
    newWindow.focus();
  }
}
