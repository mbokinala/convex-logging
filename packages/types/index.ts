import { type } from "arktype";

export const BaseEvent = type({
  timestamp: "number",
  convex: {
    deployment_name: "string",
    deployment_type: "string",
    project_name: "string",
    project_slug: "string",
  },
});

export const Function = type({
  type: "'query' | 'mutation' | 'action' | 'http_action'",
  path: "string",
  "cached?": "boolean | null",
  request_id: "string",
});

export const VerificationEvent = BaseEvent.and({
  topic: "'verification'",
  message: "string",
});

export const ConsoleEvent = BaseEvent.and({
  topic: "'console'",
  function: Function,
  log_level: "'DEBUG' | 'INFO' | 'LOG' | 'WARN' | 'ERROR'",
  message: "string",
  is_truncated: "boolean",
  "system_code?": "string | null",
});

export const FunctionExecutionEvent = BaseEvent.and({
  topic: "'function_execution'",
  function: Function,
  execution_time_ms: "number",
  status: "'success' | 'failure'",
  "error_message?": "string | null",
  "mutation_queue_length?": "number",
  "mutation_retry_count?": "number",
  "scheduler_info?": type({
    job_id: "string",
  }).or("null"),
  usage: type({
    database_read_bytes: "number",
    database_write_bytes: "number",
    database_read_documents: "number",
    file_storage_read_bytes: "number",
    file_storage_write_bytes: "number",
    vector_storage_read_bytes: "number",
    vector_storage_write_bytes: "number",
    memory_used_mb: "number",
  }),
});

export const ConvexEvent = type.or(
  VerificationEvent,
  ConsoleEvent,
  FunctionExecutionEvent
);

// Export inferred types
export type BaseEvent = typeof BaseEvent.infer;
export type Function = typeof Function.infer;
export type VerificationEvent = typeof VerificationEvent.infer;
export type ConsoleEvent = typeof ConsoleEvent.infer;
export type FunctionExecutionEvent = typeof FunctionExecutionEvent.infer;
export type ConvexEvent = typeof ConvexEvent.infer;
