import { Hono } from "hono";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const DOWNLOADS_DIR = new URL("../../downloads", import.meta.url).pathname;

// Recursive function to scan directories for files
async function scanDirectory(dirPath: string, relativePath: string = ""): Promise<any[]> {
  try {
    const entries = await readdir(dirPath);
    const files: any[] = [];
    
    for (const name of entries) {
      if (name.startsWith(".")) continue;
      
      const fullPath = join(dirPath, name);
      const info = await stat(fullPath);
      
      if (info.isDirectory()) {
        // Recursively scan subdirectory
        const subFiles = await scanDirectory(fullPath, `${relativePath}${name}/`);
        files.push(...subFiles);
      } else {
        // Add file with relative path
        files.push({
          name,
          path: fullPath,
          relativePath: `${relativePath}${name}`,
          size: info.size,
          modified: info.mtimeMs,
        });
      }
    }
    
    return files;
  } catch {
    return [];
  }
}

export const libraryRoutes = new Hono();

libraryRoutes.get("/", async (c) => {
  try {
    const files = await scanDirectory(DOWNLOADS_DIR);
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

libraryRoutes.delete("/", async (c) => {
  const { path } = await c.req.json<{ path: string }>();

  if (!path || !path.startsWith(DOWNLOADS_DIR)) {
    return c.json({ error: "Invalid path" }, 400);
  }

  try {
    // Use Bun.spawn for file deletion
    const proc = Bun.spawn(["rm", path]);
    await proc.exited;
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: "Failed to delete file" }, 500);
  }
});
