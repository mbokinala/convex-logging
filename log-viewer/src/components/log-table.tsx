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
import type { ConsoleLogRow } from "@/lib/types";
import { format } from "date-fns";

const levelStyles: Record<string, string> = {
  DEBUG: "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20",
  INFO: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
  LOG: "bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20",
  WARN: "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20",
  ERROR: "bg-red-500/10 text-red-400 hover:bg-red-500/20",
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

interface LogTableProps {
  logs: ConsoleLogRow[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export function LogTable({ logs, selectedId, onSelect }: LogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No logs found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-background">
        <TableRow>
          <TableHead className="w-[180px] pl-6">Timestamp</TableHead>
          <TableHead className="w-[80px]">Level</TableHead>
          <TableHead className="w-[200px]">Function</TableHead>
          <TableHead className="w-[100px]">Type</TableHead>
          <TableHead>Message</TableHead>
          <TableHead className="w-[120px] pr-6">Request ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow
            key={log.id}
            className={`cursor-pointer hover:bg-muted/50 ${selectedId === log.id ? "bg-muted/50" : ""}`}
            onClick={() => onSelect(selectedId === log.id ? null : log.id)}
          >
            <TableCell className="font-mono text-xs whitespace-nowrap pl-6">
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
            <TableCell className="font-mono text-sm max-w-md truncate">
              {truncate(unquote(log.message), 120)}
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground pr-6">
              {truncate(log.request_id, 12)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
