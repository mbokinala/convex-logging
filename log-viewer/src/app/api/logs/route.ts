import { type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { queryConsoleLogs } from "@/lib/queries";
import { validateSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import type { LogFilters } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token || !validateSessionToken(token)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const params = request.nextUrl.searchParams;

  const filters: LogFilters = {};

  const logLevel = params.get("logLevel");
  if (logLevel) filters.logLevels = logLevel.split(",");

  const functionType = params.get("functionType");
  if (functionType) filters.functionTypes = functionType.split(",");

  const deploymentName = params.get("deploymentName");
  if (deploymentName) filters.deploymentName = deploymentName;

  const functionPath = params.get("functionPath");
  if (functionPath) filters.functionPath = functionPath;

  const search = params.get("search");
  if (search) filters.search = search;

  const timeFrom = params.get("timeFrom");
  if (timeFrom) filters.timeFrom = timeFrom;

  const timeTo = params.get("timeTo");
  if (timeTo) filters.timeTo = timeTo;

  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(params.get("pageSize") ?? "50", 10)));

  try {
    const { logs, total } = await queryConsoleLogs(filters, page, pageSize);
    return Response.json({ logs, total, page, pageSize });
  } catch (error) {
    console.error("Failed to query logs:", error);
    return Response.json({ error: "Failed to query logs" }, { status: 500 });
  }
}
