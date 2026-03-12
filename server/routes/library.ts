import { Hono } from "hono";
import { readdir, stat } from "fs/promises";
import { resolve, join } from "path";

const DOWNLOADS_DIR = resolve(import.meta.dir, "../../downloads");

export const libraryRoutes = new Hono();

libraryRoutes.get("/", async (c) => {
  try {
    const entries = await readdir(DOWNLOADS_DIR);
    const files = await Promise.all(
      entries
        .filter((name) => !name.startsWith("."))
        .map(async (name) => {
          const filepath = join(DOWNLOADS_DIR, name);
          const info = await stat(filepath);
          return {
            name,
            path: filepath,
            size: info.size,
            modified: info.mtimeMs,
          };
        })
    );

    files.sort((a, b) => b.modified - a.modified);
    return c.json({ files });
  } catch {
    return c.json({ files: [] });
  }
});

libraryRoutes.post("/reveal", async (c) => {
  const { path } = await c.req.json<{ path: string }>();

  if (!path || !path.startsWith(DOWNLOADS_DIR)) {
    return c.json({ error: "Invalid path" }, 400);
  }

  Bun.spawn(["open", "-R", path]);
  return c.json({ ok: true });
});
