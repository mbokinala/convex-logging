export interface ConsoleLogRow {
  id: number;
  timestamp: string;
  deployment_name: string;
  deployment_type: string;
  project_name: string;
  project_slug: string;
  received_at: string;
  function_path: string;
  request_id: string;
  function_type: string;
  cached: boolean | null;
  log_level: string;
  message: string;
  is_truncated: boolean;
  system_code: string | null;
}

export interface LogFilters {
  logLevels?: string[];
  functionTypes?: string[];
  deploymentName?: string;
  functionPath?: string;
  search?: string;
  timeFrom?: string;
  timeTo?: string;
}

export interface LogsResponse {
  logs: ConsoleLogRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FilterOptions {
  deploymentNames: string[];
  functionTypes: string[];
}
