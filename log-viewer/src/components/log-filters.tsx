"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { FilterOptions, LogFilters } from "@/lib/types";
import { TimeRangePicker } from "./time-range-picker";

const LOG_LEVELS = ["DEBUG", "INFO", "LOG", "WARN", "ERROR"];
const FUNCTION_TYPES = ["query", "mutation", "action", "http_action"];

interface LogFilterBarProps {
  filters: LogFilters;
  filterOptions: FilterOptions;
  onChange: (filters: LogFilters) => void;
}

export function LogFilterBar({
  filters,
  filterOptions,
  onChange,
}: LogFilterBarProps) {
  const [searchText, setSearchText] = useState(filters.search ?? "");
  const [funcPathText, setFuncPathText] = useState(
    filters.functionPath ?? ""
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText !== (filters.search ?? "")) {
        onChange({ ...filters, search: searchText || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Debounce function path
  useEffect(() => {
    const timer = setTimeout(() => {
      if (funcPathText !== (filters.functionPath ?? "")) {
        onChange({ ...filters, functionPath: funcPathText || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [funcPathText]);

  const toggleLevel = (level: string) => {
    const current = filters.logLevels ?? [];
    const next = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];
    onChange({ ...filters, logLevels: next.length ? next : undefined });
  };

  const toggleFunctionType = (type: string) => {
    const current = filters.functionTypes ?? [];
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onChange({
      ...filters,
      functionTypes: next.length ? next : undefined,
    });
  };

  const clearAll = () => {
    setSearchText("");
    setFuncPathText("");
    onChange({});
  };

  const hasFilters =
    filters.logLevels?.length ||
    filters.functionTypes?.length ||
    filters.deploymentName ||
    filters.functionPath ||
    filters.search ||
    filters.timeFrom ||
    filters.timeTo;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Log Level Multi-Select */}
      <Popover>
        <PopoverTrigger render={<Button variant="outline" size="sm" />}>
          Level
          {filters.logLevels?.length
            ? ` (${filters.logLevels.length})`
            : ""}
        </PopoverTrigger>
        <PopoverContent className="w-40 p-2" align="start">
          {LOG_LEVELS.map((level) => (
            <label
              key={level}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={filters.logLevels?.includes(level) ?? false}
                onChange={() => toggleLevel(level)}
                className="rounded"
              />
              {level}
            </label>
          ))}
        </PopoverContent>
      </Popover>

      {/* Function Type Multi-Select */}
      <Popover>
        <PopoverTrigger render={<Button variant="outline" size="sm" />}>
          Type
          {filters.functionTypes?.length
            ? ` (${filters.functionTypes.length})`
            : ""}
        </PopoverTrigger>
        <PopoverContent className="w-44 p-2" align="start">
          {FUNCTION_TYPES.map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={filters.functionTypes?.includes(type) ?? false}
                onChange={() => toggleFunctionType(type)}
                className="rounded"
              />
              {type}
            </label>
          ))}
        </PopoverContent>
      </Popover>

      {/* Deployment Select */}
      {filterOptions.deploymentNames.length > 0 && (
        <Select
          value={filters.deploymentName ?? "__all__"}
          onValueChange={(v) =>
            onChange({
              ...filters,
              deploymentName: !v || v === "__all__" ? undefined : v,
            })
          }
        >
          <SelectTrigger className="w-[180px]" size="sm">
            <SelectValue placeholder="Deployment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All deployments</SelectItem>
            {filterOptions.deploymentNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Function Path Search */}
      <Input
        placeholder="Function path..."
        value={funcPathText}
        onChange={(e) => setFuncPathText(e.target.value)}
        className="w-[160px] h-8 text-sm"
      />

      {/* Message Search */}
      <Input
        placeholder="Search messages..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-[180px] h-8 text-sm"
      />

      {/* Time Range */}
      <TimeRangePicker
        timeFrom={filters.timeFrom}
        timeTo={filters.timeTo}
        onChange={(timeFrom, timeTo) =>
          onChange({ ...filters, timeFrom, timeTo })
        }
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Clear
        </Button>
      )}
    </div>
  );
}
