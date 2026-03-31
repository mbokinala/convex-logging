"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { LogEntry } from "@/lib/types";
import { format } from "date-fns";

const levelStyles: Record<string, string> = {
  DEBUG: "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20",
  INFO: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
  LOG: "bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20",
  WARN: "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20",
  ERROR: "bg-red-500/10 text-red-400 hover:bg-red-500/20",
};

const statusStyles: Record<string, string> = {
  success: "text-green-500",
  failure: "text-red-500",
};

const functionTypeShort: Record<string, string> = {
  query: "Q",
  mutation: "M",
  action: "A",
  http_action: "H",
};

export function unquote(str: string) {
  if (str.length >= 2 && str.startsWith('"') && str.endsWith('"')) {
    return str.slice(1, -1);
  }
  return str;
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Stable unique key: IDs can collide across tables, so prefix with kind. */
function entryKey(entry: LogEntry) {
  return `${entry.kind}-${entry.id}`;
}

interface LogTableProps {
  logs: LogEntry[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  loadingMore: boolean;
  hasMore: boolean;
  total: number;
}

export function LogTable({ logs, selectedKey, onSelect, sentinelRef, loadingMore, hasMore, total }: LogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No logs found
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead className="w-[180px] pl-6">Timestamp</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            <TableHead className="w-[200px]">Function</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="w-[120px] pr-6">Request ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((entry) => {
            const key = entryKey(entry);
            return (
              <TableRow
                key={key}
                className={`cursor-pointer hover:bg-muted/50 ${selectedKey === key ? "bg-muted/50" : ""}`}
                onClick={() => onSelect(selectedKey === key ? null : key)}
              >
                <TableCell className="font-mono text-xs whitespace-nowrap pl-6">
                  {format(new Date(entry.timestamp), "yyyy-MM-dd HH:mm:ss.SSS")}
                </TableCell>

                {/* Status column */}
                {entry.kind === "console" ? (
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={levelStyles[entry.log_level] ?? ""}
                    >
                      {entry.log_level}
                    </Badge>
                  </TableCell>
                ) : (
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    <span className={statusStyles[entry.status] ?? ""}>
                      {entry.status}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {formatDuration(entry.execution_time_ms)}
                    </span>
                  </TableCell>
                )}

                {/* Function column */}
                <TableCell className="font-mono text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs px-1.5 py-0 font-semibold">
                      {functionTypeShort[entry.function_type] ?? entry.function_type}
                    </Badge>
                    {truncate(entry.function_path, 35)}
                  </span>
                </TableCell>

                {/* Message column */}
                <TableCell className="font-mono text-sm max-w-md truncate">
                  {entry.kind === "console"
                    ? truncate(unquote(entry.message), 120)
                    : entry.error_message
                      ? <span className="text-red-400">{truncate(entry.error_message, 120)}</span>
                      : <span className="text-muted-foreground">--</span>}
                </TableCell>

                <TableCell className="font-mono text-xs text-muted-foreground pr-6">
                  {truncate(entry.request_id, 12)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {/* Scroll sentinel + status */}
      <div ref={sentinelRef} className="flex items-center justify-center py-4 text-sm text-muted-foreground">
        {loadingMore ? (
          "Loading more..."
        ) : hasMore ? (
          `${logs.length.toLocaleString()} of ${total.toLocaleString()} logs loaded`
        ) : (
          `All ${total.toLocaleString()} logs loaded`
        )}
      </div>
    </div>
  );
}
