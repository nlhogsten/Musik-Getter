import { useState, useEffect } from "react";

interface FileEntry {
  name: string;
  path: string;
  size: number;
  modified: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString();
}

export function Library() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/library");
      const data = await res.json();
      setFiles(data.files);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const reveal = async (path: string) => {
    await fetch("/api/library/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-300">
          Downloaded Files
        </h2>
        <button
          onClick={loadFiles}
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : files.length === 0 ? (
        <p className="text-sm text-slate-500">No files yet. Download something first!</p>
      ) : (
        <div className="divide-y divide-slate-700">
          {files.map((f) => (
            <div
              key={f.path}
              className="py-3 flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate" title={f.name}>
                  {f.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatSize(f.size)} &middot; {formatDate(f.modified)}
                </p>
              </div>
              <button
                onClick={() => reveal(f.path)}
                className="shrink-0 text-xs text-slate-400 hover:text-white px-3 py-1 rounded-md hover:bg-slate-700 transition-colors"
              >
                Show in Finder
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
