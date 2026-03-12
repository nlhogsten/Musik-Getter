import { Hono } from "hono";
import { readdir, writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const DOWNLOADS_DIR = join(__dirname, "..", "..", "downloads");
const INSPECTIONS_DIR = join(DOWNLOADS_DIR, "inspections");

interface SavedInspection {
  id: string;
  timestamp: number;
  urls: string[];
  results: any[];
  rawOutput: string;
  proxy?: string;
}

interface InspectionEntry {
  id: string;
  timestamp: number;
  urlCount: number;
  successCount: number;
  hasProxy: boolean;
  urls: string[];
}

export const inspectionsRoutes = new Hono();

// Ensure inspections directory exists
const ensureDir = async () => {
  try {
    await mkdir(INSPECTIONS_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
};

// Get list of inspections
inspectionsRoutes.get("/", async (c) => {
  await ensureDir();
  
  try {
    const entries = await readdir(INSPECTIONS_DIR);
    const inspections: InspectionEntry[] = [];

    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;
      
      try {
        const filePath = join(INSPECTIONS_DIR, entry);
        const content = await readFile(filePath, 'utf-8');
        const inspection: SavedInspection = JSON.parse(content);
        
        const successCount = inspection.results.filter(r => r.success).length;
        
        inspections.push({
          id: inspection.id,
          timestamp: inspection.timestamp,
          urlCount: inspection.urls.length,
          successCount,
          hasProxy: !!inspection.proxy,
          urls: inspection.urls
        });
      } catch (err) {
        console.error(`Error reading inspection file ${entry}:`, err);
      }
    }

    inspections.sort((a, b) => b.timestamp - a.timestamp);
    return c.json({ inspections });
  } catch (err) {
    console.error('Error listing inspections:', err);
    return c.json({ inspections: [] });
  }
});

// Get specific inspection
inspectionsRoutes.get("/:id", async (c) => {
  const id = c.req.param('id');
  
  if (!id) {
    return c.json({ error: "Invalid inspection ID" }, 400);
  }

  await ensureDir();
  
  try {
    const filePath = join(INSPECTIONS_DIR, `${id}.json`);
    const content = await readFile(filePath, 'utf-8');
    const inspection: SavedInspection = JSON.parse(content);
    return c.json(inspection);
  } catch (err) {
    return c.json({ error: "Inspection not found" }, 404);
  }
});

// Save inspection
inspectionsRoutes.post("/", async (c) => {
  const inspection: SavedInspection = await c.req.json();
  
  if (!inspection.id || !inspection.timestamp || !inspection.urls || !inspection.results) {
    return c.json({ error: "Invalid inspection data" }, 400);
  }

  await ensureDir();
  
  try {
    const filePath = join(INSPECTIONS_DIR, `${inspection.id}.json`);
    await writeFile(filePath, JSON.stringify(inspection, null, 2));
    return c.json({ ok: true, id: inspection.id });
  } catch (err) {
    console.error('Error saving inspection:', err);
    return c.json({ error: "Failed to save inspection" }, 500);
  }
});

// Delete inspection
inspectionsRoutes.delete("/:id", async (c) => {
  const id = c.req.param('id');
  
  if (!id) {
    return c.json({ error: "Invalid inspection ID" }, 400);
  }

  await ensureDir();
  
  try {
    const filePath = join(INSPECTIONS_DIR, `${id}.json`);
    await readFile(filePath); // Check if file exists
    // Note: Node.js doesn't have a direct delete function in fs/promises
    // We'll use Bun.spawn for this
    const proc = Bun.spawn(["rm", filePath]);
    await proc.exited;
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: "Inspection not found" }, 404);
  }
});
