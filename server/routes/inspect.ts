import { Hono } from "hono";

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
      const proc = Bun.spawn(["yt-dlp", ...args], {
        stdout: "pipe",
        stderr: "pipe",
      });

      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;

      return {
        url,
        command,
        success: exitCode === 0,
        output: stdout,
        error: stderr || undefined,
      };
    })
  );

  return c.json({ results });
});
