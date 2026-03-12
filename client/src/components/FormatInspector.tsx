interface InspectResult {
  url: string;
  command: string;
  success: boolean;
  output: string;
  error?: string;
}

export function FormatInspector({ results }: { results: InspectResult[] }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-4">
      <h2 className="text-sm font-medium text-slate-300">Format Inspector</h2>
      {results.map((r, i) => (
        <div key={i} className="space-y-2">
          <p className="text-xs text-slate-500 truncate" title={r.url}>
            {r.url}
          </p>
          <div className="rounded-md bg-slate-900 p-3">
            <p className="text-xs text-violet-400 font-mono mb-2 break-all">
              $ {r.command}
            </p>
            {r.success ? (
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
                {r.output}
              </pre>
            ) : (
              <p className="text-xs text-red-400">{r.error || "Unknown error"}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
