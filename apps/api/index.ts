// server.ts
import { createClient } from "@clickhouse/client"; // or '@clickhouse/client-web'
import { type } from "arktype";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { FunctionExecutionEvent } from "@repo/types";

const client = createClient({
  url: "***REMOVED***",
  username: "default",
  password: "***REMOVED***",
});

const PORT = process.env.PORT || 3000;

const app = new Hono();

app.get("/", (c) => {
  return c.text(c.req.method + " " + c.req.path);
});

let events = 0;

app.post("/ingest", async (c) => {
  const data = await c.req.text();

  const split = data.split("\n");
  const events = split.map((e) => JSON.parse(e));

  const functionExecutionEvents = events.filter(
    (e) => e.topic === "function_execution"
  );

  const parsedFunctionExecutionEvents = functionExecutionEvents
    .map((e) => {
      const parsed = FunctionExecutionEvent(e);

      if (parsed instanceof type.errors) {
        console.log(parsed.summary);
        return null;
      } else {
        return parsed;
      }
    })
    .filter((e) => e !== null);

  console.log(
    functionExecutionEvents.length - parsedFunctionExecutionEvents.length,
    "events dropped"
  );

  await client.insert({
    table: "function_execution",
    values: parsedFunctionExecutionEvents.map((e) => {
      return {
        function_type: e.function.type,
        function_path: e.function.path,
        function_cached: e.function.cached,
        request_id: e.function.request_id,
        timestamp: Math.round(e.timestamp / 1000),
        status: e.status,
        error_message: e.error_message,
        mutation_queue_length: e.mutation_queue_length,
        mutation_retry_count: e.mutation_retry_count,
        scheduler_job_id: e.scheduler_info?.job_id ?? null,
        execution_time_ms: e.execution_time_ms,
      };
    }),
    format: "JSONEachRow",
  });

  console.log(parsedFunctionExecutionEvents.length, "events ingested");

  return c.json({ message: "Event ingested" });
});

app.get("/health", (c) => {
  c.status(200);
  return c.text("OK");
});

serve({
  fetch: app.fetch,
  port: Number(PORT),
});

console.log(`Server is running on http://localhost:${PORT}`);
