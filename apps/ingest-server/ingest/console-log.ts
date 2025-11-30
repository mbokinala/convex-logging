import { createClient } from "@clickhouse/client";
import { ConsoleEvent } from "@repo/types";
import { type } from "arktype";

const client = createClient({
  url: process.env.CLICKHOUSE_URL,
  username: process.env.CLICKHOUSE_USERNAME || "default",
  password: process.env.CLICKHOUSE_PASSWORD || "",
});

export async function ingestConsoleLogs(events: any[]) {
  const parsedConsoleLogEvents = events
    .map((e) => {
      const parsed = ConsoleEvent(e);

      if (parsed instanceof type.errors) {
        console.log(parsed.summary);
        return null;
      } else {
        return parsed;
      }
    })
    .filter((e) => e !== null);

  console.log(
    events.length - parsedConsoleLogEvents.length,
    "console log events dropped"
  );

  await client.insert({
    table: "console_log",
    values: parsedConsoleLogEvents.map((e) => {
      return {
        function_type: e.function.type,
        function_path: e.function.path,
        function_cached: e.function.cached,
        request_id: e.function.request_id,
        timestamp: e.timestamp,
        log_level: e.log_level,
        message: e.message,
        is_truncated: e.is_truncated,
        system_code: e.system_code,
      };
    }),
    format: "JSONEachRow",
  });

  console.log(parsedConsoleLogEvents.length, "events ingested");
}
