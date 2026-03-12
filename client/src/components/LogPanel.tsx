import { useEffect, useRef, useState } from "react";

interface LogEntry {
  ts: number;
  level: "info" | "error" | "warn";
  msg: string;
}

const LEVEL_COLOR: Record<LogEntry["level"], string> = {
  info: "text-slate-400",
  warn: "text-yellow-400",
  error: "text-red-400",
};

export function LogPanel() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource("/api/logs");

    es.addEventListener("log", (e) => {
      try {
        const entry: LogEntry = JSON.parse(e.data);
        setLogs((prev) => [...prev.slice(-299), entry]);
      } catch {}
    });

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    return () => es.close();
  }, []);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, open]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Toggle bar */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-slate-950 border-t border-slate-700 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`}
          />
          <span className="text-xs text-slate-400 font-mono">Server Logs</span>
          {logs.length > 0 && (
            <span className="text-xs text-slate-600 font-mono">({logs.length})</span>
          )}
        </div>
        <span className="text-xs text-slate-500">{open ? "▼" : "▲"}</span>
      </div>

      {/* Log window */}
      {open && (
        <div className="bg-slate-950 border-t border-slate-700 h-48 overflow-y-auto px-4 py-2 font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-slate-600">No logs yet...</p>
          ) : (
            logs.map((entry, i) => (
              <div key={i} className="flex gap-3 leading-5">
                <span className="text-slate-600 shrink-0">
                  {new Date(entry.ts).toLocaleTimeString()}
                </span>
                <span className={`${LEVEL_COLOR[entry.level]} break-all`}>
                  {entry.msg}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
