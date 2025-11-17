"use client";

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

export const description = "An interactive line chart";

export type TimeRange = "1m" | "1h" | "1d" | "all" | "custom";

export interface CustomTimeRange {
  start: string;
  end: string;
}

const chartConfig = {
  query: {
    label: "Query",
    color: "hsl(var(--chart-1))",
  },
  mutation: {
    label: "Mutation",
    color: "hsl(var(--chart-2))",
  },
  action: {
    label: "Action",
    color: "hsl(var(--chart-3))",
  },
  http_action: {
    label: "HTTP Action",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export function QPSChart({
  data,
  timeRange,
  onTimeRangeChange,
  customTimeRange,
  onCustomTimeRangeChange,
}: {
  data?: {
    date: string;
    query: number;
    mutation: number;
    action: number;
    http_action: number;
  }[];
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange) => void;
  customTimeRange?: CustomTimeRange;
  onCustomTimeRangeChange?: (value: CustomTimeRange) => void;
}) {
  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Function Executions / Second</CardTitle>
          <CardDescription>
            Function executions per second, broken down by function type.
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
        {!data ? (
          <Skeleton className="aspect-auto h-[250px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No data in selected period
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
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
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
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
                    indicator="dot"
                  />
                }
              />
              <Line
                dataKey="query"
                type="monotone"
                stroke="var(--color-query)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="mutation"
                type="natural"
                stroke="var(--color-mutation)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="action"
                type="natural"
                stroke="var(--color-action)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="http_action"
                type="natural"
                stroke="var(--color-http_action)"
                strokeWidth={2}
                dot={false}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
