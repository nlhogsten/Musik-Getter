import { useState } from "react";

export interface FormatRow {
  id: string;
  ext: string;
  resolution: string;
  note: string;
}

export interface InspectResult {
  url: string;
  command: string;
  success: boolean;
  formats: FormatRow[];
  rawOutput: string;
  error?: string;
}

interface Props {
  results: InspectResult[];
  selected: Map<string, Set<string>>;
  onToggle: (url: string, formatId: string) => void;
}

function isAudio(row: FormatRow) {
  return row.resolution.toLowerCase().includes("audio");
}

export function FormatInspector({ results, selected, onToggle }: Props) {
  const [showRaw, setShowRaw] = useState<Record<number, boolean>>({});

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-6">
      <h2 className="text-sm font-medium text-slate-300">Available Formats</h2>
      {results.map((r, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500 truncate flex-1" title={r.url}>
              {r.url}
            </p>
            <button
              onClick={() => setShowRaw((s) => ({ ...s, [i]: !s[i] }))}
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
                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto rounded bg-slate-900 p-3">
                  {r.rawOutput}
                </pre>
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
                        const audio = isAudio(fmt);
                        return (
                          <tr
                            key={fmt.id}
                            onClick={() => onToggle(r.url, fmt.id)}
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
                                onChange={() => onToggle(r.url, fmt.id)}
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
  );
}
