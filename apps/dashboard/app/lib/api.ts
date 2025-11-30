"use server";

import { createClient } from "@clickhouse/client";

const clickHouseClient = createClient({
  url: process.env.CLICKHOUSE_URL,
  username: process.env.CLICKHOUSE_USERNAME || "default",
  password: process.env.CLICKHOUSE_PASSWORD,
});

export async function getConvexFunctions(
  timeRange: "1m" | "1h" | "1d" | "all" | "custom" = "1h",
  customStart?: string,
  customEnd?: string
) {
  let whereClause: string;
  let bucketInterval: string;
  let bucketSeconds: number;
  const params: Record<string, string> = {};

  if (timeRange === "custom" && customStart && customEnd) {
    // Use custom date range
    const startDate = new Date(customStart).toISOString();
    const endDate = new Date(customEnd).toISOString();
    whereClause = "timestamp >= {startDate:DateTime64(3)} AND timestamp <= {endDate:DateTime64(3)}";
    params.startDate = startDate;
    params.endDate = endDate;

    // Calculate duration to determine bucket size
    const durationMs =
      new Date(customEnd).getTime() - new Date(customStart).getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    if (durationHours <= 1) {
      bucketInterval = "5 SECOND"; // 720 max points
      bucketSeconds = 5;
    } else if (durationHours <= 24) {
      bucketInterval = "1 MINUTE"; // 1440 max points
      bucketSeconds = 60;
    } else if (durationHours <= 168) {
      // 1 week
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

  const rows = await clickHouseClient.query({
    query: `SELECT
  function_type,
  toStartOfInterval(timestamp, INTERVAL ${bucketInterval}) AS time_bucket,
  COUNT(*) AS record_count
FROM function_execution
WHERE ${whereClause}
GROUP BY function_type, time_bucket
ORDER BY time_bucket;`,
    query_params: Object.keys(params).length > 0 ? params : undefined,
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
    aggregatedData.get(d.time_bucket)![d.function_type] +=
      parseInt(d.record_count) / bucketSeconds;
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
  const rows = await clickHouseClient.query({
    query:
      "SELECT DISTINCT function_path FROM function_execution ORDER BY function_path",
    format: "JSONEachRow",
  });

  const data: { function_path: string }[] = await rows.json();

  return data.map((d) => d.function_path);
}

export async function getFailureRate(
  timeRange: "1m" | "1h" | "1d" | "all" | "custom" = "1h",
  customStart?: string,
  customEnd?: string
) {
  let whereClause: string;
  let bucketInterval: string;
  const params: Record<string, string | string[]> = {};

  if (timeRange === "custom" && customStart && customEnd) {
    const startDate = new Date(customStart).toISOString();
    const endDate = new Date(customEnd).toISOString();
    whereClause = "timestamp >= {startDate:DateTime64(3)} AND timestamp <= {endDate:DateTime64(3)}";
    params.startDate = startDate;
    params.endDate = endDate;

    const durationMs =
      new Date(customEnd).getTime() - new Date(customStart).getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    if (durationHours <= 1) {
      bucketInterval = "5 SECOND";
    } else if (durationHours <= 24) {
      bucketInterval = "1 MINUTE";
    } else if (durationHours <= 168) {
      bucketInterval = "10 MINUTE";
    } else {
      bucketInterval = "1 HOUR";
    }
  } else if (timeRange === "all") {
    whereClause = "1 = 1";
    bucketInterval = "1 HOUR";
  } else {
    let intervalSeconds = 3600;
    if (timeRange === "1m") {
      intervalSeconds = 60;
      bucketInterval = "1 SECOND";
    } else if (timeRange === "1h") {
      intervalSeconds = 3600;
      bucketInterval = "5 SECOND";
    } else if (timeRange === "1d") {
      intervalSeconds = 86400;
      bucketInterval = "1 MINUTE";
    } else {
      bucketInterval = "5 SECOND";
    }
    whereClause = `timestamp >= now() - INTERVAL ${intervalSeconds} SECOND`;
  }

  // First, get functions that have at least one failure in the time period
  const functionsWithFailuresRows = await clickHouseClient.query({
    query: `SELECT DISTINCT function_path
FROM function_execution
WHERE ${whereClause} AND status = 'failure'
ORDER BY function_path;`,
    query_params: Object.keys(params).length > 0 ? params : undefined,
    format: "JSONEachRow",
  });

  const functionsWithFailures: { function_path: string }[] =
    await functionsWithFailuresRows.json();

  if (functionsWithFailures.length === 0) {
    return { data: [], functions: [], aggregates: [] };
  }

  // Add function paths to params for IN clause
  params.functionPaths = functionsWithFailures.map((f) => f.function_path);

  // Get failure rate data for those functions
  const rows = await clickHouseClient.query({
    query: `SELECT
  function_path,
  toStartOfInterval(timestamp, INTERVAL ${bucketInterval}) AS time_bucket,
  COUNT(*) AS total_count,
  SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) AS failure_count
FROM function_execution
WHERE ${whereClause}
  AND function_path IN {functionPaths:Array(String)}
GROUP BY function_path, time_bucket
ORDER BY time_bucket, function_path;`,
    query_params: params,
    format: "JSONEachRow",
  });

  const queryData: {
    function_path: string;
    time_bucket: string;
    total_count: string;
    failure_count: string;
  }[] = await rows.json();

  // Aggregate data by time bucket
  const aggregatedData: Map<string, { [functionPath: string]: number }> =
    new Map();

  for (const d of queryData) {
    if (!aggregatedData.has(d.time_bucket)) {
      aggregatedData.set(d.time_bucket, {});
    }
    const failureRate =
      parseInt(d.total_count) > 0
        ? (parseInt(d.failure_count) / parseInt(d.total_count)) * 100
        : 0;
    aggregatedData.get(d.time_bucket)![d.function_path] = failureRate;
  }

  const data = Array.from(aggregatedData.entries()).map(
    ([timestamp, functionData]) => ({
      date: new Date(timestamp).toISOString(),
      ...functionData,
    })
  );

  // Calculate aggregate failure rates across the entire period
  const aggregateRows = await clickHouseClient.query({
    query: `SELECT
  function_path,
  COUNT(*) AS total_count,
  SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) AS failure_count
FROM function_execution
WHERE ${whereClause}
  AND function_path IN {functionPaths:Array(String)}
GROUP BY function_path
ORDER BY function_path;`,
    query_params: params,
    format: "JSONEachRow",
  });

  const aggregateData: {
    function_path: string;
    total_count: string;
    failure_count: string;
  }[] = await aggregateRows.json();

  const aggregates = aggregateData.map((d) => ({
    functionPath: d.function_path,
    totalCount: parseInt(d.total_count),
    failureCount: parseInt(d.failure_count),
    failureRate:
      parseInt(d.total_count) > 0
        ? (parseInt(d.failure_count) / parseInt(d.total_count)) * 100
        : 0,
  }));

  return {
    data,
    functions: functionsWithFailures.map((f) => f.function_path),
    aggregates,
  };
}

export async function getExecutionTime(
  timeRange: "1m" | "1h" | "1d" | "all" | "custom" = "1h",
  customStart?: string,
  customEnd?: string
) {
  let whereClause: string;
  let bucketInterval: string;
  const params: Record<string, string> = {};

  if (timeRange === "custom" && customStart && customEnd) {
    const startDate = new Date(customStart).toISOString();
    const endDate = new Date(customEnd).toISOString();
    whereClause = "timestamp >= {startDate:DateTime64(3)} AND timestamp <= {endDate:DateTime64(3)}";
    params.startDate = startDate;
    params.endDate = endDate;

    const durationMs =
      new Date(customEnd).getTime() - new Date(customStart).getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    if (durationHours <= 1) {
      bucketInterval = "5 SECOND";
    } else if (durationHours <= 24) {
      bucketInterval = "1 MINUTE";
    } else if (durationHours <= 168) {
      bucketInterval = "10 MINUTE";
    } else {
      bucketInterval = "1 HOUR";
    }
  } else if (timeRange === "all") {
    whereClause = "1 = 1";
    bucketInterval = "1 HOUR";
  } else {
    let intervalSeconds = 3600;
    if (timeRange === "1m") {
      intervalSeconds = 60;
      bucketInterval = "1 SECOND";
    } else if (timeRange === "1h") {
      intervalSeconds = 3600;
      bucketInterval = "5 SECOND";
    } else if (timeRange === "1d") {
      intervalSeconds = 86400;
      bucketInterval = "1 MINUTE";
    } else {
      bucketInterval = "5 SECOND";
    }
    whereClause = `timestamp >= now() - INTERVAL ${intervalSeconds} SECOND`;
  }

  // Get execution time data for all functions
  const rows = await clickHouseClient.query({
    query: `SELECT
  function_path,
  toStartOfInterval(timestamp, INTERVAL ${bucketInterval}) AS time_bucket,
  AVG(execution_time_ms) AS avg_execution_time
FROM function_execution
WHERE ${whereClause}
GROUP BY function_path, time_bucket
ORDER BY time_bucket, function_path;`,
    query_params: Object.keys(params).length > 0 ? params : undefined,
    format: "JSONEachRow",
  });

  const queryData: {
    function_path: string;
    time_bucket: string;
    avg_execution_time: string;
  }[] = await rows.json();

  if (queryData.length === 0) {
    return { data: [], functions: [], aggregates: [] };
  }

  // Aggregate data by time bucket
  const aggregatedData: Map<string, { [functionPath: string]: number }> =
    new Map();

  const functionSet = new Set<string>();

  for (const d of queryData) {
    functionSet.add(d.function_path);
    if (!aggregatedData.has(d.time_bucket)) {
      aggregatedData.set(d.time_bucket, {});
    }
    aggregatedData.get(d.time_bucket)![d.function_path] = parseFloat(
      d.avg_execution_time
    );
  }

  const data = Array.from(aggregatedData.entries()).map(
    ([timestamp, functionData]) => ({
      date: new Date(timestamp).toISOString(),
      ...functionData,
    })
  );

  // Calculate aggregate execution times across the entire period
  const aggregateRows = await clickHouseClient.query({
    query: `SELECT
  function_path,
  AVG(execution_time_ms) AS avg_execution_time,
  COUNT(*) AS total_count
FROM function_execution
WHERE ${whereClause}
GROUP BY function_path
ORDER BY function_path;`,
    query_params: Object.keys(params).length > 0 ? params : undefined,
    format: "JSONEachRow",
  });

  const aggregateData: {
    function_path: string;
    avg_execution_time: string;
    total_count: string;
  }[] = await aggregateRows.json();

  const aggregates = aggregateData.map((d) => ({
    functionPath: d.function_path,
    avgExecutionTime: parseFloat(d.avg_execution_time),
    totalCount: parseInt(d.total_count),
  }));

  // Get top 10 slowest functions for the chart
  const topSlowFunctions = aggregates
    .sort((a, b) => b.avgExecutionTime - a.avgExecutionTime)
    .slice(0, 10)
    .map((a) => a.functionPath);

  // Filter chart data to only include top 10 slowest functions
  const filteredData = data.map((bucket) => {
    const filtered: { date: string; [key: string]: number | string } = {
      date: bucket.date,
    };
    for (const func of topSlowFunctions) {
      if ((bucket as Record<string, number | string>)[func] !== undefined) {
        filtered[func] = (bucket as Record<string, number | string>)[func];
      }
    }
    return filtered;
  });

  return {
    data: filteredData,
    functions: topSlowFunctions,
    aggregates,
  };
}

export async function getConsoleLogs(
  timeRange: "1m" | "1h" | "1d" | "all" | "custom" = "1h",
  customStart?: string,
  customEnd?: string,
  functionPath?: string,
  logLevel?: string,
  searchQuery?: string,
  limit: number = 1000
) {
  const whereClauses: string[] = [];
  const params: Record<string, string | number> = {};

  // Time range filter
  if (timeRange === "custom" && customStart && customEnd) {
    const startDate = new Date(customStart).toISOString();
    const endDate = new Date(customEnd).toISOString();
    whereClauses.push("timestamp >= {startDate:DateTime64(3)}");
    whereClauses.push("timestamp <= {endDate:DateTime64(3)}");
    params.startDate = startDate;
    params.endDate = endDate;
  } else if (timeRange !== "all") {
    let intervalSeconds = 3600;
    if (timeRange === "1m") {
      intervalSeconds = 60;
    } else if (timeRange === "1h") {
      intervalSeconds = 3600;
    } else if (timeRange === "1d") {
      intervalSeconds = 86400;
    }
    whereClauses.push(`timestamp >= now() - INTERVAL ${intervalSeconds} SECOND`);
  }

  // Add function filter if specified
  if (functionPath && functionPath !== "all") {
    whereClauses.push("function_path = {functionPath:String}");
    params.functionPath = functionPath;
  }

  // Add log level filter if specified
  if (logLevel && logLevel !== "all") {
    whereClauses.push("log_level = {logLevel:String}");
    params.logLevel = logLevel;
  }

  // Add search filter if specified
  if (searchQuery && searchQuery.trim() !== "") {
    whereClauses.push("positionCaseInsensitive(message, {searchQuery:String}) > 0");
    params.searchQuery = searchQuery.trim();
  }

  const whereClause = whereClauses.length > 0 ? whereClauses.join(" AND ") : "1 = 1";

  // Validate and sanitize limit
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 10000);

  const rows = await clickHouseClient.query({
    query: `SELECT
  function_type,
  function_path,
  function_cached,
  request_id,
  timestamp,
  log_level,
  message,
  is_truncated,
  system_code
FROM console_log
WHERE ${whereClause}
ORDER BY timestamp DESC
LIMIT {limit:UInt32}`,
    query_params: params.startDate || params.functionPath || params.logLevel || params.searchQuery ? {
      ...params,
      limit: safeLimit,
    } : { limit: safeLimit },
    format: "JSONEachRow",
  });

  const data: {
    function_type: string;
    function_path: string;
    function_cached: boolean;
    request_id: string;
    timestamp: string;
    log_level: string;
    message: string;
    is_truncated: boolean;
    system_code: string;
  }[] = await rows.json();

  return data.map((d) => ({
    ...d,
    timestamp: new Date(d.timestamp).toISOString(),
  }));
}
