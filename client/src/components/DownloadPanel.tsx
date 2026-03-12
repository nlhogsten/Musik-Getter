import { useState, useRef } from "react";

interface Props {
  urls: string[];
  proxy: string;
}

interface DownloadState {
  url: string;
  status: "idle" | "downloading" | "done" | "error";
  command?: string;
  lines: string[];
  error?: string;
}

const FORMAT_OPTIONS = [
  { value: "mp3", label: "MP3 (audio)" },
  { value: "wav", label: "WAV (audio)" },
  { value: "flac", label: "FLAC (audio)" },
  { value: "bestaudio", label: "Best Audio (original)" },
  { value: "bestvideo+bestaudio", label: "Best Video + Audio" },
];

export function DownloadPanel({ urls, proxy }: Props) {
  const [format, setFormat] = useState("mp3");
  const [downloads, setDownloads] = useState<DownloadState[]>([]);
  const [downloading, setDownloading] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const startDownload = async () => {
    if (urls.length === 0) return;
    setDownloading(true);

    const initial: DownloadState[] = urls.map((url) => ({
      url,
      status: "idle",
      lines: [],
    }));
    setDownloads(initial);

    for (let i = 0; i < urls.length; i++) {
      setDownloads((prev) =>
        prev.map((d, idx) =>
          idx === i ? { ...d, status: "downloading" } : d
        )
      );

      try {
        const res = await fetch("/api/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: urls[i],
            format,
            proxy: proxy || undefined,
          }),
        });

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const dataLine = part
              .split("\n")
              .find((l) => l.startsWith("data:"));
            if (!dataLine) continue;

            const json = JSON.parse(dataLine.slice(5).trim());
            const idx = i;

            if (json.type === "command") {
              setDownloads((prev) =>
                prev.map((d, j) =>
                  j === idx ? { ...d, command: json.command } : d
                )
              );
            } else if (json.type === "progress") {
              setDownloads((prev) =>
                prev.map((d, j) =>
                  j === idx ? { ...d, lines: [...d.lines, json.line] } : d
                )
              );
              logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
            } else if (json.type === "done") {
              setDownloads((prev) =>
                prev.map((d, j) =>
                  j === idx
                    ? {
                        ...d,
                        status: json.success ? "done" : "error",
                        error: json.error,
                      }
                    : d
                )
              );
            }
          }
        }
      } catch (err: any) {
        setDownloads((prev) =>
          prev.map((d, idx) =>
            idx === i
              ? { ...d, status: "error", error: err.message }
              : d
          )
        );
      }
    }

    setDownloading(false);
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-4">
      <h2 className="text-sm font-medium text-slate-300">Download</h2>

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-slate-400 mb-1">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          >
            {FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={startDownload}
          disabled={downloading || urls.length === 0}
          className="rounded-md bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {downloading ? "Downloading..." : "Download"}
        </button>
      </div>

      {downloads.length > 0 && (
        <div className="space-y-3">
          {downloads.map((d, i) => (
            <div
              key={i}
              className="rounded-md bg-slate-900 p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    d.status === "downloading"
                      ? "bg-yellow-400 animate-pulse"
                      : d.status === "done"
                      ? "bg-green-400"
                      : d.status === "error"
                      ? "bg-red-400"
                      : "bg-slate-600"
                  }`}
                />
                <span className="text-xs text-slate-400 truncate flex-1">
                  {d.url}
                </span>
                <span className="text-xs text-slate-500 capitalize">
                  {d.status}
                </span>
              </div>

              {d.command && (
                <p className="text-xs text-violet-400 font-mono break-all">
                  $ {d.command}
                </p>
              )}

              {d.lines.length > 0 && (
                <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {d.lines.slice(-20).join("\n")}
                </pre>
              )}

              {d.error && (
                <p className="text-xs text-red-400">{d.error}</p>
              )}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
}
