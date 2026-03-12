import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { getBuffer, subscribe } from "../logStore";

export const logsRoutes = new Hono();

logsRoutes.get("/", (c) => {
  return streamSSE(c, async (stream) => {
    // Send existing buffer first
    for (const entry of getBuffer()) {
      await stream.writeSSE({ data: JSON.stringify(entry), event: "log" });
    }

    // Stream new entries as they arrive
    let done = false;
    const queue: any[] = [];
    let resolve: (() => void) | null = null;

    const unsub = subscribe((entry) => {
      queue.push(entry);
      resolve?.();
    });

    stream.onAbort(() => {
      done = true;
      unsub();
      resolve?.();
    });

    while (!done) {
      if (queue.length === 0) {
        await new Promise<void>((r) => { resolve = r; });
        resolve = null;
      }
      while (queue.length > 0) {
        const entry = queue.shift();
        await stream.writeSSE({ data: JSON.stringify(entry), event: "log" });
      }
    }
  });
});
