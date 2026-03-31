export interface ConsoleLogRow {
  kind: "console";
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

export interface FunctionExecutionRow {
  kind: "function_execution";
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
  execution_time_ms: number;
  status: string;
  error_message: string | null;
  usage: {
    database_read_bytes: number;
    database_write_bytes: number;
    database_read_documents: number;
    file_storage_read_bytes: number;
    file_storage_write_bytes: number;
    vector_storage_read_bytes: number;
    vector_storage_write_bytes: number;
    memory_used_mb: number;
  };
}

export type LogEntry = ConsoleLogRow | FunctionExecutionRow;

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
  logs: LogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FilterOptions {
  deploymentNames: string[];
  functionTypes: string[];
}
