export interface DownloadJob {
  url: string;
  formatId: string;
  status: "queued" | "downloading" | "done" | "error";
  command?: string;
  lines: string[];
  error?: string;
}

interface Props {
  jobs: DownloadJob[];
}

const STATUS_DOT: Record<DownloadJob["status"], string> = {
  queued: "bg-slate-500",
  downloading: "bg-yellow-400 animate-pulse",
  done: "bg-green-400",
  error: "bg-red-400",
};

export function DownloadProgress({ jobs }: Props) {
  if (jobs.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-3">
      <h2 className="text-sm font-medium text-slate-300">Download Progress</h2>
      {jobs.map((job, i) => (
        <div key={i} className="rounded-md bg-slate-900 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT[job.status]}`} />
            <span className="text-xs text-slate-400 truncate flex-1">{job.url}</span>
            <span className="text-xs font-mono text-slate-500 shrink-0">{job.formatId}</span>
            <span className="text-xs text-slate-500 capitalize">{job.status}</span>
          </div>
          {job.command && (
            <p className="text-xs text-violet-400 font-mono break-all">$ {job.command}</p>
          )}
          {job.lines.length > 0 && (
            <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
              {job.lines.slice(-20).join("\n")}
            </pre>
          )}
          {job.error && <p className="text-xs text-red-400">{job.error}</p>}
        </div>
      ))}
    </div>
  );
}
