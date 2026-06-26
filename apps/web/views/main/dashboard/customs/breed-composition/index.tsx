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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/design-system/components/ui/chart";
import { Cell, Pie, PieChart } from "recharts";

import type { Breed } from "@/models/cattle";
import type { BreedCount } from "@/models/dashboard";

const breedLabels: Record<Breed, string> = {
  holstein: "Holstein",
  jersey: "Jersey",
  angus: "Angus",
  hereford: "Hereford",
  brown_swiss: "Brown Swiss",
  guernsey: "Guernsey",
  charolais: "Charolais",
  simmental: "Simmental",
  other: "Other",
};

// Rotate through the chart palette so up to 9 breeds get distinct colors
// without needing per-breed config plumbing.
const palette = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
  "var(--chart-9)",
];

export type BreedCompositionProps = {
  data: BreedCount[];
};

export function BreedComposition({ data }: BreedCompositionProps) {
  const sorted = [...data].sort((a, b) => b.count - a.count);

  const config: ChartConfig = Object.fromEntries(
    sorted.map((entry, index) => [
      entry.breed,
      { label: breedLabels[entry.breed], color: palette[index % palette.length] },
    ])
  );

  const chartData = sorted.map((entry, index) => ({
    breed: entry.breed,
    label: breedLabels[entry.breed],
    count: entry.count,
    fill: palette[index % palette.length],
  }));

  const total = chartData.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Breed composition</CardTitle>
        <CardDescription>Diversity at a glance.</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState />
        ) : (
          <ChartContainer
            className="mx-auto aspect-square h-48"
            config={config}
          >
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent indicator="dot" hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="count"
                innerRadius={40}
                nameKey="label"
                paddingAngle={2}
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell fill={entry.fill} key={entry.breed} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="label" />}
                verticalAlign="bottom"
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-md border border-border border-dashed p-6 text-center">
      <p className="font-medium text-sm">No animals yet</p>
      <p className="text-muted-foreground text-sm">
        Add animals to see your breed mix.
      </p>
    </div>
  );
}
