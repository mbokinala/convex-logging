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
SETTINGS index_granularity = 8192;

CREATE TABLE IF NOT EXISTS default.console_log
(
    `function_type` String,
    `function_path` String,
    function_cached Bool DEFAULT 'FALSE',
    `request_id` String,
    `timestamp` DateTime,
    `log_level` String,
    `message` String,
    `is_truncated` Bool DEFAULT 'FALSE',
    `system_code` String,

    INDEX idx_message(message) TYPE text(
        tokenizer = splitByNonAlpha
    ) GRANULARITY 64
)
ENGINE = MergeTree
ORDER BY (function_path, timestamp, log_level)
SETTINGS allow_experimental_full_text_index = 1;