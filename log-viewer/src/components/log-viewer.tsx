"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { LogEntry, FilterOptions, LogFilters } from "@/lib/types";
import { LogTable } from "./log-table";
import { LogFilterBar } from "./log-filters";
import { LiveTailToggle } from "./live-tail-toggle";
import { LogRowDetail } from "./log-row-detail";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 50;

interface LogViewerProps {
  filterOptions: FilterOptions;
}

export function LogViewer({ filterOptions }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<LogFilters>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [liveTail, setLiveTail] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pageRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const hasMore = logs.length < total;

  const selectedLog = selectedKey !== null
    ? logs.find((l) => `${l.kind}-${l.id}` === selectedKey) ?? null
    : null;

  const buildParams = useCallback((page: number) => {
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
    params.set("pageSize", String(PAGE_SIZE));
    return params;
  }, [filters]);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    pageRef.current = 1;
    try {
      const res = await fetch(`/api/logs?${buildParams(1)}`);
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    try {
      const res = await fetch(`/api/logs?${buildParams(nextPage)}`);
      const data = await res.json();
      pageRef.current = nextPage;
      setLogs((prev) => {
        const existing = new Set(prev.map((l: LogEntry) => `${l.kind}-${l.id}`));
        const unique = (data.logs as LogEntry[]).filter(
          (l: LogEntry) => !existing.has(`${l.kind}-${l.id}`)
        );
        return [...prev, ...unique];
      });
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch more logs:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [buildParams, loadingMore, hasMore]);

  // Initial fetch + refetch on filter change
  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMore();
        }
      },
      { root: container, rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchMore]);

  // Live tail polling (always refreshes from page 1)
  useEffect(() => {
    if (liveTail) {
      intervalRef.current = setInterval(fetchInitial, 2000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [liveTail, fetchInitial]);

  const handleFiltersChange = (newFilters: LogFilters) => {
    setFilters(newFilters);
  };

  const handleLiveTailToggle = (enabled: boolean) => {
    setLiveTail(enabled);
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
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto" ref={scrollContainerRef}>
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <LogTable
              logs={logs}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              sentinelRef={sentinelRef}
              loadingMore={loadingMore}
              hasMore={hasMore}
              total={total}
            />
          )}
        </div>
        {selectedLog && (
          <div className="w-[400px] shrink-0 border-l bg-background overflow-hidden">
            <LogRowDetail
              log={selectedLog}
              onClose={() => setSelectedKey(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
