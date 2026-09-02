function getCallerLocation(): string {
  const err = new Error();
  const stack = err.stack;
  if (!stack) return '';

  const lines = stack.split('\n');
  const callerLine = lines[3] || lines[2] || '';
  const match = callerLine.match(/(?:[^\/\\]+[\\\/])*(.+?):(\d+):(\d+)\)?$/);

  if (match) {
    const filename = match[1];
    const line = match[2];
    return `[${filename}:${line}]`;
  }

  return '';
}

export const logger = {
  log: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      const location = getCallerLocation();
      console.log(location, "\n", ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      const location = getCallerLocation();
      console.error(location, "\n", ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      const location = getCallerLocation();
      console.warn(location, "\n", ...args);
    }
  },
};