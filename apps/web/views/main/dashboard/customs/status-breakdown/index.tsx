"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
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

// Re-use the chart palette tokens defined in the design-system
// globals.css so the colours line up with the rest of the app.
const statusConfig: ChartConfig = {
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
  const chartData = statusOrder.map((status) => ({
    status,
    label: statusLabels[status],
    count: byStatus.get(status) ?? 0,
    fill: `var(--color-${status})`,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Status breakdown</CardTitle>
            <CardDescription>
              Operational snapshot of every animal in the herd.
            </CardDescription>
          </div>
          <Badge className="tabular-nums" variant="outline">
            {total} total
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState />
        ) : (
          <ChartContainer className="h-56 w-full" config={statusConfig}>
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
                content={<ChartTooltipContent indicator="dot" />}
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
