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

import type { Gender } from "@/models/cattle";
import type { GenderCount } from "@/models/dashboard";

const genderOrder: Gender[] = ["female", "male"];

const genderLabels: Record<Gender, string> = {
  female: "Female",
  male: "Male",
};

const genderConfig: ChartConfig = {
  female: { label: "Female", color: "var(--chart-9)" },
  male: { label: "Male", color: "var(--chart-2)" },
};

export type GenderRatioProps = {
  data: GenderCount[];
};

export function GenderRatio({ data }: GenderRatioProps) {
  const byGender = new Map(data.map((entry) => [entry.gender, entry.count]));
  const chartData = genderOrder
    .map((gender) => ({
      gender,
      label: genderLabels[gender],
      count: byGender.get(gender) ?? 0,
      fill: `var(--color-${gender})`,
    }))
    .filter((entry) => entry.count > 0);

  const total = chartData.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gender ratio</CardTitle>
        <CardDescription>Herd balance &amp; breeding needs.</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState />
        ) : (
          <ChartContainer
            className="mx-auto aspect-square h-48"
            config={genderConfig}
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
                  <Cell fill={entry.fill} key={entry.gender} />
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
        Add an animal to see the ratio.
      </p>
    </div>
  );
}
