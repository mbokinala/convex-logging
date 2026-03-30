import postgres from "postgres";
import type { EventStorage } from "../interface";
import type {
  ConvexEvent,
  VerificationEvent,
  ConsoleEvent,
  FunctionExecutionEvent,
  AuditLogEvent,
  ConcurrencyStatsEvent,
  SchedulerStatsEvent,
  CurrentStorageUsageEvent,
  StorageApiBandwidthEvent,
} from "../../events/types";

function commonFields(e: ConvexEvent) {
  return {
    timestamp: new Date(e.timestamp),
    deployment_name: e.convex.deployment_name,
    deployment_type: e.convex.deployment_type,
    project_name: e.convex.project_name,
    project_slug: e.convex.project_slug,
  };
}

export class PostgresEventStorage implements EventStorage {
  private sql: postgres.Sql;

  constructor(databaseUrl: string) {
    this.sql = postgres(databaseUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  async storeBatch(events: ConvexEvent[]): Promise<void> {
    if (events.length === 0) return;

    const byTopic = new Map<string, ConvexEvent[]>();
    for (const event of events) {
      const list = byTopic.get(event.topic) ?? [];
      list.push(event);
      byTopic.set(event.topic, list);
    }

    await this.sql.begin(async (_tx) => {
      // TransactionSql extends Omit<Sql, ...> which strips call signatures in TS.
      // The runtime object supports the same tagged template API as Sql.
      const tx = _tx as unknown as postgres.Sql;
      for (const [topic, topicEvents] of byTopic) {
        switch (topic) {
          case "verification":
            await this.insertVerification(tx, topicEvents as VerificationEvent[]);
            break;
          case "console":
            await this.insertConsole(tx, topicEvents as ConsoleEvent[]);
            break;
          case "function_execution":
            await this.insertFunctionExecution(tx, topicEvents as FunctionExecutionEvent[]);
            break;
          case "audit_log":
            await this.insertAuditLog(tx, topicEvents as AuditLogEvent[]);
            break;
          case "concurrency_stats":
            await this.insertConcurrencyStats(tx, topicEvents as ConcurrencyStatsEvent[]);
            break;
          case "scheduler_stats":
            await this.insertSchedulerStats(tx, topicEvents as SchedulerStatsEvent[]);
            break;
          case "current_storage_usage":
            await this.insertCurrentStorageUsage(tx, topicEvents as CurrentStorageUsageEvent[]);
            break;
          case "storage_api_bandwidth":
            await this.insertStorageApiBandwidth(tx, topicEvents as StorageApiBandwidthEvent[]);
            break;
          default:
            console.warn(`Unknown topic encountered in storage: ${topic}, skipping ${topicEvents.length} event(s)`);
            break;
        }
      }
    });
  }

  private async insertVerification(tx: postgres.Sql, events: VerificationEvent[]) {
    await tx`
      INSERT INTO verification ${tx(
        events.map((e) => ({
          ...commonFields(e),
          message: e.message,
        }))
      )}
    `;
  }

  private async insertConsole(tx: postgres.Sql, events: ConsoleEvent[]) {
    await tx`
      INSERT INTO console ${tx(
        events.map((e) => ({
          ...commonFields(e),
          function_path: e.function.path,
          request_id: e.function.request_id,
          function_type: e.function.type,
          cached: e.function.cached ?? null,
          log_level: e.log_level,
          message: e.message,
          is_truncated: e.is_truncated,
          system_code: e.system_code ?? null,
        }))
      )}
    `;
  }

  private async insertFunctionExecution(
    tx: postgres.Sql,
    events: FunctionExecutionEvent[]
  ) {
    await tx`
      INSERT INTO function_execution ${tx(
        events.map((e) => ({
          ...commonFields(e),
          function_path: e.function.path,
          request_id: e.function.request_id,
          function_type: e.function.type,
          cached: e.function.cached ?? null,
          execution_time_ms: e.execution_time_ms,
          status: e.status,
          error_message: e.error_message ?? null,
          mutation_queue_length: e.mutation_queue_length ?? null,
          mutation_retry_count: e.mutation_retry_count ?? null,
          occ_info: e.occ_info ? JSON.stringify(e.occ_info) : null,
          scheduler_info: e.scheduler_info ? JSON.stringify(e.scheduler_info) : null,
          usage: JSON.stringify(e.usage),
        }))
      )}
    `;
  }

  private async insertAuditLog(tx: postgres.Sql, events: AuditLogEvent[]) {
    await tx`
      INSERT INTO audit_log ${tx(
        events.map((e) => ({
          ...commonFields(e),
          audit_log_action: e.audit_log_action,
          audit_log_metadata: e.audit_log_metadata,
        }))
      )}
    `;
  }

  private async insertConcurrencyStats(
    tx: postgres.Sql,
    events: ConcurrencyStatsEvent[]
  ) {
    await tx`
      INSERT INTO concurrency_stats ${tx(
        events.map((e) => ({
          ...commonFields(e),
          query_num_running: e.query.num_running,
          query_num_queued: e.query.num_queued,
          mutation_num_running: e.mutation.num_running,
          mutation_num_queued: e.mutation.num_queued,
          action_num_running: e.action.num_running,
          action_num_queued: e.action.num_queued,
          node_action_num_running: e.node_action.num_running,
          node_action_num_queued: e.node_action.num_queued,
          http_action_num_running: e.http_action.num_running,
          http_action_num_queued: e.http_action.num_queued,
        }))
      )}
    `;
  }

  private async insertSchedulerStats(
    tx: postgres.Sql,
    events: SchedulerStatsEvent[]
  ) {
    await tx`
      INSERT INTO scheduler_stats ${tx(
        events.map((e) => ({
          ...commonFields(e),
          lag_seconds: e.lag_seconds,
          num_running_jobs: e.num_running_jobs,
        }))
      )}
    `;
  }

  private async insertCurrentStorageUsage(
    tx: postgres.Sql,
    events: CurrentStorageUsageEvent[]
  ) {
    await tx`
      INSERT INTO current_storage_usage ${tx(
        events.map((e) => ({
          ...commonFields(e),
          total_document_size_bytes: e.total_document_size_bytes,
          total_index_size_bytes: e.total_index_size_bytes,
          total_vector_storage_bytes: e.total_vector_storage_bytes,
          total_file_storage_bytes: e.total_file_storage_bytes,
          total_backup_storage_bytes: e.total_backup_storage_bytes,
        }))
      )}
    `;
  }

  private async insertStorageApiBandwidth(
    tx: postgres.Sql,
    events: StorageApiBandwidthEvent[]
  ) {
    await tx`
      INSERT INTO storage_api_bandwidth ${tx(
        events.map((e) => ({
          ...commonFields(e),
          storage_id: e.storage_id,
          egress_bytes: e.egress_bytes,
        }))
      )}
    `;
  }

  async close(): Promise<void> {
    await this.sql.end();
  }
}
