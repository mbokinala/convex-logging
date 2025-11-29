CREATE TABLE IF NOT EXISTS default.function_execution
(
    `function_type` String,
    `function_path` String,
    `function_cached` Bool DEFAULT 'FALSE',
    `request_id` String,
    `timestamp` DateTime,
    `status` String,
    `error_message` Nullable(String),
    `mutation_queue_length` Nullable(Int32),
    `mutation_retry_count` Nullable(Int32),
    `scheduler_job_id` Nullable(String),
    `execution_time_ms` Int32
)
ENGINE = MergeTree
ORDER BY (function_path, timestamp, status)
SETTINGS index_granularity = 8192