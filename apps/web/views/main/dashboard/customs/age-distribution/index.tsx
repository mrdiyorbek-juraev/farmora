"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  ChartContainer,
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/design-system/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type AgeBucket,
  type AgeBucketCount,
  ageBucketLabels,
} from "@/models/dashboard";

const bucketOrder: AgeBucket[] = ["calf", "young", "adult", "mature"];

const ageConfig: ChartConfig = {
  count: { label: "Animals", color: "var(--chart-3)" },
};

export type AgeDistributionProps = {
  data: AgeBucketCount[];
};

export function AgeDistribution({ data }: AgeDistributionProps) {
  const byBucket = new Map(data.map((entry) => [entry.bucket, entry.count]));
  const chartData = bucketOrder.map((bucket) => ({
    bucket,
    label: ageBucketLabels[bucket],
    count: byBucket.get(bucket) ?? 0,
  }));
  const total = chartData.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Age distribution</CardTitle>
        <CardDescription>Breeding &amp; culling planning.</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState />
        ) : (
          <ChartContainer className="h-48 w-full" config={ageConfig}>
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="label"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickLine={false}
                width={28}
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-md border border-border border-dashed p-6 text-center">
      <p className="font-medium text-sm">No DOB recorded yet</p>
      <p className="text-muted-foreground text-sm">
        Add birth dates to see your age cohorts.
      </p>
    </div>
  );
}
