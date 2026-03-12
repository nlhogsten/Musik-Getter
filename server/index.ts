import "./logStore"; // patch console early
import { Hono } from "hono";
import { cors } from "hono/cors";
import { inspectRoutes } from "./routes/inspect";
import { downloadRoutes } from "./routes/download";
import { libraryRoutes } from "./routes/library";
import { logsRoutes } from "./routes/logs";

const app = new Hono();

app.use("/*", cors({ origin: "http://localhost:5173" }));

// Log every incoming request
app.use("/*", async (c, next) => {
  console.log(`→ ${c.req.method} ${c.req.path}`);
  await next();
  console.log(`← ${c.res.status} ${c.req.path}`);
});

app.route("/inspect", inspectRoutes);
app.route("/download", downloadRoutes);
app.route("/library", libraryRoutes);
app.route("/logs", logsRoutes);

app.get("/health", (c) => c.json({ status: "ok" }));

export default {
  port: 3420,
  fetch: app.fetch,
};

console.log("Server running on http://localhost:3420");
