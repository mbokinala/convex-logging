// server.ts
import { createClient } from "@clickhouse/client";
import { serve } from "@hono/node-server";
import { readFileSync } from "fs";
import { Hono } from "hono";
import { join } from "path";
import { ingestConsoleLogs } from "./ingest/console-log";
import { ingestFunctionExecutionEvents } from "./ingest/function-execution";

const PORT = process.env.PORT || 3000;

const app = new Hono();

app.get("/", (c) => {
  return c.text(c.req.method + " " + c.req.path);
});

app.post("/ingest", async (c) => {
  const data = await c.req.text();

  const split = data.split("\n");
  const events = split.map((e) => JSON.parse(e));

  /**
   * Validate that the timestamp of the first log is within 5 minutes.
   * This helps prevent replay attacks
   */

  const maxAllowedTimestampSkew = parseInt(
    process.env.MAX_ALLOWED_TIMESTAMP_SKEW || "0"
  );

  if (maxAllowedTimestampSkew > 0) {
    const firstEvent = events[0];
    if (firstEvent.timestamp < Date.now() - maxAllowedTimestampSkew * 1000) {
      c.status(403);
      return c.text("Request expired");
    }
  }

  // Validate the webhook signature
  if (process.env.WEBHOOK_SECRET) {
    const signature = c.req.header("x-webhook-signature");
    if (!signature) {
      c.status(401);
      return c.text("Unauthorized");
    }

    const hmacSecret = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(process.env.WEBHOOK_SECRET),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["verify"]
    );
    const hashPayload = await c.req.arrayBuffer();

    const isValid = await crypto.subtle.verify(
      "HMAC",
      hmacSecret,
      // @ts-expect-error - this is valid in V8 now
      Uint8Array.fromHex(signature.replace("sha256=", "")),
      hashPayload
    );

    if (!isValid) {
      c.status(401);
      return c.text("Unauthorized");
    }
  }

  const functionExecutionEvents = events.filter(
    (e) => e.topic === "function_execution"
  );
  await ingestFunctionExecutionEvents(functionExecutionEvents);

  const consoleLogEvents = events.filter((e) => e.topic === "console");
  await ingestConsoleLogs(consoleLogEvents);

  return c.json({ message: "Event ingested" });
});

app.get("/health", (c) => {
  c.status(200);
  return c.text("OK");
});

async function initializeDatabase() {
  const client = createClient({
    url: process.env.CLICKHOUSE_URL,
    username: process.env.CLICKHOUSE_USERNAME || "default",
    password: process.env.CLICKHOUSE_PASSWORD || "",
  });

  try {
    const setupSQL = readFileSync(join(__dirname, "setup.sql"), "utf-8");
    const commands = setupSQL.split(";").filter((c) => c.trim() !== "");

    for (const command of commands) {
      await client.exec({ query: command });
    }

    console.log("Database setup completed successfully");
  } catch (error) {
    console.error("Failed to run setup.sql:", error);
    process.exit(1);
  }
}

initializeDatabase().then(() => {
  serve({
    fetch: app.fetch,
    port: Number(PORT),
  });

  console.log(`Ingest server webhook is live at /ingest`);
});
