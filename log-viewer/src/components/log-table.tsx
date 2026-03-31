"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ConsoleLogRow } from "@/lib/types";
import { LogRowDetail } from "./log-row-detail";
import { format } from "date-fns";

const levelStyles: Record<string, string> = {
  DEBUG: "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20",
  INFO: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
  LOG: "bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20",
  WARN: "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20",
  ERROR: "bg-red-500/10 text-red-400 hover:bg-red-500/20",
};

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

export function LogTable({ logs }: { logs: ConsoleLogRow[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No logs found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px]">Timestamp</TableHead>
          <TableHead className="w-[80px]">Level</TableHead>
          <TableHead className="w-[200px]">Function</TableHead>
          <TableHead className="w-[100px]">Type</TableHead>
          <TableHead>Message</TableHead>
          <TableHead className="w-[120px]">Request ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <>
            <TableRow
              key={log.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() =>
                setExpandedId(expandedId === log.id ? null : log.id)
              }
            >
              <TableCell className="font-mono text-xs whitespace-nowrap">
                {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss.SSS")}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={levelStyles[log.log_level] ?? ""}
                >
                  {log.log_level}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {truncate(log.function_path, 40)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {log.function_type}
                </Badge>
              </TableCell>
              <TableCell className="text-sm max-w-md truncate">
                {truncate(log.message, 120)}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {truncate(log.request_id, 12)}
              </TableCell>
            </TableRow>
            {expandedId === log.id && (
              <TableRow key={`${log.id}-detail`}>
                <TableCell colSpan={6} className="p-0">
                  <LogRowDetail log={log} />
                </TableCell>
              </TableRow>
            )}
          </>
        ))}
      </TableBody>
    </Table>
  );
}
