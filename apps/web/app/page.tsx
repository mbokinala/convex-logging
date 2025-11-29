"use client";

import {
  getConvexFunctions,
  getExecutionTime,
  getFailureRate,
  getFunctionList,
} from "@/app/lib/api";
import { ExecutionTimeChart } from "@/components/ExecutionTimeChart";
import { FailureRateChart } from "@/components/FailureRateChart";
import { CustomTimeRange, QPSChart, TimeRange } from "@/components/QPSChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";

export default function Home() {
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");
  const [customTimeRange, setCustomTimeRange] = useState<CustomTimeRange>({
    start: "",
    end: "",
  });
  const [selectedFunction, setSelectedFunction] = useState<string>("all");
  const [functionsList, setFunctionsList] = useState<string[] | undefined>(
    undefined
  );
  const [data, setData] = useState<
    | {
        date: string;
        query: number;
        mutation: number;
        action: number;
        http_action: number;
      }[]
    | undefined
  >(undefined);
  const [failureRateData, setFailureRateData] = useState<
    | {
        date: string;
        [functionPath: string]: number | string;
      }[]
    | undefined
  >(undefined);
  const [failureFunctions, setFailureFunctions] = useState<
    string[] | undefined
  >(undefined);
  const [failureAggregates, setFailureAggregates] = useState<
    | {
        functionPath: string;
        totalCount: number;
        failureCount: number;
        failureRate: number;
      }[]
    | undefined
  >(undefined);
  const [executionTimeData, setExecutionTimeData] = useState<
    | {
        date: string;
        [functionPath: string]: number | string;
      }[]
    | undefined
  >(undefined);
  const [executionTimeFunctions, setExecutionTimeFunctions] = useState<
    string[] | undefined
  >(undefined);
  const [executionTimeAggregates, setExecutionTimeAggregates] = useState<
    | {
        functionPath: string;
        avgExecutionTime: number;
        totalCount: number;
      }[]
    | undefined
  >(undefined);

  useEffect(() => {
    const fetchFunctions = async () => {
      const functions = await getFunctionList();
      setFunctionsList(functions);
    };
    fetchFunctions();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setData(undefined);
      setFailureRateData(undefined);
      setFailureFunctions(undefined);
      setFailureAggregates(undefined);
      setExecutionTimeData(undefined);
      setExecutionTimeFunctions(undefined);
      setExecutionTimeAggregates(undefined);
      if (timeRange === "custom") {
        // Only fetch if both start and end times are set
        if (customTimeRange.start && customTimeRange.end) {
          const [qpsResult, failureResult, executionTimeResult] =
            await Promise.all([
              getConvexFunctions(
                timeRange,
                customTimeRange.start,
                customTimeRange.end
              ),
              getFailureRate(
                timeRange,
                customTimeRange.start,
                customTimeRange.end
              ),
              getExecutionTime(
                timeRange,
                customTimeRange.start,
                customTimeRange.end
              ),
            ]);
          setData(qpsResult);
          setFailureRateData(failureResult.data);
          setFailureFunctions(failureResult.functions);
          setFailureAggregates(failureResult.aggregates);
          setExecutionTimeData(executionTimeResult.data);
          setExecutionTimeFunctions(executionTimeResult.functions);
          setExecutionTimeAggregates(executionTimeResult.aggregates);
        }
      } else {
        const [qpsResult, failureResult, executionTimeResult] =
          await Promise.all([
            getConvexFunctions(timeRange),
            getFailureRate(timeRange),
            getExecutionTime(timeRange),
          ]);
        setData(qpsResult);
        setFailureRateData(failureResult.data);
        setFailureFunctions(failureResult.functions);
        setFailureAggregates(failureResult.aggregates);
        setExecutionTimeData(executionTimeResult.data);
        setExecutionTimeFunctions(executionTimeResult.functions);
        setExecutionTimeAggregates(executionTimeResult.aggregates);
      }
    };

    fetchData();
  }, [timeRange, customTimeRange]);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">Convex Logging Dashboard</h1>
      <p className="text-gray-600 mb-6">
        This Next.js app shares types with the Hono API using arktype.
      </p>

      {/* Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Time Period</label>
          <Select value={timeRange} onValueChange={setTimeRange}>
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

        {/* <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Function</label>
          {!functionsList ? (
            <Skeleton className="w-[300px] h-10" />
          ) : (
            <Select
              value={selectedFunction}
              onValueChange={setSelectedFunction}
            >
              <SelectTrigger className="w-[300px] font-mono">
                <SelectValue placeholder="Select a function" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Functions</SelectItem>
                {functionsList.map((f) => (
                  <SelectItem className="font-mono" key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div> */}
      </div>

      {/* Custom Time Range Inputs */}
      {timeRange === "custom" && (
        <div className="mb-6 border rounded-lg p-4">
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

      <div className="columns-2 gap-4 [&>*]:mb-4">
        <div className="break-inside-avoid">
          <QPSChart
            data={data}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            customTimeRange={customTimeRange}
            onCustomTimeRangeChange={setCustomTimeRange}
          />
        </div>
        <div className="break-inside-avoid">
          <FailureRateChart
            data={failureRateData}
            functions={failureFunctions}
            aggregates={failureAggregates}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            customTimeRange={customTimeRange}
            onCustomTimeRangeChange={setCustomTimeRange}
          />
        </div>
        <div className="break-inside-avoid">
          <ExecutionTimeChart
            data={executionTimeData}
            functions={executionTimeFunctions}
            aggregates={executionTimeAggregates}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            customTimeRange={customTimeRange}
            onCustomTimeRangeChange={setCustomTimeRange}
          />
        </div>
      </div>
    </div>
  );
}
