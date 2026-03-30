import { loadConfig } from "./src/config";
import { handleWebhook } from "./src/webhook/handler";
import { PostgresEventStorage } from "./src/storage/postgres/storage";

const config = loadConfig();
const storage = new PostgresEventStorage(config.databaseUrl);

const server = Bun.serve({
  port: config.port,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "GET" && url.pathname === "/") {
      return new Response("OK");
    }

    if (url.pathname === "/webhook") {
      return handleWebhook(req, storage, config.webhookSecret);
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Listening on http://localhost:${server.port}`);

process.on("SIGINT", async () => {
  await storage.close();
  server.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await storage.close();
  server.stop();
  process.exit(0);
});
