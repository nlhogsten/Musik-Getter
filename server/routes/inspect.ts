import { Hono } from "hono";
import { pushLog } from "../logStore";

export interface FormatRow {
  id: string;
  ext: string;
  resolution: string;
  note: string;
}

function parseFormats(output: string): FormatRow[] {
  const rows: FormatRow[] = [];
  let inTable = false;

  for (const line of output.split("\n")) {
    // Table starts after the separator line (─── characters)
    if (/^[-─]+/.test(line.trim())) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (!line.trim()) continue;

    // Format: ID EXT RESOLUTION ... (columns separated by whitespace, pipe chars)
    // Strip pipe characters used as column separators
    const clean = line.replace(/[│|]/g, " ").replace(/\s+/g, " ").trim();
    const parts = clean.split(" ");

    if (parts.length < 3) continue;

    const id = parts[0];
    const ext = parts[1];
    const resolution = parts[2];
    const note = parts.slice(3).join(" ");

    rows.push({ id, ext, resolution, note });
  }

  return rows;
}

export const inspectRoutes = new Hono();

inspectRoutes.post("/", async (c) => {
  const { urls, proxy } = await c.req.json<{ urls: string[]; proxy?: string }>();

  if (!urls || urls.length === 0 || urls.length > 3) {
    return c.json({ error: "Provide 1-3 URLs" }, 400);
  }

  const results = await Promise.all(
    urls.map(async (url) => {
      const args = ["-F", "--no-warnings", "--newline", "--no-playlist", url];
      if (proxy) args.splice(1, 0, "--proxy", proxy);

      const command = `yt-dlp ${args.join(" ")}`;
      pushLog("info", `Inspect starting: ${command}`);

      const proc = Bun.spawn(["yt-dlp", ...args], {
        stdout: "pipe",
        stderr: "pipe",
      });

      const startedAt = Date.now();
      const pid = (proc as any)?.pid;
      if (pid) pushLog("info", `yt-dlp PID: ${pid}`);

      const decoder = new TextDecoder();
      let stdoutAll = "";
      let stderrAll = "";

      const readStream = async (
        stream: ReadableStream<Uint8Array>,
        onLine: (line: string) => void,
        onChunk: (chunk: string) => void
      ) => {
        const reader = stream.getReader();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          onChunk(text);
          buf += text;
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) onLine(trimmed);
          }
        }
        const final = buf.trim();
        if (final) onLine(final);
      };

      const heartbeatEveryMs = 5000;
      const timeoutMs = 60000;

      const heartbeat = setInterval(() => {
        const elapsedMs = Date.now() - startedAt;
        pushLog("info", `Inspect still running (${Math.round(elapsedMs / 1000)}s): ${url}`);
      }, heartbeatEveryMs);

      const timeout = setTimeout(() => {
        pushLog("warn", `Inspect timeout after ${Math.round(timeoutMs / 1000)}s; killing yt-dlp for ${url}`);
        try {
          proc.kill();
        } catch {
          // ignore
        }
      }, timeoutMs);

      try {
        await Promise.all([
          readStream(
            proc.stdout,
            (line) => pushLog("info", line),
            (chunk) => {
              stdoutAll += chunk;
            }
          ),
          readStream(
            proc.stderr,
            (line) => pushLog("error", line),
            (chunk) => {
              stderrAll += chunk;
            }
          ),
        ]);
      } finally {
        clearInterval(heartbeat);
        clearTimeout(timeout);
      }

      const exitCode = await proc.exited;
      const elapsedMs = Date.now() - startedAt;
      pushLog("info", `Inspect finished. Exit: ${exitCode}. Duration: ${Math.round(elapsedMs / 1000)}s. URL: ${url}`);

      const stderrTrimmed = stderrAll.trim();
      if (stderrTrimmed) pushLog("error", `yt-dlp stderr (inspect): ${stderrTrimmed}`);

      const formats = exitCode === 0 ? parseFormats(stdoutAll) : [];

      return {
        url,
        command,
        success: exitCode === 0,
        formats,
        rawOutput: stdoutAll,
        error: stderrTrimmed || undefined,
      };
    })
  );

  return c.json({ results });
});
