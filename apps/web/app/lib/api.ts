"use server";

import { createClient } from "@clickhouse/client";

export async function getConvexFunctions(
  timeRange: "1m" | "1h" | "1d" | "all" | "custom" = "1h",
  customStart?: string,
  customEnd?: string
) {
  const client = createClient({
    url: "***REMOVED***",
    username: "default",
    password: "***REMOVED***",
  });

  let whereClause: string;
  let bucketInterval: string;
  let bucketSeconds: number;

  if (timeRange === "custom" && customStart && customEnd) {
    // Use custom date range
    const startDate = new Date(customStart).toISOString();
    const endDate = new Date(customEnd).toISOString();
    whereClause = `timestamp >= '${startDate}' AND timestamp <= '${endDate}'`;

    // Calculate duration to determine bucket size
    const durationMs = new Date(customEnd).getTime() - new Date(customStart).getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    if (durationHours <= 1) {
      bucketInterval = "5 SECOND"; // 720 max points
      bucketSeconds = 5;
    } else if (durationHours <= 24) {
      bucketInterval = "1 MINUTE"; // 1440 max points
      bucketSeconds = 60;
    } else if (durationHours <= 168) { // 1 week
      bucketInterval = "10 MINUTE"; // ~1000 max points
      bucketSeconds = 600;
    } else {
      bucketInterval = "1 HOUR"; // manageable for long periods
      bucketSeconds = 3600;
    }
  } else if (timeRange === "all") {
    // No time filter for all time
    whereClause = "1 = 1";
    bucketInterval = "1 HOUR"; // Aggregate to hourly for all-time view
    bucketSeconds = 3600;
  } else {
    // Calculate the time interval based on the selected range
    let intervalSeconds = 3600; // 1 hour default
    if (timeRange === "1m") {
      intervalSeconds = 60; // 1 minute
      bucketInterval = "1 SECOND"; // 60 points max
      bucketSeconds = 1;
    } else if (timeRange === "1h") {
      intervalSeconds = 3600; // 1 hour
      bucketInterval = "5 SECOND"; // 720 points max
      bucketSeconds = 5;
    } else if (timeRange === "1d") {
      intervalSeconds = 86400; // 1 day
      bucketInterval = "1 MINUTE"; // 1440 points max
      bucketSeconds = 60;
    } else {
      bucketInterval = "5 SECOND";
      bucketSeconds = 5;
    }
    whereClause = `timestamp >= now() - INTERVAL ${intervalSeconds} SECOND`;
  }

  const rows = await client.query({
    query: `SELECT
  function_type,
  toStartOfInterval(timestamp, INTERVAL ${bucketInterval}) AS time_bucket,
  COUNT(*) AS record_count
FROM function_execution
WHERE ${whereClause}
GROUP BY function_type, time_bucket
ORDER BY time_bucket;`,
    format: "JSONEachRow",
  });

  const data: {
    function_type: "query" | "mutation" | "action" | "http_action";
    time_bucket: string;
    record_count: string;
  }[] = await rows.json();

  const aggregatedData: Map<
    string,
    { query: number; mutation: number; action: number; http_action: number }
  > = new Map();

  for (const d of data) {
    if (!aggregatedData.has(d.time_bucket)) {
      aggregatedData.set(d.time_bucket, {
        query: 0,
        mutation: 0,
        action: 0,
        http_action: 0,
      });
    }
    // Divide by bucket size to get executions per second
    aggregatedData.get(d.time_bucket)![d.function_type] += parseInt(d.record_count) / bucketSeconds;
  }

  return Array.from(aggregatedData.entries()).map(([timestamp, data]) => {
    // ClickHouse returns datetime strings from toStartOfInterval
    // Parse the datetime string directly
    return {
      date: new Date(timestamp).toISOString(),
      ...data,
    };
  });
}

export async function getFunctionList() {
  const client = createClient({
    url: "***REMOVED***",
    username: "default",
    password: "***REMOVED***",
  });

  const rows = await client.query({
    query: "SELECT DISTINCT function_path FROM function_execution ORDER BY function_path",
    format: "JSONEachRow",
  });

  const data: { function_path: string }[] = await rows.json();

  return data.map((d) => d.function_path);
}
