export type PingInfo = {
  last: number | null;
  avg: number | null;
  attempts: number;
  successes: number;
  lossPercent: number;
  status: string;
  lastError?: string;
};

export type PingMap = Record<string, PingInfo>;

export const IDLE_PING: PingInfo = {
  last: null,
  avg: null,
  attempts: 0,
  successes: 0,
  lossPercent: 0,
  status: "idle",
};
