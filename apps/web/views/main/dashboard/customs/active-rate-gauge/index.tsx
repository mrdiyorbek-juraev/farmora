"use client";

import { ResponsivePie } from "@nivo/pie";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Activity } from "lucide-react";

import { nivoTheme } from "../nivo-theme";

export type ActiveRateGaugeProps = {
  active: number;
  total: number;
};

export function ActiveRateGauge({ active, total }: ActiveRateGaugeProps) {
  const pct = total === 0 ? 0 : Math.round((active / total) * 100);
  const data = [
    { id: "active", label: "Active", value: pct, color: "var(--chart-2)" },
    {
      id: "rest",
      label: "Remainder",
      value: Math.max(100 - pct, 0),
      color: "var(--muted)",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-medium text-muted-foreground text-sm">
          Active rate
        </CardTitle>
        <CardAction>
          <span className="flex aspect-square size-8 items-center justify-center rounded-md bg-muted text-foreground">
            <Activity className="size-4" />
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0">
          <ResponsivePie
            borderWidth={0}
            colors={{ datum: "data.color" }}
            cornerRadius={4}
            data={data}
            enableArcLabels={false}
            enableArcLinkLabels={false}
            innerRadius={0.72}
            isInteractive={false}
            margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
            padAngle={0}
            startAngle={0}
            theme={nivoTheme}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-3xl tabular-nums tracking-tight">
            {pct}%
          </span>
          <span className="text-muted-foreground text-sm">
            {active} of {total} animals counted as active.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
