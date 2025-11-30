"use client";

import { getConsoleLogs, getFunctionList } from "@/app/lib/api";
import { LoginForm } from "@/components/LoginForm";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { CustomTimeRange, TimeRange } from "@/components/QPSChart";

type ConsoleLog = {
  function_type: string;
  function_path: string;
  function_cached: boolean;
  request_id: string;
  timestamp: string;
  log_level: string;
  message: string;
  is_truncated: boolean;
  system_code: string;
};

export default function LogsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem("dashboard_authenticated");
    setIsAuthenticated(auth === "true");
    setIsCheckingAuth(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("dashboard_authenticated");
    setIsAuthenticated(false);
  };

  const [timeRange, setTimeRange] = useState<TimeRange>("1h");
  const [customTimeRange, setCustomTimeRange] = useState<CustomTimeRange>({
    start: "",
    end: "",
  });
  const [selectedFunction, setSelectedFunction] = useState<string>("all");
  const [selectedLogLevel, setSelectedLogLevel] = useState<string>("all");
  const [functionsList, setFunctionsList] = useState<string[] | undefined>(
    undefined
  );
  const [logs, setLogs] = useState<ConsoleLog[] | undefined>(undefined);
  const [limit, setLimit] = useState<number>(1000);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [requestLogs, setRequestLogs] = useState<ConsoleLog[] | undefined>(undefined);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [expandedTableMessages, setExpandedTableMessages] = useState<Set<string>>(new Set());

  const toggleMessageExpansion = (logId: string) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const toggleTableMessageExpansion = (logId: string) => {
    setExpandedTableMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const fetchFunctions = async () => {
      const functions = await getFunctionList();
      setFunctionsList(functions);
    };
    fetchFunctions();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      setLogs(undefined);
      if (timeRange === "custom") {
        if (customTimeRange.start && customTimeRange.end) {
          const logsResult = await getConsoleLogs(
            timeRange,
            customTimeRange.start,
            customTimeRange.end,
            selectedFunction,
            selectedLogLevel,
            limit
          );
          setLogs(logsResult);
        }
      } else {
        const logsResult = await getConsoleLogs(
          timeRange,
          undefined,
          undefined,
          selectedFunction,
          selectedLogLevel,
          limit
        );
        setLogs(logsResult);
      }
    };

    fetchLogs();
  }, [timeRange, customTimeRange, selectedFunction, selectedLogLevel, limit]);

  useEffect(() => {
    const fetchRequestLogs = async () => {
      if (!selectedRequestId) {
        setRequestLogs(undefined);
        setExpandedMessages(new Set());
        return;
      }

      // Fetch all logs for the selected request ID
      const result = await getConsoleLogs(
        "all",
        undefined,
        undefined,
        undefined,
        undefined,
        10000
      );

      const filtered = result.filter(log => log.request_id === selectedRequestId);
      setRequestLogs(filtered);
      setExpandedMessages(new Set());
    };

    fetchRequestLogs();
  }, [selectedRequestId]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const getLogLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return "text-red-500";
      case "warn":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      case "debug":
        return "text-gray-500";
      default:
        return "text-white";
    }
  };

  return (
    <div className="h-full p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Console Logs</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Time Period</label>
            <Select
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as TimeRange)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Last 1 minute</SelectItem>
                <SelectItem value="1h">Last 1 hour</SelectItem>
                <SelectItem value="1d">Last 1 day</SelectItem>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="custom">Custom period</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Function</label>
            <Select value={selectedFunction} onValueChange={setSelectedFunction}>
              <SelectTrigger className="w-[300px] font-mono">
                <SelectValue placeholder="Select a function" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Functions</SelectItem>
                {functionsList?.map((f) => (
                  <SelectItem className="font-mono" key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Log Level</label>
            <Select value={selectedLogLevel} onValueChange={setSelectedLogLevel}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select log level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="DEBUG">Debug</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="WARN">Warn</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Limit</label>
            <Select
              value={limit.toString()}
              onValueChange={(value) => setLimit(parseInt(value))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100 logs</SelectItem>
                <SelectItem value="500">500 logs</SelectItem>
                <SelectItem value="1000">1000 logs</SelectItem>
                <SelectItem value="5000">5000 logs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Time Range Inputs */}
        {timeRange === "custom" && (
          <div className="border rounded-lg p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <label htmlFor="start-time" className="text-sm font-medium">
                  Start Time
                </label>
                <input
                  id="start-time"
                  type="datetime-local"
                  value={customTimeRange?.start || ""}
                  onChange={(e) =>
                    setCustomTimeRange({
                      start: e.target.value,
                      end: customTimeRange?.end || "",
                    })
                  }
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label htmlFor="end-time" className="text-sm font-medium">
                  End Time
                </label>
                <input
                  id="end-time"
                  type="datetime-local"
                  value={customTimeRange?.end || ""}
                  onChange={(e) =>
                    setCustomTimeRange({
                      start: customTimeRange?.start || "",
                      end: e.target.value,
                    })
                  }
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Function
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Message
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Request ID
                </th>
              </tr>
            </thead>
            <tbody>
              {!logs ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => {
                  const logId = `table-${log.request_id}-${index}`;
                  const isExpanded = expandedTableMessages.has(logId);
                  const isLong = log.message.length > 200;
                  const displayMessage = isExpanded || !isLong
                    ? log.message
                    : log.message.substring(0, 200) + "...";

                  return (
                    <tr
                      key={`${log.request_id}-${index}`}
                      className="border-t hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 text-sm font-mono whitespace-nowrap align-top">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-semibold align-top ${getLogLevelColor(
                          log.log_level
                        )}`}
                      >
                        {log.log_level}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono align-top">
                        {log.function_path}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-2xl">
                        <div className="break-words font-mono">
                          {displayMessage}
                          {log.is_truncated && (
                            <span className="text-yellow-500 ml-2">(truncated)</span>
                          )}
                          {isLong && (
                            <button
                              onClick={() => toggleTableMessageExpansion(logId)}
                              className="text-blue-500 hover:text-blue-400 ml-2 underline"
                            >
                              {isExpanded ? "Show less" : "Show more"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground whitespace-nowrap align-top">
                        <button
                          onClick={() => setSelectedRequestId(log.request_id)}
                          className="text-blue-500 hover:text-blue-400 hover:underline cursor-pointer"
                        >
                          {log.request_id}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {logs && logs.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {logs.length} log{logs.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Side Drawer */}
      {selectedRequestId && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedRequestId(null)}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-full md:w-2/3 lg:w-1/2 bg-background border-l shadow-lg z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Request Logs</h2>
                <p className="text-sm text-muted-foreground font-mono mt-1">
                  {selectedRequestId}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedRequestId(null)}
              >
                Close
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {!requestLogs ? (
                <div className="text-center text-muted-foreground py-8">
                  Loading request logs...
                </div>
              ) : requestLogs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No logs found for this request
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium w-[200px]">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium w-[100px]">
                        Level
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestLogs.map((log, index) => {
                      const logId = `${log.request_id}-${index}`;
                      const isExpanded = expandedMessages.has(logId);
                      const isLong = log.message.length > 200;
                      const displayMessage = isExpanded || !isLong
                        ? log.message
                        : log.message.substring(0, 200) + "...";

                      return (
                        <tr
                          key={logId}
                          className="border-t hover:bg-muted/50"
                        >
                          <td className="px-4 py-3 text-sm font-mono whitespace-nowrap align-top w-[200px]">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap align-top w-[100px] ${getLogLevelColor(
                              log.log_level
                            )}`}
                          >
                            {log.log_level}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono">
                            <div className="break-words">
                              {displayMessage}
                              {log.is_truncated && (
                                <span className="text-yellow-500 ml-2">(truncated)</span>
                              )}
                              {isLong && (
                                <button
                                  onClick={() => toggleMessageExpansion(logId)}
                                  className="text-blue-500 hover:text-blue-400 ml-2 underline"
                                >
                                  {isExpanded ? "Show less" : "Show more"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
