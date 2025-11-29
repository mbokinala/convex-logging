"use client";

import { useEffect, useState } from "react";
import { FunctionList } from "@/components/FunctionList";
import { QPSChart, TimeRange, CustomTimeRange } from "@/components/QPSChart";
import { FailureRateChart } from "@/components/FailureRateChart";
import { getConvexFunctions, getFailureRate } from "@/app/lib/api";

export default function Home() {
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");
  const [customTimeRange, setCustomTimeRange] = useState<CustomTimeRange>({
    start: "",
    end: "",
  });
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
  const [failureFunctions, setFailureFunctions] = useState<string[] | undefined>(undefined);
  const [failureAggregates, setFailureAggregates] = useState<
    | {
        functionPath: string;
        totalCount: number;
        failureCount: number;
        failureRate: number;
      }[]
    | undefined
  >(undefined);

  useEffect(() => {
    const fetchData = async () => {
      setData(undefined);
      setFailureRateData(undefined);
      setFailureFunctions(undefined);
      setFailureAggregates(undefined);
      if (timeRange === "custom") {
        // Only fetch if both start and end times are set
        if (customTimeRange.start && customTimeRange.end) {
          const [qpsResult, failureResult] = await Promise.all([
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
          ]);
          setData(qpsResult);
          setFailureRateData(failureResult.data);
          setFailureFunctions(failureResult.functions);
          setFailureAggregates(failureResult.aggregates);
        }
      } else {
        const [qpsResult, failureResult] = await Promise.all([
          getConvexFunctions(timeRange),
          getFailureRate(timeRange),
        ]);
        setData(qpsResult);
        setFailureRateData(failureResult.data);
        setFailureFunctions(failureResult.functions);
        setFailureAggregates(failureResult.aggregates);
      }
    };

    fetchData();
  }, [timeRange, customTimeRange]);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">Convex Logging Dashboard</h1>
      <p className="text-gray-600">
        This Next.js app shares types with the Hono API using arktype.
      </p>
      <FunctionList />
      <QPSChart
        data={data}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        customTimeRange={customTimeRange}
        onCustomTimeRangeChange={setCustomTimeRange}
      />
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
  );
}
