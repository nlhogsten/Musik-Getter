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
      const args = ["-F", "--no-warnings", url];
      if (proxy) args.splice(1, 0, "--proxy", proxy);

      const command = `yt-dlp ${args.join(" ")}`;
      pushLog("info", `Running: ${command}`);

      const proc = Bun.spawn(["yt-dlp", ...args], {
        stdout: "pipe",
        stderr: "pipe",
      });

      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;

      if (stderr) pushLog("error", `yt-dlp stderr: ${stderr.trim()}`);
      pushLog("info", `Exit code: ${exitCode} for ${url}`);

      const formats = exitCode === 0 ? parseFormats(stdout) : [];

      return {
        url,
        command,
        success: exitCode === 0,
        formats,
        rawOutput: stdout,
        error: stderr || undefined,
      };
    })
  );

  return c.json({ results });
});
