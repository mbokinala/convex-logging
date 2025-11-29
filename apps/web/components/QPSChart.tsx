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
      </CardHeader>
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
