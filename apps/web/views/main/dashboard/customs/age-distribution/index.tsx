"use client";

import { ResponsiveBar } from "@nivo/bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { CakeSlice } from "lucide-react";

import {
  type AgeBucket,
  type AgeBucketCount,
  ageBucketLabels,
} from "@/models/dashboard";

import { nivoTheme } from "../nivo-theme";

const bucketOrder: AgeBucket[] = ["calf", "young", "adult", "mature"];

const bucketHint: Record<AgeBucket, string> = {
  calf: "< 6 mo",
  young: "6 mo – 1 yr",
  adult: "1 – 5 yr",
  mature: "5+ yr",
};

export type AgeDistributionProps = {
  data: AgeBucketCount[];
};

export function AgeDistribution({ data }: AgeDistributionProps) {
  const byBucket = new Map(data.map((entry) => [entry.bucket, entry.count]));
  const chartData = bucketOrder.map((bucket) => ({
    bucket,
    label: ageBucketLabels[bucket],
    hint: bucketHint[bucket],
    count: byBucket.get(bucket) ?? 0,
  }));
  const total = chartData.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Age distribution</CardTitle>
        <CardDescription>Breeding &amp; culling planning.</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState />
        ) : (
          <div className="h-56 w-full">
            <ResponsiveBar
              animate
              axisBottom={{
                tickPadding: 6,
                tickSize: 0,
              }}
              axisLeft={{
                tickPadding: 6,
                tickSize: 0,
                tickValues: 4,
              }}
              borderRadius={4}
              colors={["var(--chart-3)"]}
              data={chartData}
              enableGridX={false}
              enableGridY
              enableLabel={false}
              indexBy="label"
              keys={["count"]}
              labelSkipHeight={16}
              labelTextColor="var(--foreground)"
              margin={{ top: 16, right: 8, bottom: 28, left: 36 }}
              padding={0.4}
              theme={nivoTheme}
              tooltip={({ indexValue, value, data: datum }) => (
                <div className="flex items-center gap-2 whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-popover-foreground text-xs shadow-md">
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: "var(--chart-3)" }}
                  />
                  <span className="font-medium">{indexValue}</span>
                  <span className="text-muted-foreground">
                    {(datum as { hint: string }).hint}
                  </span>
                  <span className="ml-1 font-medium tabular-nums">
                    {value} animals
                  </span>
                </div>
              )}
              valueFormat={(v) => `${v}`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Empty className="h-56 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CakeSlice />
        </EmptyMedia>
        <EmptyTitle>No DOB recorded yet</EmptyTitle>
        <EmptyDescription>
          Add birth dates to see your age cohorts.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
