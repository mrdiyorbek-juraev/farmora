"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/design-system/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import type { Status } from "@/models/cattle";
import type { StatusCount } from "@/models/dashboard";

const statusOrder: Status[] = [
  "active",
  "sick",
  "pregnant",
  "sold",
  "deceased",
];

const statusLabels: Record<Status, string> = {
  active: "Active",
  sick: "Sick",
  pregnant: "Pregnant",
  sold: "Sold",
  deceased: "Deceased",
};

// shadcn chart config — drives both the per-bar fill (via `var(--color-X)`)
// and the tooltip label lookups.
const statusConfig: ChartConfig = {
  count: { label: "Animals" },
  active: { label: "Active", color: "var(--chart-2)" },
  sick: { label: "Sick", color: "var(--destructive)" },
  pregnant: { label: "Pregnant", color: "var(--chart-9)" },
  sold: { label: "Sold", color: "var(--chart-5)" },
  deceased: { label: "Deceased", color: "var(--muted-foreground)" },
};

export type StatusBreakdownProps = {
  data: StatusCount[];
  total: number;
};

export function StatusBreakdown({ data, total }: StatusBreakdownProps) {
  const byStatus = new Map(data.map((entry) => [entry.status, entry.count]));
  // Only include statuses with at least one row — keeps the chart from
  // showing five flat axis ticks when the herd is small.
  const chartData = statusOrder
    .map((status) => ({
      status,
      label: statusLabels[status],
      count: byStatus.get(status) ?? 0,
      fill: `var(--color-${status})`,
    }))
    .filter((row) => row.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status breakdown</CardTitle>
        <CardDescription>
          Operational snapshot of every animal in the herd.
        </CardDescription>
        <CardAction>
          <Badge className="tabular-nums" variant="outline">
            {total} total
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {total === 0 || chartData.length === 0 ? (
          <EmptyState />
        ) : (
          <ChartContainer
            className="aspect-auto h-56 w-full"
            config={statusConfig}
          >
            <BarChart accessibilityLayer data={chartData} layout="vertical">
              <XAxis hide type="number" />
              <YAxis
                axisLine={false}
                dataKey="label"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickLine={false}
                type="category"
                width={80}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `${value} animals`}
                    hideIndicator={false}
                    indicator="dot"
                  />
                }
                cursor={false}
              />
              <Bar dataKey="count" radius={4} />
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
      <p className="font-medium text-sm">No animals yet</p>
      <p className="text-muted-foreground text-sm">
        Add your first animal to see the herd breakdown.
      </p>
    </div>
  );
}
