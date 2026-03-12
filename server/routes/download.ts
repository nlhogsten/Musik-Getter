import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { resolve } from "path";

const DOWNLOADS_DIR = resolve(import.meta.dir, "../../downloads");

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

  if (format === "mp3") {
    args.push("-f", "bestaudio", "--extract-audio", "--audio-format", "mp3");
  } else if (format === "wav") {
    args.push("-f", "bestaudio", "--extract-audio", "--audio-format", "wav");
  } else if (format === "flac") {
    args.push("-f", "bestaudio", "--extract-audio", "--audio-format", "flac");
  } else if (format) {
    args.push("-f", format);
  } else {
    args.push("-f", "bestaudio", "--extract-audio", "--audio-format", "mp3");
  }

  args.push(
    "--newline",
    "-o",
    `${DOWNLOADS_DIR}/%(title)s.%(ext)s`,
    url
  );

  const command = `yt-dlp ${args.join(" ")}`;

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
          await stream.writeSSE({
            data: JSON.stringify({ type: "progress", line: line.trim() }),
            event: "message",
          });
        }
      }
    }

    if (buffer.trim()) {
      await stream.writeSSE({
        data: JSON.stringify({ type: "progress", line: buffer.trim() }),
        event: "message",
      });
    }

    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

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
