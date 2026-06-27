"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";

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
// without per-breed config plumbing.
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
  const total = sorted.reduce((sum, entry) => sum + entry.count, 0);

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
          <ul className="flex flex-col gap-3">
            {sorted.map((entry, index) => {
              const color = palette[index % palette.length];
              const share = entry.count / total;
              return (
                <li
                  className="flex flex-col gap-1.5"
                  key={entry.breed}
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium text-foreground">
                        {breedLabels[entry.breed]}
                      </span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {entry.count}{" "}
                      <span className="text-muted-foreground/70">
                        ({Math.round(share * 100)}%)
                      </span>
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: color,
                        width: `${share * 100}%`,
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
    <div className="flex h-32 flex-col items-center justify-center gap-1 rounded-md border border-border border-dashed p-6 text-center">
      <p className="font-medium text-sm">No animals yet</p>
      <p className="text-muted-foreground text-sm">
        Add animals to see your breed mix.
      </p>
    </div>
  );
}
