import { sql } from "./db";
import type { ConsoleLogRow, LogFilters, FilterOptions } from "./types";

export async function queryConsoleLogs(
  filters: LogFilters,
  page: number,
  pageSize: number
): Promise<{ logs: ConsoleLogRow[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const where = buildWhere(filters);

  const [rows, countResult] = await Promise.all([
    sql<ConsoleLogRow[]>`
      SELECT * FROM console
      ${where}
      ORDER BY timestamp DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `,
    sql<{ count: string }[]>`
      SELECT COUNT(*) as count FROM console
      ${where}
    `,
  ]);

  return {
    logs: rows,
    total: parseInt(countResult[0].count, 10),
  };
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const [deployments, funcTypes] = await Promise.all([
    sql<{ deployment_name: string }[]>`
      SELECT DISTINCT deployment_name FROM console ORDER BY deployment_name
    `,
    sql<{ function_type: string }[]>`
      SELECT DISTINCT function_type FROM console ORDER BY function_type
    `,
  ]);

  return {
    deploymentNames: deployments.map((r) => r.deployment_name),
    functionTypes: funcTypes.map((r) => r.function_type),
  };
}

function buildWhere(filters: LogFilters) {
  return sql`
    WHERE true
    ${filters.logLevels?.length ? sql`AND log_level = ANY(${filters.logLevels})` : sql``}
    ${filters.functionTypes?.length ? sql`AND function_type = ANY(${filters.functionTypes})` : sql``}
    ${filters.deploymentName ? sql`AND deployment_name = ${filters.deploymentName}` : sql``}
    ${filters.functionPath ? sql`AND function_path ILIKE ${"%" + filters.functionPath + "%"}` : sql``}
    ${filters.search ? sql`AND message ILIKE ${"%" + filters.search + "%"}` : sql``}
    ${filters.timeFrom ? sql`AND timestamp >= ${filters.timeFrom}` : sql``}
    ${filters.timeTo ? sql`AND timestamp <= ${filters.timeTo}` : sql``}
  `;
}
