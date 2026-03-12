import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { pushLog } from "../logStore";
import { mkdir } from "node:fs/promises";

const DOWNLOADS_DIR = new URL("../../downloads", import.meta.url).pathname;
const NAMED_PRESETS = new Set(["mp3", "wav", "flac"]);

export const downloadRoutes = new Hono();

downloadRoutes.post("/", async (c) => {
  const { url, format, proxy } = await c.req.json<{
    url: string;
    format?: string;
    proxy?: string;
  }>();

  if (!url) return c.json({ error: "URL is required" }, 400);

  const args: string[] = [];

  if (proxy) args.push("--proxy", proxy);

  const fmt = format || "mp3";
  let formatFolder: string;

  if (NAMED_PRESETS.has(fmt)) {
    // Named audio preset: extract and convert
    formatFolder = fmt;
    args.push("-f", "bestaudio", "--extract-audio", "--audio-format", fmt);
  } else {
    // Raw yt-dlp format ID from inspector - determine format folder from extension
    // For now, use "other" folder for unknown formats
    formatFolder = "other";
    args.push("-f", fmt);
  }

  // Ensure format folder exists
  const formatDir = `${DOWNLOADS_DIR}/${formatFolder}`;
  await mkdir(formatDir, { recursive: true });

  args.push("--newline", "-o", `${formatDir}/%(title)s.%(ext)s`, url);

  const command = `yt-dlp ${args.join(" ")}`;
  pushLog("info", `Download starting: ${command}`);

  return streamSSE(c, async (stream) => {
    await stream.writeSSE({ data: JSON.stringify({ type: "command", command }), event: "message" });

    const proc = Bun.spawn(["yt-dlp", ...args], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const reader = proc.stdout.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          pushLog("info", line.trim());
          await stream.writeSSE({
            data: JSON.stringify({ type: "progress", line: line.trim() }),
            event: "message",
          });
        }
      }
    }

    if (buffer.trim()) {
      pushLog("info", buffer.trim());
      await stream.writeSSE({
        data: JSON.stringify({ type: "progress", line: buffer.trim() }),
        event: "message",
      });
    }

    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    if (stderr) pushLog("error", `yt-dlp stderr: ${stderr.trim()}`);
    pushLog("info", `Download finished. Exit: ${exitCode}`);

    await stream.writeSSE({
      data: JSON.stringify({
        type: "done",
        success: exitCode === 0,
        error: stderr || undefined,
      }),
      event: "message",
    });
  });
});
