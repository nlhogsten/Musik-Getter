interface Props {
  urls: string[];
  setUrls: (urls: string[]) => void;
  proxy: string;
  setProxy: (proxy: string) => void;
  onInspect: () => void;
  inspecting: boolean;
}

export function UrlInput({ urls, setUrls, proxy, setProxy, onInspect, inspecting }: Props) {
  const updateUrl = (i: number, val: string) => {
    const next = [...urls];
    next[i] = val;
    setUrls(next);
  };

  const addUrl = () => {
    if (urls.length < 3) setUrls([...urls, ""]);
  };

  const removeUrl = (i: number) => {
    if (urls.length > 1) setUrls(urls.filter((_, idx) => idx !== i));
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-4">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">
          URLs (up to 3)
        </label>
        {urls.map((url, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => updateUrl(i, e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            {urls.length > 1 && (
              <button
                onClick={() => removeUrl(i)}
                className="px-3 py-2 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
              >
                &times;
              </button>
            )}
          </div>
        ))}
        {urls.length < 3 && (
          <button
            onClick={addUrl}
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            + Add another URL
          </button>
        )}
      </div>

      <details className="group">
        <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300">
          Proxy settings (optional)
        </summary>
        <div className="mt-2">
          <input
            type="text"
            value={proxy}
            onChange={(e) => setProxy(e.target.value)}
            placeholder="socks5://127.0.0.1:9050 or http://host:port"
            className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </details>

      <button
        onClick={onInspect}
        disabled={inspecting || urls.every((u) => !u.trim())}
        className="rounded-md bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {inspecting ? "Inspecting..." : "Inspect Formats"}
      </button>
    </div>
  );
}
