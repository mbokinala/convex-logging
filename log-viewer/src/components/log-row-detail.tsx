"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ConsoleLogRow } from "@/lib/types";
import { format } from "date-fns";

export function LogRowDetail({ log }: { log: ConsoleLogRow }) {
  return (
    <div className="bg-muted/30 px-6 py-4 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <Field label="Deployment" value={log.deployment_name} />
        <Field label="Deployment Type" value={log.deployment_type} />
        <Field label="Project" value={log.project_name} />
        <Field label="Project Slug" value={log.project_slug} />
        <Field label="Function Path" value={log.function_path} mono />
        <Field label="Function Type" value={log.function_type} />
        <Field label="Request ID" value={log.request_id} mono />
        <Field label="Log Level" value={log.log_level} />
        <Field
          label="Cached"
          value={log.cached === null ? "N/A" : log.cached ? "Yes" : "No"}
        />
        <Field
          label="Truncated"
          value={log.is_truncated ? "Yes" : "No"}
        />
        {log.system_code && (
          <Field label="System Code" value={log.system_code} mono />
        )}
        <Field
          label="Received At"
          value={format(new Date(log.received_at), "yyyy-MM-dd HH:mm:ss.SSS")}
        />
      </div>
      <Separator />
      <div>
        <p className="text-xs text-muted-foreground mb-1">Full Message</p>
        <pre className="text-sm font-mono whitespace-pre-wrap break-words bg-muted/50 rounded p-3">
          {log.message}
        </pre>
      </div>
    </div>
  );
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
