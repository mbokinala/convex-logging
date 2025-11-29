"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export const description = "Function failure rate chart";

export type TimeRange = "1m" | "1h" | "1d" | "all" | "custom";

export interface CustomTimeRange {
  start: string;
  end: string;
}

// Generate colors for functions
const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--destructive))",
];

export interface FailureAggregate {
  functionPath: string;
  totalCount: number;
  failureCount: number;
  failureRate: number;
}

export function FailureRateChart({
  data,
  functions,
  aggregates,
  timeRange,
  onTimeRangeChange,
  customTimeRange,
  onCustomTimeRangeChange,
}: {
  data?: Array<{ date: string; [functionPath: string]: number | string }>;
  functions?: string[];
  aggregates?: FailureAggregate[];
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange) => void;
  customTimeRange?: CustomTimeRange;
  onCustomTimeRangeChange?: (value: CustomTimeRange) => void;
}) {
  const chartConfig = useMemo(() => {
    if (!functions) return {} as ChartConfig;

    const config: ChartConfig = {};
    functions.forEach((func, index) => {
      // Extract function name from path (e.g., "module:functionName" -> "functionName")
      const displayName = func.includes(':') ? func.split(':')[1] : func;
      config[func] = {
        label: displayName,
        color: chartColors[index % chartColors.length],
      };
    });
    return config;
  }, [functions]);
  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Function Failure Rate</CardTitle>
          <CardDescription>
            Percentage of function executions that failed.
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 1 hour" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="1m" className="rounded-lg">
              Last 1 minute
            </SelectItem>
            <SelectItem value="1h" className="rounded-lg">
              Last 1 hour
            </SelectItem>
            <SelectItem value="1d" className="rounded-lg">
              Last 1 day
            </SelectItem>
            <SelectItem value="all" className="rounded-lg">
              All time
            </SelectItem>
            <SelectItem value="custom" className="rounded-lg">
              Custom period
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      {timeRange === "custom" && (
        <div className="border-b px-6 py-4">
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
                  onCustomTimeRangeChange?.({
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
                  onCustomTimeRangeChange?.({
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
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {!data || !functions ? (
          <Skeleton className="aspect-auto h-[350px] w-full" />
        ) : data.length === 0 || functions.length === 0 ? (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            No failures in selected period
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[350px] w-full"
          >
            <LineChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        timeZoneName: "short",
                      });
                    }}
                    formatter={(value, name) => {
                      const label = chartConfig[name as string]?.label || name;
                      return [`${Number(value).toFixed(2)}% `, label];
                    }}
                    indicator="dot"
                  />
                }
              />
              {functions.map((func, index) => (
                <Line
                  key={func}
                  dataKey={func}
                  type="monotone"
                  stroke={chartColors[index % chartColors.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
              <ChartLegend
                content={<ChartLegendContent className="flex-wrap gap-2" />}
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: "20px" }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
      {aggregates && aggregates.length > 0 && (
        <CardContent className="px-6 pb-6">
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="text-left font-medium py-3 px-4">Function</th>
                  <th className="text-right font-medium py-3 px-4">Total Executions</th>
                  <th className="text-right font-medium py-3 px-4">Failures</th>
                  <th className="text-right font-medium py-3 px-4">Failure Rate</th>
                </tr>
              </thead>
              <tbody>
                {aggregates
                  .sort((a, b) => b.failureRate - a.failureRate)
                  .map((aggregate) => {
                    const displayName = aggregate.functionPath.includes(':')
                      ? aggregate.functionPath.split(':')[1]
                      : aggregate.functionPath;
                    return (
                      <tr key={aggregate.functionPath} className="border-b last:border-0">
                        <td className="py-3 px-4 font-medium">{displayName}</td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {aggregate.totalCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {aggregate.failureCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {aggregate.failureRate.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
