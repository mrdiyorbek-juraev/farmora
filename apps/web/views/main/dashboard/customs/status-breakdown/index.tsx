"use client";

import { ResponsivePie } from "@nivo/pie";
import { Badge } from "@repo/design-system/components/ui/badge";
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
import { PieChart as PieIcon } from "lucide-react";

import type { Status } from "@/models/cattle";
import type { StatusCount } from "@/models/dashboard";

import { nivoTheme } from "../nivo-theme";

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

const statusColor: Record<Status, string> = {
  active: "var(--chart-2)",
  sick: "var(--destructive)",
  pregnant: "var(--chart-9)",
  sold: "var(--chart-5)",
  deceased: "var(--muted-foreground)",
};

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 1,
});

export type StatusBreakdownProps = {
  data: StatusCount[];
  total: number;
};

export function StatusBreakdown({ data, total }: StatusBreakdownProps) {
  const byStatus = new Map(data.map((entry) => [entry.status, entry.count]));
  const rows = statusOrder.map((status) => {
    const count = byStatus.get(status) ?? 0;
    return {
      status,
      label: statusLabels[status],
      count,
      share: total === 0 ? 0 : count / total,
      color: statusColor[status],
    };
  });

  const slices = rows
    .filter((row) => row.count > 0)
    .map((row) => ({
      id: row.status,
      label: row.label,
      value: row.count,
      color: row.color,
    }));

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Status breakdown</CardTitle>
            <CardDescription>
              Distribution across statuses — operational snapshot.
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
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[auto_1fr]">
            <div className="relative mx-auto h-56 w-56">
              <ResponsivePie
                activeOuterRadiusOffset={6}
                borderWidth={0}
                colors={{ datum: "data.color" }}
                cornerRadius={2}
                data={slices}
                enableArcLabels={false}
                enableArcLinkLabels={false}
                innerRadius={0.65}
                margin={{ top: 6, right: 6, bottom: 6, left: 6 }}
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
                <span className="font-semibold text-2xl text-foreground">
                  {total}
                </span>
                <span className="text-muted-foreground text-xs">in herd</span>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-1 text-sm">
              <div className="text-muted-foreground text-xs uppercase tracking-wide">
                Status
              </div>
              <div className="text-right text-muted-foreground text-xs uppercase tracking-wide">
                Count
              </div>
              <div className="text-right text-muted-foreground text-xs uppercase tracking-wide">
                Share
              </div>
              {rows.map((row) => (
                <Row key={row.status} {...row} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type RowProps = {
  label: string;
  count: number;
  share: number;
  color: string;
};

function Row({ label, count, share, color }: RowProps) {
  return (
    <>
      <div className="flex items-center gap-2 py-1.5">
        <span
          aria-hidden
          className="size-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-medium">{label}</span>
      </div>
      <div className="py-1.5 text-right tabular-nums">{count}</div>
      <div className="py-1.5 text-right text-muted-foreground tabular-nums">
        {percentFormatter.format(share)}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <Empty className="h-56 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PieIcon />
        </EmptyMedia>
        <EmptyTitle>No animals yet</EmptyTitle>
        <EmptyDescription>
          Add your first animal to see the herd breakdown.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}