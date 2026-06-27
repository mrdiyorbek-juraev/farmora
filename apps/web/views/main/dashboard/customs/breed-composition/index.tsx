"use client";

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
import { Layers } from "lucide-react";

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

// Rotate through the chart palette so up to 9 breeds get distinct
// colours without per-breed config.
const palette = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-9)",
  "var(--chart-10)",
  "var(--chart-11)",
  "var(--chart-13)",
  "var(--chart-14)",
];

const numberFormatter = new Intl.NumberFormat();

export type BreedCompositionProps = {
  data: BreedCount[];
};

export function BreedComposition({ data }: BreedCompositionProps) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const max = sorted[0]?.count ?? 0;
  const total = sorted.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Breed distribution</CardTitle>
        <CardDescription>Diversity at a glance.</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-3">
            {sorted.map((entry, index) => {
              const color = palette[index % palette.length];
              const width = max === 0 ? 0 : (entry.count / max) * 100;
              return (
                <li className="flex flex-col gap-1" key={entry.breed}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="size-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium">
                        {breedLabels[entry.breed]}
                      </span>
                    </div>
                    <span className="text-muted-foreground tabular-nums">
                      {numberFormatter.format(entry.count)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${width}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
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
          <Layers />
        </EmptyMedia>
        <EmptyTitle>No animals yet</EmptyTitle>
        <EmptyDescription>Add animals to see your breed mix.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
