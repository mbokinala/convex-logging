import { sql } from "./db";
import type {
  ConsoleLogRow,
  FunctionExecutionRow,
  LogEntry,
  LogFilters,
  FilterOptions,
} from "./types";

export async function queryLogs(
  filters: LogFilters,
  page: number,
  pageSize: number
): Promise<{ logs: LogEntry[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const consoleWhere = buildConsoleWhere(filters);
  const funcExecWhere = buildFuncExecWhere(filters);

  const [rows, countResult] = await Promise.all([
    sql`
      SELECT * FROM (
        SELECT
          'console' as kind,
          id, timestamp, deployment_name, deployment_type,
          project_name, project_slug, received_at,
          function_path, request_id, function_type, cached,
          log_level, message, is_truncated, system_code,
          NULL::double precision as execution_time_ms,
          NULL::text as status,
          NULL::text as error_message,
          NULL::jsonb as usage
        FROM console
        ${consoleWhere}

        UNION ALL

        SELECT
          'function_execution' as kind,
          id, timestamp, deployment_name, deployment_type,
          project_name, project_slug, received_at,
          function_path, request_id, function_type, cached,
          NULL::text as log_level,
          NULL::text as message,
          NULL::boolean as is_truncated,
          NULL::text as system_code,
          execution_time_ms,
          status,
          error_message,
          usage
        FROM function_execution
        ${funcExecWhere}
      ) combined
      ORDER BY timestamp DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `,
    sql<{ count: string }[]>`
      SELECT (
        (SELECT COUNT(*) FROM console ${consoleWhere}) +
        (SELECT COUNT(*) FROM function_execution ${funcExecWhere})
      )::text as count
    `,
  ]);

  const logs: LogEntry[] = rows.map((row: Record<string, unknown>) => {
    if (row.kind === "console") {
      return {
        kind: "console" as const,
        id: row.id as number,
        timestamp: row.timestamp as string,
        deployment_name: row.deployment_name as string,
        deployment_type: row.deployment_type as string,
        project_name: row.project_name as string,
        project_slug: row.project_slug as string,
        received_at: row.received_at as string,
        function_path: row.function_path as string,
        request_id: row.request_id as string,
        function_type: row.function_type as string,
        cached: row.cached as boolean | null,
        log_level: row.log_level as string,
        message: row.message as string,
        is_truncated: row.is_truncated as boolean,
        system_code: row.system_code as string | null,
      } satisfies ConsoleLogRow;
    } else {
      return {
        kind: "function_execution" as const,
        id: row.id as number,
        timestamp: row.timestamp as string,
        deployment_name: row.deployment_name as string,
        deployment_type: row.deployment_type as string,
        project_name: row.project_name as string,
        project_slug: row.project_slug as string,
        received_at: row.received_at as string,
        function_path: row.function_path as string,
        request_id: row.request_id as string,
        function_type: row.function_type as string,
        cached: row.cached as boolean | null,
        execution_time_ms: row.execution_time_ms as number,
        status: row.status as string,
        error_message: row.error_message as string | null,
        usage: row.usage as FunctionExecutionRow["usage"],
      } satisfies FunctionExecutionRow;
    }
  });

  return {
    logs,
    total: parseInt(countResult[0].count, 10),
  };
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const [deployments, funcTypes] = await Promise.all([
    sql<{ deployment_name: string }[]>`
      SELECT DISTINCT deployment_name FROM (
        SELECT deployment_name FROM console
        UNION
        SELECT deployment_name FROM function_execution
      ) d ORDER BY deployment_name
    `,
    sql<{ function_type: string }[]>`
      SELECT DISTINCT function_type FROM (
        SELECT function_type FROM console
        UNION
        SELECT function_type FROM function_execution
      ) t ORDER BY function_type
    `,
  ]);

  return {
    deploymentNames: deployments.map((r) => r.deployment_name),
    functionTypes: funcTypes.map((r) => r.function_type),
  };
}

function buildCommonWhere(filters: LogFilters) {
  return sql`
    WHERE true
    ${filters.functionTypes?.length ? sql`AND function_type = ANY(${filters.functionTypes})` : sql``}
    ${filters.deploymentName ? sql`AND deployment_name = ${filters.deploymentName}` : sql``}
    ${filters.functionPath ? sql`AND function_path ILIKE ${"%" + filters.functionPath + "%"}` : sql``}
    ${filters.timeFrom ? sql`AND timestamp >= ${filters.timeFrom}` : sql``}
    ${filters.timeTo ? sql`AND timestamp <= ${filters.timeTo}` : sql``}
  `;
}

function buildConsoleWhere(filters: LogFilters) {
  return sql`
    ${buildCommonWhere(filters)}
    ${filters.logLevels?.length ? sql`AND log_level = ANY(${filters.logLevels})` : sql``}
    ${filters.search ? sql`AND message ILIKE ${"%" + filters.search + "%"}` : sql``}
  `;
}

function buildFuncExecWhere(filters: LogFilters) {
  // If log level filters are active, exclude function executions since they don't have log levels
  if (filters.logLevels?.length) {
    return sql`WHERE false`;
  }
  return sql`
    ${buildCommonWhere(filters)}
    ${filters.search ? sql`AND (function_path ILIKE ${"%" + filters.search + "%"} OR error_message ILIKE ${"%" + filters.search + "%"})` : sql``}
  `;
}
