"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ConsoleLogRow, FilterOptions, LogFilters } from "@/lib/types";
import { LogTable } from "./log-table";
import { LogFilterBar } from "./log-filters";
import { PaginationControls } from "./pagination-controls";
import { LiveTailToggle } from "./live-tail-toggle";
import { Skeleton } from "@/components/ui/skeleton";

interface LogViewerProps {
  filterOptions: FilterOptions;
}

export function LogViewer({ filterOptions }: LogViewerProps) {
  const [logs, setLogs] = useState<ConsoleLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState<LogFilters>({});
  const [loading, setLoading] = useState(true);
  const [liveTail, setLiveTail] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.logLevels?.length)
      params.set("logLevel", filters.logLevels.join(","));
    if (filters.functionTypes?.length)
      params.set("functionType", filters.functionTypes.join(","));
    if (filters.deploymentName)
      params.set("deploymentName", filters.deploymentName);
    if (filters.functionPath)
      params.set("functionPath", filters.functionPath);
    if (filters.search) params.set("search", filters.search);
    if (filters.timeFrom) params.set("timeFrom", filters.timeFrom);
    if (filters.timeTo) params.set("timeTo", filters.timeTo);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    try {
      const res = await fetch(`/api/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    setLoading(true);
    fetchLogs();
  }, [fetchLogs]);

  // Live tail polling
  useEffect(() => {
    if (liveTail) {
      intervalRef.current = setInterval(fetchLogs, 2000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [liveTail, fetchLogs]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (liveTail && newPage !== 1) {
      setLiveTail(false);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: LogFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleLiveTailToggle = (enabled: boolean) => {
    setLiveTail(enabled);
    if (enabled) {
      setPage(1);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="border-b px-6 py-3 shrink-0 flex items-center justify-between gap-4">
        <LogFilterBar
          filters={filters}
          filterOptions={filterOptions}
          onChange={handleFiltersChange}
        />
        <LiveTailToggle enabled={liveTail} onToggle={handleLiveTailToggle} />
      </div>
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <LogTable logs={logs} />
        )}
      </div>
      <div className="border-t px-6 py-3 shrink-0">
        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}
