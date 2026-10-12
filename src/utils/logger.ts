type CallerInfo = {
  file: string;
  url: string;
  line: number;
  column: number;
};

const SKIP = /logger\.(ts|js)/;
const FRAME =
  /(?:\(|\s|@)((?:[a-zA-Z]+:\/\/[^\s)]+)|[A-Za-z]:[\\/][^\s():]+|\/?[^\s():]+?):(\d+):(\d+)\)?$/;

function getCaller(): CallerInfo | null {
  const stack = new Error().stack;
  if (!stack) return null;

  for (const line of stack.split("\n")) {
    if (!line.includes(".") || SKIP.test(line)) continue;

    const m = line.match(FRAME);
    if (!m) continue;

    const [, rawFile, l, c] = m;
    return {
      file: shorten(rawFile),
      url: toUrl(rawFile, +l, +c),
      line: +l,
      column: +c,
    };
  }
  return null;
}

function shorten(file: string): string {
  try {
    if (/^https?:\/\//.test(file)) {
      return new URL(file).pathname.replace(/^\//, "");
    }
  } catch {}

  const parts = file.replace(/\\/g, "/").split("/");
  const i = Math.max(parts.lastIndexOf("src"), parts.lastIndexOf("app"));
  return i >= 0 ? parts.slice(i).join("/") : parts.slice(-2).join("/");
}

function toUrl(file: string, line: number, col: number): string {
  if (/^(https?|tauri|file):\/\//.test(file)) return `${file}:${line}:${col}`;
  return `vscode://file/${file.replace(/\\/g, "/").replace(/^\//, "")}:${line}:${col}`;
}

const COLOR = {
  ok: "color:#58f570",
  log: "color:#6b7280",
  warn: "color:#f59e0b;font-weight:600",
  error: "color:#ef4444;font-weight:600",
  tag: "color:#9ca3af;font-size:11px",
  link: "color:#0080ff;text-decoration:underline",
} as const;

type Level = keyof typeof COLOR;

function emit(level: Level, args: unknown[]) {
  const c = getCaller();
  const badge = `%c${level.toUpperCase().padEnd(5)}`;
  // ${c.file}:${c.line}
  const tag = c ? `%c` : "";

  // if (level === 'log') {
  console.groupCollapsed(badge + tag, COLOR[level], COLOR.tag, ...args);
  console.trace("Стек вызовов:");
  if (c) console.log(`%c↳ ${c.url}`, COLOR.link);
  console.groupEnd();
  // } else if (level === 'success') {
  // 	console.groupCollapsed(badge + tag, COLOR[level], COLOR.tag, ...args)
  // 	console.trace('Стек вызовов:')
  // 	if (c) console.log(`%c↳ ${c.url}`, COLOR.link)
  // 	console.groupEnd()
  // } else {
  // 	// @ts-ignore
  // 	console[level](badge + tag, COLOR[level], COLOR.tag, ...args)
  // 	if (c) console.log(`%c↳ ${c.url}`, COLOR.link)
  // }
}

const dev = import.meta.env.DEV;

export const logger = {
  success: (...a: unknown[]) => {
    if (dev) emit("ok", a);
  },
  log: (...a: unknown[]) => {
    if (dev) emit("log", a);
  },
  warn: (...a: unknown[]) => {
    if (dev) emit("warn", a);
  },
  error: (...a: unknown[]) => {
    if (dev) emit("error", a);
  },
};
