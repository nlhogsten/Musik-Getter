# Music Getter

A local download tool powered by `yt-dlp` and `ffmpeg`. Paste up to 3 URLs, inspect available formats, and download audio in MP3, WAV, FLAC, or the original best quality.

## Requirements

- [Bun](https://bun.sh) — replaces Node.js entirely
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — download engine
- [ffmpeg](https://ffmpeg.org) — audio conversion

### Install with Homebrew

```bash
brew install yt-dlp ffmpeg
```

### Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

## Setup

```bash
bun install
```

This installs dependencies for both `server` and `client` via Bun workspaces.

## Running

```bash
bun run dev
```

This starts both the server (port 3001) and client (port 5173) concurrently. Then open [http://localhost:5173](http://localhost:5173).

## Architecture

```
Music-Getter/
├── server/                  # Bun + Hono backend
│   ├── index.ts             # Server entry (port 3001)
│   └── routes/
│       ├── inspect.ts       # POST /inspect — run yt-dlp -F on URLs
│       ├── download.ts      # POST /download — stream download progress via SSE
│       └── library.ts       # GET /library, POST /library/reveal
├── client/                  # React + Tailwind frontend (Vite)
│   └── src/
│       ├── App.tsx
│       └── components/
│           ├── UrlInput.tsx       # URL fields + optional proxy input
│           ├── FormatInspector.tsx # Shows yt-dlp -F output + command used
│           ├── DownloadPanel.tsx  # Format selector, download button, live logs
│           └── Library.tsx        # File list with "Show in Finder"
└── downloads/               # Output folder (gitignored)
```

### How it works

- The **Vite dev server** proxies `/api/*` requests to the Hono server at `localhost:3001`, so the frontend and backend run on separate ports without CORS issues in development.
- **Format inspection** shells out to `yt-dlp -F <url>` and returns the raw format table so you can see exactly what streams are available before downloading.
- **Downloads** use `Bun.spawn` to run `yt-dlp` and pipe stdout back to the browser in real time via [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events). No WebSocket library needed.
- **Proxy support** — enter a proxy in the optional field (e.g. `socks5://127.0.0.1:9050` for Tor, or `http://host:port` for HTTP proxies). It gets appended to all `yt-dlp` calls.

## Supported formats

| Option | What it does |
|---|---|
| MP3 | Extracts best audio stream, converts to MP3 via ffmpeg |
| WAV | Extracts best audio stream, converts to WAV via ffmpeg |
| FLAC | Extracts best audio stream, converts to FLAC via ffmpeg |
| Best Audio | Downloads best audio in original codec (no conversion) |
| Best Video + Audio | Downloads best combined video + audio stream |

Downloaded files land in the `downloads/` folder. Use **Show in Finder** in the Library tab to locate them.
