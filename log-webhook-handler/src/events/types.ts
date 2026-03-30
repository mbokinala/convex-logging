export interface ConvexMetadata {
  deployment_name: string;
  deployment_type: string;
  project_name: string;
  project_slug: string;
}

export interface BaseEvent {
  topic: string;
  timestamp: number;
  convex: ConvexMetadata;
}

export interface VerificationEvent extends BaseEvent {
  topic: "verification";
  message: string;
}

export interface ConsoleEvent extends BaseEvent {
  topic: "console";
  function: {
    path: string;
    request_id: string;
    type: "query" | "mutation" | "action" | "http_action";
    cached?: boolean;
  };
  log_level: "DEBUG" | "INFO" | "LOG" | "WARN" | "ERROR";
  message: string;
  is_truncated: boolean;
  system_code?: string;
}

export interface FunctionExecutionEvent extends BaseEvent {
  topic: "function_execution";
  function: {
    path: string;
    request_id: string;
    type: "query" | "mutation" | "action" | "http_action";
    cached?: boolean;
  };
  execution_time_ms: number;
  status: "success" | "failure";
  error_message?: string;
  mutation_queue_length?: number;
  mutation_retry_count?: number;
  occ_info?: {
    table_name: string;
    document_id: string;
    write_source: string;
    retry_count: number;
  };
  scheduler_info?: {
    job_id: string;
  };
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

export interface AuditLogEvent extends BaseEvent {
  topic: "audit_log";
  audit_log_action: string;
  audit_log_metadata: string;
}

export interface ConcurrencyStatsEvent extends BaseEvent {
  topic: "concurrency_stats";
  query: { num_running: number; num_queued: number };
  mutation: { num_running: number; num_queued: number };
  action: { num_running: number; num_queued: number };
  node_action: { num_running: number; num_queued: number };
  http_action: { num_running: number; num_queued: number };
}

export interface SchedulerStatsEvent extends BaseEvent {
  topic: "scheduler_stats";
  lag_seconds: number;
  num_running_jobs: number;
}

export interface CurrentStorageUsageEvent extends BaseEvent {
  topic: "current_storage_usage";
  total_document_size_bytes: number;
  total_index_size_bytes: number;
  total_vector_storage_bytes: number;
  total_file_storage_bytes: number;
  total_backup_storage_bytes: number;
}

export interface StorageApiBandwidthEvent extends BaseEvent {
  topic: "storage_api_bandwidth";
  storage_id: string;
  egress_bytes: number;
}

export type ConvexEvent =
  | VerificationEvent
  | ConsoleEvent
  | FunctionExecutionEvent
  | AuditLogEvent
  | ConcurrencyStatsEvent
  | SchedulerStatsEvent
  | CurrentStorageUsageEvent
  | StorageApiBandwidthEvent;
