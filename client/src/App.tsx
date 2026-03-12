import { useState } from "react";
import { UrlInput } from "./components/UrlInput";
import { FormatInspector, type InspectResult } from "./components/FormatInspector";
import { DownloadProgress, type DownloadJob } from "./components/DownloadProgress";
import { Library } from "./components/Library";
import { LogPanel } from "./components/LogPanel";

type Tab = "download" | "library";

export default function App() {
  const [tab, setTab] = useState<Tab>("download");
  const [urls, setUrls] = useState<string[]>([""]);
  const [proxy, setProxy] = useState("");
  const [inspectResults, setInspectResults] = useState<InspectResult[] | null>(null);
  const [inspecting, setInspecting] = useState(false);
  // url → Set of selected format IDs
  const [selected, setSelected] = useState<Map<string, Set<string>>>(new Map());
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [downloading, setDownloading] = useState(false);

  const handleInspect = async () => {
    const validUrls = urls.filter((u) => u.trim());
    if (validUrls.length === 0) return;

    setInspecting(true);
    setInspectResults(null);
    setSelected(new Map());
    setJobs([]);

    try {
      const res = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: validUrls, proxy: proxy || undefined }),
      });
      const data = await res.json();
      setInspectResults(data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setInspecting(false);
    }
  };

  const handleToggle = (url: string, formatId: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(url) ?? []);
      if (set.has(formatId)) set.delete(formatId);
      else set.add(formatId);
      next.set(url, set);
      return next;
    });
  };

  const selectedCount = [...selected.values()].reduce((n, s) => n + s.size, 0);

  const handleDownload = async () => {
    if (selectedCount === 0) return;
    setDownloading(true);

    // Build flat list of (url, formatId) pairs
    const pairs: { url: string; formatId: string }[] = [];
    for (const [url, formatIds] of selected.entries()) {
      for (const formatId of formatIds) {
        pairs.push({ url, formatId });
      }
    }

    const initial: DownloadJob[] = pairs.map(({ url, formatId }) => ({
      url,
      formatId,
      status: "queued",
      lines: [],
    }));
    setJobs(initial);

    for (let i = 0; i < pairs.length; i++) {
      const { url, formatId } = pairs[i];

      setJobs((prev) =>
        prev.map((j, idx) => (idx === i ? { ...j, status: "downloading" } : j))
      );

      try {
        const res = await fetch("/api/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, format: formatId, proxy: proxy || undefined }),
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
            const dataLine = part.split("\n").find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            const json = JSON.parse(dataLine.slice(5).trim());

            setJobs((prev) =>
              prev.map((j, idx) => {
                if (idx !== i) return j;
                if (json.type === "command") return { ...j, command: json.command };
                if (json.type === "progress") return { ...j, lines: [...j.lines, json.line] };
                if (json.type === "done")
                  return { ...j, status: json.success ? "done" : "error", error: json.error };
                return j;
              })
            );
          }
        }
      } catch (err: any) {
        setJobs((prev) =>
          prev.map((j, idx) =>
            idx === i ? { ...j, status: "error", error: err.message } : j
          )
        );
      }
    }

    setDownloading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      <header className="border-b border-slate-700 bg-slate-800/50">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">Music Getter</h1>
          <nav className="flex gap-1">
            <button
              onClick={() => setTab("download")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === "download"
                  ? "bg-violet-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              Download
            </button>
            <button
              onClick={() => setTab("library")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === "library"
                  ? "bg-violet-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              Library
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {tab === "download" ? (
          <>
            <UrlInput
              urls={urls}
              setUrls={setUrls}
              proxy={proxy}
              setProxy={setProxy}
              onInspect={handleInspect}
              inspecting={inspecting}
            />

            {inspectResults && (
              <FormatInspector
                results={inspectResults}
                selected={selected}
                onToggle={handleToggle}
              />
            )}

            {selectedCount > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-violet-700/50 bg-violet-900/20 px-5 py-3">
                <p className="text-sm text-violet-300">
                  {selectedCount} format{selectedCount !== 1 ? "s" : ""} selected
                </p>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="rounded-md bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {downloading ? "Downloading..." : "Download Selected"}
                </button>
              </div>
            )}

            <DownloadProgress jobs={jobs} />
          </>
        ) : (
          <Library />
        )}
      </main>

      <LogPanel />
    </div>
  );
}
