"use client";

import { useMemo, useState } from "react";
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
  const [isTableExpanded, setIsTableExpanded] = useState(false);

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
      </CardHeader>
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
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="text-left font-medium py-3 px-4 whitespace-nowrap">Function</th>
                  <th className="text-right font-medium py-3 px-4 whitespace-nowrap">Total Executions</th>
                  <th className="text-right font-medium py-3 px-4 whitespace-nowrap">Failures</th>
                  <th className="text-right font-medium py-3 px-4 whitespace-nowrap">Failure Rate</th>
                </tr>
              </thead>
              <tbody>
                {aggregates
                  .sort((a, b) => b.failureRate - a.failureRate)
                  .slice(0, isTableExpanded ? undefined : 3)
                  .map((aggregate) => {
                    const displayName = aggregate.functionPath.includes(':')
                      ? aggregate.functionPath.split(':')[1]
                      : aggregate.functionPath;
                    return (
                      <tr key={aggregate.functionPath} className="border-b last:border-0">
                        <td className="py-3 px-4 font-medium whitespace-nowrap">{displayName}</td>
                        <td className="py-3 px-4 text-right text-muted-foreground whitespace-nowrap">
                          {aggregate.totalCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground whitespace-nowrap">
                          {aggregate.failureCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-medium whitespace-nowrap">
                          {aggregate.failureRate.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {aggregates.length > 3 && (
            <button
              onClick={() => setIsTableExpanded(!isTableExpanded)}
              className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isTableExpanded
                ? `Show less`
                : `Show ${aggregates.length - 3} more function${aggregates.length - 3 !== 1 ? 's' : ''}`}
            </button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
