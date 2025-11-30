import { createClient } from "@clickhouse/client"; // or '@clickhouse/client-web'
import { FunctionExecutionEvent } from "@repo/types";
import { type } from "arktype";

const client = createClient({
  url: process.env.CLICKHOUSE_URL,
  username: process.env.CLICKHOUSE_USERNAME || "default",
  password: process.env.CLICKHOUSE_PASSWORD || "",
});

export async function ingestFunctionExecutionEvents(events: any[]) {
  const parsedFunctionExecutionEvents = events
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
    events.length - parsedFunctionExecutionEvents.length,
    "function execution events dropped"
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
}
