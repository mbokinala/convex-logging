"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { LogEntry } from "@/lib/types";
import { format } from "date-fns";
import { unquote } from "./log-table";

interface LogRowDetailProps {
  log: LogEntry;
  onClose: () => void;
}

export function LogRowDetail({ log, onClose }: LogRowDetailProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h3 className="text-sm font-medium">
          {log.kind === "console" ? "Log Details" : "Function Execution"}
        </h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
        {/* Common fields */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Deployment" value={log.deployment_name} />
          <Field label="Deployment Type" value={log.deployment_type} />
          <Field label="Project" value={log.project_name} />
          <Field label="Project Slug" value={log.project_slug} />
          <Field label="Function Path" value={log.function_path} mono />
          <Field label="Function Type" value={log.function_type} />
          <Field label="Request ID" value={log.request_id} mono />
          <Field
            label="Cached"
            value={log.cached === null ? "N/A" : log.cached ? "Yes" : "No"}
          />
          <Field
            label="Received At"
            value={format(new Date(log.received_at), "yyyy-MM-dd HH:mm:ss.SSS")}
          />
        </div>

        <Separator />

        {log.kind === "console" ? (
          <ConsoleDetail log={log} />
        ) : (
          <FunctionExecutionDetail log={log} />
        )}
      </div>
    </div>
  );
}

function ConsoleDetail({ log }: { log: Extract<LogEntry, { kind: "console" }> }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <Field label="Log Level" value={log.log_level} />
        <Field
          label="Truncated"
          value={log.is_truncated ? "Yes" : "No"}
        />
        {log.system_code && (
          <Field label="System Code" value={log.system_code} mono />
        )}
      </div>
      <Separator />
      <div>
        <p className="text-xs text-muted-foreground mb-1">Full Message</p>
        <pre className="text-sm font-mono whitespace-pre-wrap break-words bg-muted/50 rounded p-3">
          {unquote(log.message)}
        </pre>
      </div>
    </>
  );
}

function FunctionExecutionDetail({
  log,
}: {
  log: Extract<LogEntry, { kind: "function_execution" }>;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <Badge
            variant="secondary"
            className={
              log.status === "success"
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }
          >
            {log.status}
          </Badge>
        </div>
        <Field label="Execution Time" value={`${log.execution_time_ms}ms`} />
        {log.error_message && (
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Error</p>
            <pre className="text-sm font-mono whitespace-pre-wrap break-words bg-red-500/10 text-red-400 rounded p-3">
              {log.error_message}
            </pre>
          </div>
        )}
      </div>
      <Separator />
      <div>
        <p className="text-xs text-muted-foreground mb-2">Usage</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="DB Read Bytes" value={formatBytes(log.usage.database_read_bytes)} />
          <Field label="DB Write Bytes" value={formatBytes(log.usage.database_write_bytes)} />
          <Field label="DB Read Docs" value={String(log.usage.database_read_documents)} />
          <Field label="File Read" value={formatBytes(log.usage.file_storage_read_bytes)} />
          <Field label="File Write" value={formatBytes(log.usage.file_storage_write_bytes)} />
          <Field label="Vector Read" value={formatBytes(log.usage.vector_storage_read_bytes)} />
          <Field label="Vector Write" value={formatBytes(log.usage.vector_storage_write_bytes)} />
          <Field label="Memory" value={`${log.usage.memory_used_mb} MB`} />
        </div>
      </div>
    </>
  );
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm ${mono ? "font-mono" : ""} break-all`}>{value}</p>
    </div>
  );
}
