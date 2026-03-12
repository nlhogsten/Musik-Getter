import { useState, useEffect } from "react";
import { type InspectResult } from "./FormatInspector";
import { DownloadProgress, type DownloadJob } from "./DownloadProgress";

interface SavedInspection {
  id: string;
  timestamp: number;
  urls: string[];
  results: InspectResult[];
  rawOutput: string;
  proxy?: string;
}

interface InspectionEntry {
  id: string;
  timestamp: number;
  urlCount: number;
  successCount: number;
  hasProxy: boolean;
  urls: string[];
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString();
}

function formatUrls(urls: string[]): string {
  if (urls.length === 0) return "No URLs";
  if (urls.length === 1) return urls[0];
  return `${urls[0]} +${urls.length - 1} more`;
}

export function InspectionHistory() {
  const [inspections, setInspections] = useState<InspectionEntry[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<SavedInspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Map<string, Set<string>>>(new Map());
  const [showRaw, setShowRaw] = useState<Record<number, boolean>>({});
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [downloading, setDownloading] = useState(false);

  const loadInspections = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inspections");
      const data = await res.json();
      setInspections(data.inspections);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspection = async (id: string) => {
    try {
      const res = await fetch(`/api/inspections/${id}`);
      if (!res.ok) throw new Error(`Failed to load inspection: ${res.statusText}`);
      const data = await res.json();
      setSelectedInspection(data);
      setSelected(new Map());
      setJobs([]);
    } catch (err) {
      console.error('Error loading inspection:', err);
    }
  };

  const deleteInspection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inspection?')) return;
    
    try {
      const res = await fetch(`/api/inspections/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadInspections();
        if (selectedInspection?.id === id) {
          setSelectedInspection(null);
        }
      }
    } catch (err) {
      console.error('Error deleting inspection:', err);
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
    if (!selectedInspection || selectedCount === 0) return;
    setDownloading(true);

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
          body: JSON.stringify({ 
            url, 
            format: formatId, 
            proxy: selectedInspection.proxy || undefined 
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
          prev.map((j, idx) => (idx === i ? { ...j, status: "error", error: err.message } : j))
        );
      }
    }

    setDownloading(false);
  };

  return (
    <div className="space-y-6">
      {/* Inspection List */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">
            Inspection History
          </h2>
          <button
            onClick={loadInspections}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : inspections.length === 0 ? (
          <p className="text-sm text-slate-500">No inspections yet. Inspect some URLs first!</p>
        ) : (
          <div className="divide-y divide-slate-700">
            {inspections.map((inspection) => (
              <div className="flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-700/30 rounded-md px-2 transition-colors"
                onClick={() => loadInspection(inspection.id)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate" title={formatUrls(inspection.urls)}>
                    {formatUrls(inspection.urls)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(inspection.timestamp)} &middot; {inspection.urlCount} URL{inspection.urlCount !== 1 ? "s" : ""} &middot; {inspection.successCount}/{inspection.urlCount} successful
                    {inspection.hasProxy && " &middot; proxy"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="shrink-0 text-xs text-slate-400 hover:text-white px-3 py-1 rounded-md hover:bg-slate-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadInspection(inspection.id);
                    }}
                  >
                    View
                  </button>
                  <button
                    className="shrink-0 text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded-md hover:bg-red-900/30 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteInspection(inspection.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Inspection Details */}
      {selectedInspection && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-300">
                Inspection Details
              </h3>
              <p className="text-xs text-slate-500">
                {formatDate(selectedInspection.timestamp)} &middot; ID: {selectedInspection.id}
                {selectedInspection.proxy && " &middot; proxy used"}
              </p>
            </div>
            <button
              onClick={() => setSelectedInspection(null)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-md hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>

          {/* Format Inspector for Selected Inspection */}
          <div className="space-y-3">
            {selectedInspection.results.map((r, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500 truncate flex-1" title={r.url}>
                    {r.url}
                  </p>
                  <button
                    onClick={() => {
                      setShowRaw((s) => ({ ...s, [i]: !s[i] }));
                    }}
                    className="text-xs text-slate-500 hover:text-slate-300 shrink-0"
                  >
                    {showRaw[i] ? "hide raw" : "show raw"}
                  </button>
                </div>

                {/* Command */}
                <p className="text-xs text-violet-400 font-mono break-all">
                  $ {r.command}
                </p>

                {r.success ? (
                  <>
                    {showRaw[i] ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-medium text-slate-300">Raw Inspection Output</h4>
                          <button
                            onClick={() => navigator.clipboard.writeText(selectedInspection.rawOutput)}
                            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            Copy to Clipboard
                          </button>
                        </div>
                        <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto rounded bg-slate-900 p-3">
                          {selectedInspection.rawOutput}
                        </pre>
                      </div>
                    ) : (
                      <div className="rounded-md border border-slate-700 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-700/50 text-slate-400">
                              <th className="px-3 py-2 text-left font-medium w-6"></th>
                              <th className="px-3 py-2 text-left font-medium">ID</th>
                              <th className="px-3 py-2 text-left font-medium">EXT</th>
                              <th className="px-3 py-2 text-left font-medium">Resolution</th>
                              <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/50">
                            {r.formats.map((fmt) => {
                              const checked = selected.get(r.url)?.has(fmt.id) ?? false;
                              const audio = fmt.resolution.toLowerCase().includes("audio");
                              return (
                                <tr
                                  key={fmt.id}
                                  onClick={() => handleToggle(r.url, fmt.id)}
                                  className={`cursor-pointer transition-colors ${
                                    checked
                                      ? "bg-violet-900/30 hover:bg-violet-900/40"
                                      : "hover:bg-slate-700/30"
                                  }`}
                                >
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleToggle(r.url, fmt.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="accent-violet-500"
                                  />
                                </td>
                                <td className="px-3 py-2 font-mono text-slate-300">{fmt.id}</td>
                                <td className="px-3 py-2">
                                  <span className="rounded px-1.5 py-0.5 bg-slate-700 text-slate-300 font-mono">
                                    {fmt.ext}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <span className={audio ? "text-sky-400" : "text-slate-300"}>
                                    {fmt.resolution}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-slate-500 hidden sm:table-cell truncate max-w-xs">
                                  {fmt.note}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-md bg-red-950/40 border border-red-800/50 p-3">
                    <p className="text-xs text-red-400">{r.error || "Inspection failed"}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Download Section */}
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

          {/* Download Progress */}
          <DownloadProgress jobs={jobs} />
        </div>
      )}
    </div>
  );
}
