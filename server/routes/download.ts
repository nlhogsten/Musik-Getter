import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { pushLog } from "../logStore";
import { mkdir } from "node:fs/promises";
import { unlink } from "node:fs/promises";
import { basename, extname, join } from "node:path";

const DOWNLOADS_DIR = new URL("../../downloads", import.meta.url).pathname;
const NAMED_PRESETS = new Set(["mp3", "wav", "flac"]);

export const downloadRoutes = new Hono();

downloadRoutes.post("/", async (c) => {
  const { url, format, proxy, output, mp3Mode, keepSource } = await c.req.json<{
    url: string;
    format?: string;
    proxy?: string;
    output?: "original" | "mp3";
    mp3Mode?: "v0" | "320";
    keepSource?: boolean;
  }>();

  if (!url) return c.json({ error: "URL is required" }, 400);

  const args: string[] = [];

  if (proxy) args.push("--proxy", proxy);

  const fmt = format || "mp3";
  const outputMode = output || "original";
  const mp3Encoding = mp3Mode || "v0";
  const shouldKeepSource = keepSource === true;

  let formatFolder: string;

  if (outputMode === "mp3") {
    formatFolder = "tmp";
    args.push("-f", NAMED_PRESETS.has(fmt) ? "bestaudio" : fmt);
  } else if (NAMED_PRESETS.has(fmt)) {
    // Named audio preset: extract and convert
    formatFolder = fmt;
    args.push("-f", "bestaudio", "--extract-audio", "--audio-format", fmt);
  } else {
    // Raw yt-dlp format ID from inspector
    formatFolder = "other";
    args.push("-f", fmt);
  }

  // Ensure output folders exist
  const formatDir = `${DOWNLOADS_DIR}/${formatFolder}`;
  await mkdir(formatDir, { recursive: true });
  const mp3Dir = `${DOWNLOADS_DIR}/mp3`;
  if (outputMode === "mp3") await mkdir(mp3Dir, { recursive: true });

  if (outputMode === "mp3") {
    // Print final filepath so we can feed it into ffmpeg after yt-dlp finishes.
    args.push("--print", "after_move:filepath");
  }

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
    const printedPaths: string[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          if (outputMode === "mp3") {
            const trimmed = line.trim();
            if (trimmed.startsWith(formatDir + "/")) printedPaths.push(trimmed);
          }
          pushLog("info", line.trim());
          await stream.writeSSE({
            data: JSON.stringify({ type: "progress", line: line.trim() }),
            event: "message",
          });
        }
      }
    }

    if (buffer.trim()) {
      if (outputMode === "mp3") {
        const trimmed = buffer.trim();
        if (trimmed.startsWith(formatDir + "/")) printedPaths.push(trimmed);
      }
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

    if (outputMode === "mp3" && exitCode === 0) {
      const sourcePath = printedPaths[printedPaths.length - 1];

      if (!sourcePath) {
        pushLog("error", "Could not determine downloaded file path for conversion");
        await stream.writeSSE({
          data: JSON.stringify({
            type: "done",
            success: false,
            error: "Could not determine downloaded file path for conversion",
          }),
          event: "message",
        });
        return;
      }

      const sourceBase = basename(sourcePath, extname(sourcePath));
      const outPath = join(mp3Dir, `${sourceBase}.mp3`);

      const ffmpegArgs: string[] = ["-y", "-i", sourcePath, "-vn", "-c:a", "libmp3lame"];
      if (mp3Encoding === "320") ffmpegArgs.push("-b:a", "320k");
      else ffmpegArgs.push("-q:a", "0");
      ffmpegArgs.push(outPath);

      const ffmpegCommand = `ffmpeg ${ffmpegArgs.join(" ")}`;
      pushLog("info", `Conversion starting: ${ffmpegCommand}`);
      await stream.writeSSE({
        data: JSON.stringify({ type: "command", command: ffmpegCommand }),
        event: "message",
      });

      const ff = Bun.spawn(["ffmpeg", ...ffmpegArgs], { stdout: "pipe", stderr: "pipe" });
      const ffReader = ff.stderr.getReader();
      const ffDecoder = new TextDecoder();
      let ffBuffer = "";
      let ffAll = "";

      while (true) {
        const { done, value } = await ffReader.read();
        if (done) break;
        ffBuffer += ffDecoder.decode(value, { stream: true });
        const ffLines = ffBuffer.split("\n");
        ffBuffer = ffLines.pop() || "";
        for (const l of ffLines) {
          if (l.trim()) {
            ffAll += l + "\n";
            pushLog("info", l.trim());
            await stream.writeSSE({
              data: JSON.stringify({ type: "progress", line: l.trim() }),
              event: "message",
            });
          }
        }
      }

      if (ffBuffer.trim()) {
        ffAll += ffBuffer + "\n";
        pushLog("info", ffBuffer.trim());
        await stream.writeSSE({
          data: JSON.stringify({ type: "progress", line: ffBuffer.trim() }),
          event: "message",
        });
      }

      const ffStderr = ffAll.trim();
      const ffExit = await ff.exited;
      if (ffStderr) pushLog("error", `ffmpeg stderr: ${ffStderr.trim()}`);

      if (ffExit !== 0) {
        await stream.writeSSE({
          data: JSON.stringify({
            type: "done",
            success: false,
            error: ffStderr || "ffmpeg failed",
          }),
          event: "message",
        });
        return;
      }

      if (!shouldKeepSource) {
        try {
          await unlink(sourcePath);
          pushLog("info", `Deleted source file: ${sourcePath}`);
          await stream.writeSSE({
            data: JSON.stringify({ type: "progress", line: `Deleted source file: ${sourcePath}` }),
            event: "message",
          });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          pushLog("error", `Failed to delete source file: ${msg}`);
        }
      }

      await stream.writeSSE({
        data: JSON.stringify({ type: "done", success: true }),
        event: "message",
      });
      return;
    }

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
