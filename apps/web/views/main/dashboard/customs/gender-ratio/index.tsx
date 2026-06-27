"use client";

import { ResponsivePie } from "@nivo/pie";
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
import { Venus } from "lucide-react";

import type { Gender } from "@/models/cattle";
import type { GenderRatioProps } from "@/types/main/dashboard";

import { nivoTheme } from "../nivo-theme";

const genderOrder: Gender[] = ["female", "male"];

const genderLabels: Record<Gender, string> = {
  female: "Female",
  male: "Male",
};

const genderColor: Record<Gender, string> = {
  female: "var(--chart-9)",
  male: "var(--chart-8)",
};

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 0,
});

export function GenderRatio({ data }: GenderRatioProps) {
  const byGender = new Map(data.map((entry) => [entry.gender, entry.count]));
  const chartData = genderOrder
    .map((gender) => ({
      id: gender,
      label: genderLabels[gender],
      value: byGender.get(gender) ?? 0,
      color: genderColor[gender],
    }))
    .filter((entry) => entry.value > 0);

  const total = chartData.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Gender ratio</CardTitle>
        <CardDescription>Herd balance &amp; breeding needs.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {total === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="relative mx-auto h-44 w-44">
              <ResponsivePie
                activeOuterRadiusOffset={4}
                borderWidth={0}
                colors={{ datum: "data.color" }}
                cornerRadius={2}
                data={chartData}
                enableArcLabels={false}
                enableArcLinkLabels={false}
                innerRadius={0.65}
                margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                padAngle={1}
                theme={nivoTheme}
                tooltip={({ datum }) => (
                  <div className="flex items-center gap-2 whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-popover-foreground text-xs shadow-md">
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: datum.color }}
                    />
                    <span className="font-medium">{datum.label}</span>
                    <span className="ml-1 tabular-nums">{datum.value}</span>
                  </div>
                )}
              />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-semibold text-foreground text-xl">
                  {total}
                </span>
                <span className="text-muted-foreground text-xs">animals</span>
              </div>
            </div>
            <ul className="flex w-full flex-col gap-1 text-sm">
              {chartData.map((entry) => (
                <li
                  className="flex items-center justify-between"
                  key={entry.id}
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="size-2 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="font-medium">{entry.label}</span>
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {entry.value}{" "}
                    <span className="text-xs">
                      ({percentFormatter.format(entry.value / total)})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
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
          <Venus />
        </EmptyMedia>
        <EmptyTitle>No animals yet</EmptyTitle>
        <EmptyDescription>Add an animal to see the ratio.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}