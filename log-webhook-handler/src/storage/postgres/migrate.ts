import type postgres from "postgres";

const COMMON_COLUMNS = `
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  timestamp       TIMESTAMPTZ NOT NULL,
  deployment_name TEXT NOT NULL,
  deployment_type TEXT NOT NULL,
  project_name    TEXT NOT NULL,
  project_slug    TEXT NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
`;

const TABLES_SQL = `
CREATE TABLE IF NOT EXISTS verification (
  ${COMMON_COLUMNS},
  message TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_verification_timestamp ON verification (timestamp);
CREATE INDEX IF NOT EXISTS idx_verification_deployment ON verification (deployment_name);

CREATE TABLE IF NOT EXISTS console (
  ${COMMON_COLUMNS},
  function_path TEXT NOT NULL,
  request_id    TEXT NOT NULL,
  function_type TEXT NOT NULL,
  cached        BOOLEAN,
  log_level     TEXT NOT NULL,
  message       TEXT NOT NULL,
  is_truncated  BOOLEAN NOT NULL,
  system_code   TEXT
);
CREATE INDEX IF NOT EXISTS idx_console_timestamp ON console (timestamp);
CREATE INDEX IF NOT EXISTS idx_console_deployment ON console (deployment_name);
CREATE INDEX IF NOT EXISTS idx_console_request_id ON console (request_id);
CREATE INDEX IF NOT EXISTS idx_console_log_level ON console (log_level);

CREATE TABLE IF NOT EXISTS function_execution (
  ${COMMON_COLUMNS},
  function_path          TEXT NOT NULL,
  request_id             TEXT NOT NULL,
  function_type          TEXT NOT NULL,
  cached                 BOOLEAN,
  execution_time_ms      DOUBLE PRECISION NOT NULL,
  status                 TEXT NOT NULL,
  error_message          TEXT,
  mutation_queue_length  INTEGER,
  mutation_retry_count   INTEGER,
  occ_info               JSONB,
  scheduler_info         JSONB,
  usage                  JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_func_exec_timestamp ON function_execution (timestamp);
CREATE INDEX IF NOT EXISTS idx_func_exec_deployment ON function_execution (deployment_name);
CREATE INDEX IF NOT EXISTS idx_func_exec_request_id ON function_execution (request_id);
CREATE INDEX IF NOT EXISTS idx_func_exec_status ON function_execution (status);

CREATE TABLE IF NOT EXISTS audit_log (
  ${COMMON_COLUMNS},
  audit_log_action   TEXT NOT NULL,
  audit_log_metadata JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log (timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_deployment ON audit_log (deployment_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log (audit_log_action);

CREATE TABLE IF NOT EXISTS concurrency_stats (
  ${COMMON_COLUMNS},
  query_num_running       INTEGER NOT NULL,
  query_num_queued        INTEGER NOT NULL,
  mutation_num_running    INTEGER NOT NULL,
  mutation_num_queued     INTEGER NOT NULL,
  action_num_running      INTEGER NOT NULL,
  action_num_queued       INTEGER NOT NULL,
  node_action_num_running INTEGER NOT NULL,
  node_action_num_queued  INTEGER NOT NULL,
  http_action_num_running INTEGER NOT NULL,
  http_action_num_queued  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_concurrency_stats_timestamp ON concurrency_stats (timestamp);
CREATE INDEX IF NOT EXISTS idx_concurrency_stats_deployment ON concurrency_stats (deployment_name);

CREATE TABLE IF NOT EXISTS scheduler_stats (
  ${COMMON_COLUMNS},
  lag_seconds      DOUBLE PRECISION NOT NULL,
  num_running_jobs INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scheduler_stats_timestamp ON scheduler_stats (timestamp);
CREATE INDEX IF NOT EXISTS idx_scheduler_stats_deployment ON scheduler_stats (deployment_name);

CREATE TABLE IF NOT EXISTS current_storage_usage (
  ${COMMON_COLUMNS},
  total_document_size_bytes  BIGINT NOT NULL,
  total_index_size_bytes     BIGINT NOT NULL,
  total_vector_storage_bytes BIGINT NOT NULL,
  total_file_storage_bytes   BIGINT NOT NULL,
  total_backup_storage_bytes BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_storage_usage_timestamp ON current_storage_usage (timestamp);
CREATE INDEX IF NOT EXISTS idx_storage_usage_deployment ON current_storage_usage (deployment_name);

CREATE TABLE IF NOT EXISTS storage_api_bandwidth (
  ${COMMON_COLUMNS},
  storage_id   TEXT NOT NULL,
  egress_bytes BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_storage_bandwidth_timestamp ON storage_api_bandwidth (timestamp);
CREATE INDEX IF NOT EXISTS idx_storage_bandwidth_deployment ON storage_api_bandwidth (deployment_name);
`;

export async function runMigrations(sql: postgres.Sql): Promise<void> {
  await sql.unsafe(TABLES_SQL);
}
