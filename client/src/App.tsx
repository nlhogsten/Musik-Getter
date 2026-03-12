import { useState } from "react";
import { UrlInput } from "./components/UrlInput";
import { FormatInspector } from "./components/FormatInspector";
import { DownloadPanel } from "./components/DownloadPanel";
import { Library } from "./components/Library";

type Tab = "download" | "library";

export default function App() {
  const [tab, setTab] = useState<Tab>("download");
  const [urls, setUrls] = useState<string[]>([""]);
  const [proxy, setProxy] = useState("");
  const [inspectResults, setInspectResults] = useState<any[] | null>(null);
  const [inspecting, setInspecting] = useState(false);

  const handleInspect = async () => {
    const validUrls = urls.filter((u) => u.trim());
    if (validUrls.length === 0) return;

    setInspecting(true);
    setInspectResults(null);

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

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/50">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Music Getter
          </h1>
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

      <main className="mx-auto max-w-4xl px-4 py-6">
        {tab === "download" ? (
          <div className="space-y-6">
            <UrlInput
              urls={urls}
              setUrls={setUrls}
              proxy={proxy}
              setProxy={setProxy}
              onInspect={handleInspect}
              inspecting={inspecting}
            />

            {inspectResults && (
              <FormatInspector results={inspectResults} />
            )}

            <DownloadPanel
              urls={urls.filter((u) => u.trim())}
              proxy={proxy}
            />
          </div>
        ) : (
          <Library />
        )}
      </main>
    </div>
  );
}
