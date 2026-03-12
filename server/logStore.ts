type LogLevel = "info" | "error" | "warn";

export interface LogEntry {
  ts: number;
  level: LogLevel;
  msg: string;
}

const MAX = 200;
const buffer: LogEntry[] = [];
const subscribers = new Set<(entry: LogEntry) => void>();

export function pushLog(level: LogLevel, msg: string) {
  const entry: LogEntry = { ts: Date.now(), level, msg };
  buffer.push(entry);
  if (buffer.length > MAX) buffer.shift();
  for (const fn of subscribers) fn(entry);
}

export function getBuffer(): LogEntry[] {
  return [...buffer];
}

export function subscribe(fn: (entry: LogEntry) => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

// Patch console so all server logs flow through
const origLog = console.log.bind(console);
const origError = console.error.bind(console);
const origWarn = console.warn.bind(console);

console.log = (...args: any[]) => {
  origLog(...args);
  pushLog("info", args.map(String).join(" "));
};
console.error = (...args: any[]) => {
  origError(...args);
  pushLog("error", args.map(String).join(" "));
};
console.warn = (...args: any[]) => {
  origWarn(...args);
  pushLog("warn", args.map(String).join(" "));
};
