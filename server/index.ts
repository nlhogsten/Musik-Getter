import { Hono } from "hono";
import { cors } from "hono/cors";
import { inspectRoutes } from "./routes/inspect";
import { downloadRoutes } from "./routes/download";
import { libraryRoutes } from "./routes/library";

const app = new Hono();

app.use("/*", cors({ origin: "http://localhost:5173" }));

app.route("/inspect", inspectRoutes);
app.route("/download", downloadRoutes);
app.route("/library", libraryRoutes);

app.get("/health", (c) => c.json({ status: "ok" }));

export default {
  port: 3420,
  fetch: app.fetch,
};

console.log("Server running on http://localhost:3420");
